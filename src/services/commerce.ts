import { getAuthService } from './auth';
import { getFirestoreDb } from './firestore';
import { saveProduct, updateImages, requestQuote, quoteAction, orderAction } from './commerceTransactions';

const operations = { guardarProducto: saveProduct, actualizarImagenes: updateImages, solicitarCotizacion: requestQuote, actualizarCotizacion: quoteAction, actualizarPedido: orderAction };
export async function callCommerce(name: string, data: Record<string, unknown>): Promise<{ id: string; expired?: boolean }> {
  const user = getAuthService().currentUser;
  if (!user) throw new Error('Inicia sesión para continuar.');
  const operation = operations[name as keyof typeof operations];
  if (!operation) throw new Error('Operación no disponible.');
  try { return await operation(getFirestoreDb(), user.uid, data); }
  catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') throw new Error('La operación ya no está permitida. Revisa el estado del negocio, la solicitud y las existencias.');
    throw error;
  }
}
