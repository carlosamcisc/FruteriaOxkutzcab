import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase";

export function getFirestoreDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
