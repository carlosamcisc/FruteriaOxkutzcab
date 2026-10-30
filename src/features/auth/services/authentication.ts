import { doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "../../../services/firestore";
import { documentPaths } from "../../../shared/domain/paths";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getAuthService } from "../../../services/auth";

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(getAuthService(), callback);
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  return signInWithEmailAndPassword(
    getAuthService(),
    email.trim().toLowerCase(),
    password,
  );
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getAuthService(), email.trim().toLowerCase());
}

export async function logout(): Promise<void> {
  await signOut(getAuthService());
}

export async function isAdministrator(user: User, refresh = false): Promise<boolean> {
  return (await user.getIdTokenResult(refresh)).claims.admin === true;
}

export async function getAccountHome(uid: string) {
  const user = getAuthService().currentUser;
  if (user?.uid === uid && await isAdministrator(user)) return "#admin-inicio";
  const db = getFirestoreDb();
  const [seller, application] = await Promise.all([
    getDoc(doc(db, documentPaths.vendedor(uid))),
    getDoc(doc(db, documentPaths.solicitudVendedor(uid))),
  ]);
  return seller.exists() || application.exists() ? "#vendedor-inicio" : "#cliente-inicio";
}
