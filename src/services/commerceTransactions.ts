import { collection, doc, runTransaction, serverTimestamp, Timestamp, type Firestore, type Transaction } from 'firebase/firestore';
import type { Cotizacion, Pedido, Producto } from '../shared/domain/models';

type Input = Record<string, unknown>;
function text(value: unknown, max: number, required = true): string {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) throw new Error('Revisa los campos de texto.');
  return value.trim();
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new Error('Cantidad o precio fuera de rango.');
  return value;
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error('Identificador inválido.');
  return value;
}
function movement(tx: Transaction, db: Firestore, movementId: string, productId: string, sellerId: string, actorId: string, quantity: number, reason: string, orderId: string | null = null) {
  tx.set(doc(db, 'movimientosInventario', movementId), {
    productoId: productId, vendedorId: sellerId, actorId, cantidad: quantity,
    tipo: orderId ? quantity < 0 ? 'venta' : 'ajuste' : quantity > 0 ? 'entrada' : 'ajuste',
    motivo: reason, pedidoId: orderId, creadoEn: serverTimestamp(),
  });
}

export async function saveProduct(db: Firestore, uid: string, input: Input) {
  const ref = input.productId ? doc(db, 'productos', id(input.productId)) : doc(collection(db, 'productos'));
  const movementId = doc(collection(db, 'movimientosInventario')).id;
  const data = {
    nombre: text(input.nombre, 120), descripcion: text(input.descripcion, 2000, false),
    categoria: text(input.categoria, 60), presentacion: text(input.presentacion, 120),
    cantidadMinimaPedido: integer(input.cantidadMinimaPedido, 1, 1000000),
    cantidadDisponible: integer(input.cantidadDisponible, 0, 1000000),
    precioUnitarioCentavos: integer(input.precioUnitarioCentavos, 1, 999999999), estado: input.estado,
  };
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    const previous = snapshot.exists() ? snapshot.data() as Producto : null;
    if (previous && (previous.cantidadDisponible !== input.expectedStock || previous.presentacion !== data.presentacion)) throw new Error('El producto cambió. Cierra el formulario y vuelve a abrirlo.');
    const delta = data.cantidadDisponible - (previous?.cantidadDisponible ?? 0);
    const changed = !previous || delta !== 0;
    tx.set(ref, { ...data, vendedorId: uid, moneda: 'MXN', rutasImagenes: previous?.rutasImagenes ?? [],
      creadoEn: previous?.creadoEn ?? serverTimestamp(), actualizadoEn: serverTimestamp(),
      ultimoMovimientoId: changed ? movementId : previous?.ultimoMovimientoId ?? null });
    if (changed) movement(tx, db, movementId, ref.id, uid, uid, delta, previous ? 'Ajuste de existencias del vendedor' : 'Existencias iniciales');
  });
  return { id: ref.id };
}

export function isImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return value.length <= 2048 && /^https:\/\/[A-Za-z0-9.-]+(:[0-9]+)?([/?#][^\s]*)?$/.test(value) && url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export async function updateImages(db: Firestore, _uid: string, input: Input) {
  const ref = doc(db, 'productos', id(input.id));
  const paths = input.paths;
  if (!Array.isArray(paths) || paths.length > 5 || paths.some(value => typeof value !== 'string' || !isImageUrl(value)) || new Set(paths).size !== paths.length) throw new Error('Usa hasta cinco URLs HTTPS válidas y diferentes.');
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw new Error('El producto ya no existe.');
    if (JSON.stringify(snapshot.data().rutasImagenes) !== JSON.stringify(input.expectedPaths)) throw new Error('Las imágenes cambiaron. Vuelve a intentarlo.');
    tx.update(ref, { rutasImagenes: paths, actualizadoEn: serverTimestamp() });
  });
  return { id: ref.id };
}

export async function requestQuote(db: Firestore, uid: string, input: Input) {
  const productId = id(input.productId);
  const quantity = integer(input.quantity, 1, 1000000);
  const ref = doc(collection(db, 'cotizaciones'));
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(doc(db, 'productos', productId));
    if (!snapshot.exists()) throw new Error('El producto ya no está disponible.');
    const product = snapshot.data() as Producto;
    if (product.vendedorId === uid || product.estado !== 'publicado' || quantity < product.cantidadMinimaPedido || quantity > product.cantidadDisponible) throw new Error('Revisa el mínimo y las existencias; no puedes cotizar tus propios productos.');
    tx.set(ref, { compradorId: uid, vendedorId: product.vendedorId, estado: 'solicitada',
      elementos: [{ productoId: productId, nombreProducto: product.nombre, presentacion: product.presentacion, cantidad: quantity,
        precioUnitarioSolicitadoCentavos: product.precioUnitarioCentavos, precioUnitarioCotizadoCentavos: null }],
      notaComprador: text(input.note ?? '', 1000, false) || null, notaVendedor: null, venceEn: null,
      creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
  });
  return { id: ref.id };
}

