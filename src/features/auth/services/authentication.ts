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
