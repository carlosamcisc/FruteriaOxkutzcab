import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { getFirebaseApp } from './firebase';
let service: ReturnType<typeof getStorage> | undefined;
export function getStorageService() {
  if (!service) {
    service = getStorage(getFirebaseApp());
    if (import.meta.env.VITE_USE_EMULATORS === 'true') connectStorageEmulator(service, '127.0.0.1', 9199);
  }
  return service;
}
