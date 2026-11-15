import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [identity, action] = process.argv.slice(2);
if (!identity || !["grant", "revoke"].includes(action) || process.argv.length !== 4) {
  throw new Error("Uso: node scripts/set-admin-claim.mjs <uid-o-correo> <grant|revoke>");
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("Define GOOGLE_APPLICATION_CREDENTIALS con la ruta de tu cuenta de servicio.");
}
const projectId = "central-abastos-oxkutzcab";
const account = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, "utf8"));
if (account.project_id !== projectId) {
  throw new Error(`La cuenta de servicio debe pertenecer al proyecto ${projectId}.`);
}
const app = initializeApp({ credential: cert(account), projectId });
const auth = getAuth(app);
const user = identity.includes("@") ? await auth.getUserByEmail(identity) : await auth.getUser(identity);
const uid = user.uid;
if (action === "grant" && user.disabled) throw new Error("La cuenta está deshabilitada.");
const claims = { ...user.customClaims };
if (action === "grant") claims.admin = true;
else delete claims.admin;
await auth.setCustomUserClaims(uid, claims);
console.log(`Permiso de administrador ${action === "grant" ? "asignado" : "retirado"} para UID ${uid}. Renueva la sesión para actualizar el token.`);
await app.delete();