export async function quoteAction(db: Firestore, uid: string, input: Input): Promise<{ id: string; expired?: boolean }> {
  const ref = doc(db, 'cotizaciones', id(input.id));
  return runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw new Error('La cotización ya no existe.');
    const quote = snapshot.data() as Cotizacion;
    if (quote.elementos.length !== 1) throw new Error('Solicita una cotización por producto.');
    const action = input.action;
    if (action === 'cotizar') {
      if (quote.estado !== 'solicitada') throw new Error('La cotización ya fue respondida.');
      tx.update(ref, { estado: 'cotizada', elementos: [{ ...quote.elementos[0], precioUnitarioCotizadoCentavos: integer(input.price, 1, 999999999) }],
        notaVendedor: text(input.note ?? '', 1000, false) || null, venceEn: Timestamp.fromMillis(Date.now() + 48 * 3600000 - 30000), actualizadoEn: serverTimestamp() });
    } else if (action === 'aceptar') {
      const orderRef = doc(db, 'pedidos', ref.id);
      const existing = await tx.get(orderRef);
      if (quote.estado === 'aceptada' && existing.exists()) return { id: ref.id };
      if (quote.estado !== 'cotizada') throw new Error('La cotización ya está cerrada.');
      if (!quote.venceEn || quote.venceEn.toMillis() <= Date.now()) {
        tx.update(ref, { estado: 'vencida', actualizadoEn: serverTimestamp() });
        return { id: ref.id, expired: true };
      }
      const line = quote.elementos[0];
      const productRef = doc(db, 'productos', line.productoId);
      const productSnapshot = await tx.get(productRef);
      if (!productSnapshot.exists()) throw new Error('El producto ya no existe.');
      const product = productSnapshot.data() as Producto;
      if (product.cantidadDisponible < line.cantidad) throw new Error('No hay existencias suficientes.');
      const price = integer(line.precioUnitarioCotizadoCentavos, 1, 999999999);
      const total = price * line.cantidad;
      const movementId = `reserva_${ref.id}`;
      tx.update(productRef, { cantidadDisponible: product.cantidadDisponible - line.cantidad, ultimoMovimientoId: movementId, actualizadoEn: serverTimestamp() });
      movement(tx, db, movementId, line.productoId, quote.vendedorId, uid, -line.cantidad, 'Reserva al aceptar cotización', ref.id);
      tx.set(orderRef, { cotizacionId: ref.id, compradorId: uid, vendedorId: quote.vendedorId,
        elementos: [{ productoId: line.productoId, nombreProducto: line.nombreProducto, presentacion: line.presentacion, cantidad: line.cantidad, precioUnitarioCentavos: price, totalLineaCentavos: total }],
        subtotalCentavos: total, moneda: 'MXN', estado: 'pendienteConfirmacionVendedor', estadoPagoEfectivo: 'pendiente', efectivoRecibidoEn: null,
        creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
      tx.update(ref, { estado: 'aceptada', actualizadoEn: serverTimestamp() });
    } else {
      if (!['solicitada', 'cotizada'].includes(quote.estado)) throw new Error('La cotización ya está cerrada.');
      if (!['cancelar', 'rechazar'].includes(String(action))) throw new Error('Acción no permitida.');
      tx.update(ref, { estado: action === 'cancelar' ? 'cancelada' : 'rechazada', actualizadoEn: serverTimestamp() });
    }
    return { id: ref.id };
  });
}

export async function orderAction(db: Firestore, uid: string, input: Input) {
  const ref = doc(db, 'pedidos', id(input.id));
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists()) throw new Error('El pedido ya no existe.');
    const order = snapshot.data() as Pedido;
    const action = input.action;
    if (action === 'cancelado') {
      if (order.estado === 'cancelado') return;
      const line = order.elementos[0];
      const productRef = doc(db, 'productos', line.productoId);
      const product = await tx.get(productRef);
      if (!product.exists()) throw new Error('El producto ya no existe.');
      const movementId = `cancelacion_${ref.id}`;
      tx.update(productRef, { cantidadDisponible: product.data().cantidadDisponible + line.cantidad, ultimoMovimientoId: movementId, actualizadoEn: serverTimestamp() });
      movement(tx, db, movementId, line.productoId, order.vendedorId, uid, line.cantidad, 'Devolución de reserva por cancelación', ref.id);
      tx.update(ref, { estado: 'cancelado', actualizadoEn: serverTimestamp() });
    } else if (action === 'pago') {
      if (order.estadoPagoEfectivo === 'recibido') return;
      tx.update(ref, { estadoPagoEfectivo: 'recibido', efectivoRecibidoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
    } else {
      if (order.estado === action) return;
      tx.update(ref, { estado: action, actualizadoEn: serverTimestamp() });
    }
  });
  return { id: ref.id };
}
