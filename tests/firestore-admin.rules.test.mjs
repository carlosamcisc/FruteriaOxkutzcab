import { readFileSync } from "node:fs";
import { before, after, beforeEach, test } from "node:test";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";

let environment;
const uid = "seller-one";
const adminUid = "admin-one";
const applicationPath = `solicitudesVendedores/${uid}`;
const sellerPath = `vendedores/${uid}`;
const application = {
  propietarioId: uid, nombreNegocio: "Huerta de prueba", descripcion: "Frutas de temporada",
  telefonoContacto: "9991234567", municipio: "Oxkutzcab", estado: "pendiente",
  enviadoEn: Timestamp.fromMillis(1000), revisadoEn: null, revisadoPor: null, motivoRechazo: null,
};
const profile = {
  propietarioId: uid, nombreNegocio: application.nombreNegocio, descripcion: application.descripcion,
  telefonoContacto: application.telefonoContacto, municipio: application.municipio,
  estado: "activo", creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(),
};
const admin = () => environment.authenticatedContext(adminUid, { admin: true }).firestore();
const customer = () => environment.authenticatedContext(uid).firestore();
const review = (estado = "aprobada", motivoRechazo = null) => ({ estado, motivoRechazo, revisadoPor: adminUid, revisadoEn: serverTimestamp() });
function approval(db, seller = profile, changes = review()) {
  const batch = writeBatch(db);
  batch.update(doc(db, applicationPath), changes);
  batch.set(doc(db, sellerPath), seller);
  return batch.commit();
}
async function seed(path, data) {
  await environment.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), path), data));
}
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-fruteria-admin",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
});
beforeEach(async () => { await environment.clearFirestore(); await seed(applicationPath, application); });
after(async () => { await environment?.cleanup(); });

test("solo el administrador puede listar solicitudes privadas", async () => {
  await assertSucceeds(getDocs(collection(admin(), "solicitudesVendedores")));
  await assertFails(getDocs(collection(customer(), "solicitudesVendedores")));
  await assertFails(getDocs(collection(environment.unauthenticatedContext().firestore(), "solicitudesVendedores")));
  await assertSucceeds(getDoc(doc(customer(), applicationPath)));
});
test("un vendedor no puede aprobarse ni crear su perfil", async () => {
  await assertFails(approval(customer()));
  await assertFails(setDoc(doc(customer(), sellerPath), profile));
});
test("un campo admin en el perfil del usuario no concede permisos", async () => {
  await seed(`usuarios/${uid}`, { admin: true });
  await assertFails(approval(customer()));
});
test("un administrador aprueba y habilita el negocio en una sola escritura", async () => {
  await assertSucceeds(approval(admin()));
  const seller = await getDoc(doc(customer(), sellerPath));
  if (seller.data().estado !== "activo") throw new Error("El negocio no quedó activo");
});
test("la aprobación sin creación de perfil es rechazada", async () => {
  await assertFails(updateDoc(doc(admin(), applicationPath), review()));
});
test("la creación de perfil sin aprobación simultánea es rechazada", async () => {
  await assertFails(setDoc(doc(admin(), sellerPath), profile));
});
test("la aprobación no puede cambiar el negocio ni asignar otro propietario", async () => {
  await assertFails(approval(admin(), { ...profile, propietarioId: "other-user" }));
  await assertFails(approval(admin(), { ...profile, nombreNegocio: "Otro negocio" }));
  await assertFails(approval(admin(), profile, { ...review(), municipio: "Otro municipio" }));
});
test("rechazar requiere un motivo y registra al administrador", async () => {
  await assertFails(updateDoc(doc(admin(), applicationPath), review("rechazada", "")));
  await assertSucceeds(updateDoc(doc(admin(), applicationPath), review("rechazada", "Datos incompletos")));
  await assertFails(approval(admin()));
});
test("se puede completar una solicitud ya aprobada que no tiene perfil", async () => {
  await seed(applicationPath, { ...application, estado: "aprobada" });
  await assertSucceeds(approval(admin()));
});
test("un perfil existente, incluso suspendido, no puede sobrescribirse al aprobar", async () => {
  await seed(sellerPath, { ...profile, estado: "suspendido" });
  await assertFails(approval(admin()));
  await assertFails(updateDoc(doc(admin(), sellerPath), { estado: "activo" }));
});
