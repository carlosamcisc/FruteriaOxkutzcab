import {
  createUserWithEmailAndPassword,
  deleteUser,
  type UserCredential,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { getAuthService } from "../../../services/auth";
import { getFirestoreDb } from "../../../services/firestore";
import { documentPaths } from "../../../shared/domain/paths";

export interface CustomerRegistrationData {
  displayName: string;
  email: string;
  password: string;
  phone: string;
}

export interface SellerRegistrationData extends CustomerRegistrationData {
  businessName: string;
  description: string;
  municipality: string;
}

function applicationData(uid: string, data: SellerRegistrationData) {
  const values = [[data.businessName, 120], [data.description, 2000], [data.phone, 30], [data.municipality, 120]] as const;
  if (values.some(([value, max]) => !value.trim() || value.trim().length > max)) throw new Error('Completa los datos del negocio y revisa sus longitudes.');
  return {
    propietarioId: uid, nombreNegocio: data.businessName.trim(), descripcion: data.description.trim(),
    telefonoContacto: data.phone.trim(), municipio: data.municipality.trim(), estado: 'pendiente',
    enviadoEn: serverTimestamp(), revisadoEn: null, revisadoPor: null, motivoRechazo: null,
  };
}

/** Existing customers keep their UID and can correct a rejected application. */
export async function submitSellerApplication(uid: string, data: SellerRegistrationData): Promise<void> {
  const db = getFirestoreDb();
  await runTransaction(db, async tx => {
    const ref = doc(db, documentPaths.solicitudVendedor(uid));
    const [application, seller] = await Promise.all([tx.get(ref), tx.get(doc(db, documentPaths.vendedor(uid)))]);
    if (seller.exists()) throw new Error('Tu negocio ya está habilitado.');
    if (application.exists() && application.data().estado !== 'rechazada') throw new Error('Tu solicitud ya está en revisión.');
    tx.set(ref, applicationData(uid, data));
  });
}

async function createAccount(
  data: CustomerRegistrationData,
): Promise<UserCredential> {
  if (!data.displayName.trim() || data.displayName.trim().length > 120 || !data.phone.trim() || data.phone.trim().length > 30) throw new Error('Revisa tu nombre y teléfono.');
  return createUserWithEmailAndPassword(
    getAuthService(),
    data.email.trim().toLowerCase(),
    data.password,
  );
}

export async function registerCustomer(
  data: CustomerRegistrationData,
): Promise<void> {
  const credential = await createAccount(data);
  try {
    const now = serverTimestamp();
    await setDoc(doc(getFirestoreDb(), documentPaths.usuario(credential.user.uid)), {
      nombre: data.displayName.trim(),
      correo: data.email.trim().toLowerCase(),
      telefono: data.phone.trim() || null,
      creadoEn: now,
      actualizadoEn: now,
    });
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function registerSeller(
  data: SellerRegistrationData,
): Promise<void> {
  // Validate before creating an Authentication account.
  applicationData('validation', data);
  const credential = await createAccount(data);
  try {
    const db = getFirestoreDb();
    const now = serverTimestamp();
    const batch = writeBatch(db);
    const userReference = doc(db, documentPaths.usuario(credential.user.uid));
    const applicationReference = doc(
      db,
      documentPaths.solicitudVendedor(credential.user.uid),
    );

    batch.set(userReference, {
      nombre: data.displayName.trim(),
      correo: data.email.trim().toLowerCase(),
      telefono: data.phone.trim() || null,
      creadoEn: now,
      actualizadoEn: now,
    });
    batch.set(applicationReference, applicationData(credential.user.uid, data));

    await batch.commit();
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}
