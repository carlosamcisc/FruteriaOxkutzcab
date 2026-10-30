import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./firebase";

let service: Auth | undefined;
export function getAuthService(): Auth {
  if (!service) {
    service = getAuth(getFirebaseApp());
    if (import.meta.env.VITE_USE_EMULATORS === 'true') connectAuthEmulator(service, 'http://127.0.0.1:9099');
  }
  return service;
}
