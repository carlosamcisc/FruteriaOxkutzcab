import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BusinessError, saveProduct, updateImages, requestQuote, quoteAction, orderAction } from './commerce.js';

initializeApp();
const callable = handler => onCall({ region: 'us-central1', maxInstances: 10 }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.');
  if (!request.data || typeof request.data !== 'object') throw new HttpsError('invalid-argument', 'Datos inválidos.');
  try { return await handler(getFirestore(), request.auth.uid, request.data); }
  catch (error) {
    if (error instanceof BusinessError) throw new HttpsError('failed-precondition', error.message);
    console.error('Operación comercial fallida', error);
    throw new HttpsError('internal', 'No se completó la operación. Intenta nuevamente.');
  }
});
export const guardarProducto = callable(saveProduct);
export const actualizarImagenes = callable(updateImages);
export const solicitarCotizacion = callable(requestQuote);
export const actualizarCotizacion = callable(quoteAction);
export const actualizarPedido = callable(orderAction);
