import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "../../../services/firestore";
import { collections, documentPaths } from "../../../shared/domain/paths";
import type { PerfilVendedor, SolicitudVendedor } from "../../../shared/domain/models";

export type SolicitudConId = SolicitudVendedor & { id: string };
export type VendedorConId = PerfilVendedor & { id: string };

export function observeApplications(next: (items: SolicitudConId[]) => void, error: (error: Error) => void) {
  return onSnapshot(collection(getFirestoreDb(), collections.solicitudesVendedores), snapshot => {
    const items = snapshot.docs.map(item => ({ ...item.data() as SolicitudVendedor, id: item.id }));
    items.sort((a, b) => (b.enviadoEn?.toMillis() ?? 0) - (a.enviadoEn?.toMillis() ?? 0));
    next(items);
  }, error);
}

export function observeSellers(next: (items: VendedorConId[]) => void, error: (error: Error) => void) {
  return onSnapshot(collection(getFirestoreDb(), collections.vendedores), snapshot => {
    next(snapshot.docs.map(item => ({ ...item.data() as PerfilVendedor, id: item.id })));
  }, error);
}

export async function reviewApplication(uid: string, adminUid: string, decision: "aprobada" | "rechazada", reason: string) {
  const db = getFirestoreDb();
  if (decision === "rechazada" && (!reason.trim() || reason.trim().length > 1000)) {
    throw new Error("Escribe un motivo de rechazo de entre 1 y 1000 caracteres.");
  }
  await runTransaction(db, async transaction => {
    const applicationRef = doc(db, documentPaths.solicitudVendedor(uid));
    const sellerRef = doc(db, documentPaths.vendedor(uid));
    const application = await transaction.get(applicationRef);
    const seller = await transaction.get(sellerRef);
    if (!application.exists()) throw new Error("La solicitud ya no existe.");
    const data = application.data() as SolicitudVendedor;
    if (data.propietarioId !== uid) throw new Error("El propietario de la solicitud no coincide con su identificador.");
    if (seller.exists()) throw new Error("Este negocio ya tiene un perfil. No se modificó su estado.");
    if (data.estado !== "pendiente" && !(decision === "aprobada" && data.estado === "aprobada")) {
      throw new Error("La solicitud ya fue revisada. Actualiza la lista antes de continuar.");
    }
    const now = serverTimestamp();
    transaction.update(applicationRef, {
      estado: decision, revisadoEn: now, revisadoPor: adminUid,
      motivoRechazo: decision === "rechazada" ? reason.trim() : null,
    });
    if (decision === "aprobada") {
      transaction.set(sellerRef, {
        propietarioId: uid, nombreNegocio: data.nombreNegocio, descripcion: data.descripcion,
        telefonoContacto: data.telefonoContacto, municipio: data.municipio,
        estado: "activo", creadoEn: now, actualizadoEn: now,
      });
    }
  });
}
