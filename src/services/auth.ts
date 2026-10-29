import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./firebase";

export function getAuthService(): Auth {
  return getAuth(getFirebaseApp());
}
