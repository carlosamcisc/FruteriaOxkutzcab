import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './firebase';

let service: ReturnType<typeof getFunctions> | undefined;
export function callCommerce<T = { id: string; expired?: boolean }>(name: string, data: unknown): Promise<T> {
  if (!service) {
    service = getFunctions(getFirebaseApp(), 'us-central1');
    if (import.meta.env.VITE_USE_EMULATORS === 'true') connectFunctionsEmulator(service, '127.0.0.1', 5001);
  }
  return httpsCallable<unknown, T>(service, name)(data).then(result => result.data);
}
