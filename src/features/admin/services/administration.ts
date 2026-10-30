import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "../../../services/firestore";
import { updateDoc, Timestamp } from 'firebase/firestore';
import { collections, documentPaths } from "../../../shared/domain/paths";
import type { PerfilVendedor, SolicitudVendedor } from "../../../shared/domain/models";

export type SolicitudConId = Omit<SolicitudVendedor, 'enviadoEn'> & { id: string; enviadoEn: Timestamp | null; datosInvalidos: boolean };
export type VendedorConId = PerfilVendedor & { id: string };

export async function setSellerStatus(uid: string, estado: PerfilVendedor['estado']) {
  await updateDoc(doc(getFirestoreDb(), documentPaths.vendedor(uid)), { estado, actualizadoEn: serverTimestamp() });
}

export function observeApplications(next: (items: SolicitudConId[]) => void, error: (error: Error) => void) {
  return onSnapshot(collection(getFirestoreDb(), collections.solicitudesVendedores), snapshot => {
    const items: SolicitudConId[] = snapshot.docs.map(item => {
      const data = item.data();
      const string = (key: string) => typeof data[key] === 'string' ? data[key] as string : '';
      const state = ['pendiente', 'aprobada', 'rechazada'].includes(data.estado) ? data.estado as SolicitudVendedor['estado'] : 'pendiente';
      const validDate = data.enviadoEn instanceof Timestamp;
      return {
        id: item.id, propietarioId: string('propietarioId'), nombreNegocio: string('nombreNegocio'),
        descripcion: string('descripcion'), telefonoContacto: string('telefonoContacto'), municipio: string('municipio'),
        estado: state, enviadoEn: validDate ? data.enviadoEn as Timestamp : null,
        revisadoEn: data.revisadoEn instanceof Timestamp ? data.revisadoEn : null,
        revisadoPor: typeof data.revisadoPor === 'string' ? data.revisadoPor : null,
        motivoRechazo: typeof data.motivoRechazo === 'string' ? data.motivoRechazo : null,
        datosInvalidos: !validDate || !['propietarioId', 'nombreNegocio', 'descripcion', 'telefonoContacto', 'municipio'].every(key => typeof data[key] === 'string' && data[key].trim()) || !['pendiente', 'aprobada', 'rechazada'].includes(data.estado),
      };
    });
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
