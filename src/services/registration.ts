import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  type UserCredential,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseApp } from "./firebase";
import { getFirestoreDb } from "./firestore";
import { documentPaths } from "../features/database/paths";

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

function getAuthService() {
  return getAuth(getFirebaseApp());
}

async function createAccount(
  data: CustomerRegistrationData,
): Promise<UserCredential> {
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
    await deleteUser(credential.user);
    throw error;
  }
}

export async function registerSeller(
  data: SellerRegistrationData,
): Promise<void> {
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
    batch.set(applicationReference, {
      propietarioId: credential.user.uid,
      nombreNegocio: data.businessName.trim(),
      descripcion: data.description.trim(),
      telefonoContacto: data.phone.trim(),
      municipio: data.municipality.trim(),
      estado: "pendiente",
      enviadoEn: now,
      revisadoEn: null,
      revisadoPor: null,
      motivoRechazo: null,
    });

    await batch.commit();
  } catch (error) {
    await deleteUser(credential.user);
    throw error;
  }
}
