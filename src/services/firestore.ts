import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";

let service: Firestore | undefined;
export function getFirestoreDb(): Firestore {
  if (!service) {
    service = getFirestore(getFirebaseApp());
    if (import.meta.env.VITE_USE_EMULATORS === 'true') connectFirestoreEmulator(service, '127.0.0.1', 8080);
  }
  return service;
}
