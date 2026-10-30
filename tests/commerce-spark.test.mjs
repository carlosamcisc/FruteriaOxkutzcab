import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import { saveProduct, updateImages, requestQuote, quoteAction, orderAction } from '../src/services/commerceTransactions.ts';

let environment, productId;
const clients = new Map();
const seller = 'seller-one', buyer = 'buyer-one';
const db = uid => {
  if (!clients.has(uid)) clients.set(uid, environment.authenticatedContext(uid).firestore());
  return clients.get(uid);
};
const product = { nombre: 'Naranja', descripcion: 'Fresca', categoria: 'Frutas', presentacion: 'Caja de 20 kg', cantidadDisponible: 10, cantidadMinimaPedido: 2, precioUnitarioCentavos: 25000, estado: 'publicado' };
const seed = (path, value) => environment.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), path), value));
const read = async (uid, path) => (await getDoc(doc(db(uid), path))).data();
async function quote(uid = buyer, quantity = 2) {
  const { id } = await requestQuote(db(uid), uid, { productId, quantity });
  await quoteAction(db(seller), seller, { id, action: 'cotizar', price: 24000 });
  return id;
}
before(async () => {
  environment = await initializeTestEnvironment({ projectId: 'demo-fruteria-admin', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
});
beforeEach(async () => {
  await environment.clearFirestore();
  await seed(`vendedores/${seller}`, { propietarioId: seller, estado: 'activo' });
  productId = (await saveProduct(db(seller), seller, product)).id;
});
after(async () => environment?.cleanup());

test('vendedor crea y ajusta producto con historial atómico', async () => {
  await saveProduct(db(seller), seller, { ...product, productId, expectedStock: 10, cantidadDisponible: 12 });
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 12);
  assert.equal((await getDocs(query(collection(db(seller), 'movimientosInventario'), where('vendedorId', '==', seller)))).size, 2);
});
test('no permite stock sin movimiento, movimiento suelto ni reescribir el historial', async () => {
  const path = `productos/${productId}`;
  await assertFails(updateDoc(doc(db(seller), path), { cantidadDisponible: 100, actualizadoEn: serverTimestamp() }));
  const old = await read(seller, path);
  await assertFails(updateDoc(doc(db(seller), `movimientosInventario/${old.ultimoMovimientoId}`), { cantidad: 100 }));
  await assertFails(setDoc(doc(db(seller), 'movimientosInventario/forged'), { productoId: productId, vendedorId: seller, actorId: seller, cantidad: 100, tipo: 'entrada', motivo: 'Inventado', pedidoId: null, creadoEn: serverTimestamp() }));
});
test('cliente y otro vendedor no editan productos ajenos', async () => {
  await seed('vendedores/other', { propietarioId: 'other', estado: 'activo' });
  await assert.rejects(saveProduct(db(buyer), buyer, product));
  await assert.rejects(saveProduct(db('other'), 'other', { ...product, productId, expectedStock: 10 }));
});
test('aceptación repetida crea un pedido y descuenta una sola reserva', async () => {
  const id = await quote();
  await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  assert.equal((await read(buyer, `pedidos/${id}`)).subtotalCentavos, 48000);
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 8);
});
test('dos compradores no pueden sobrevendender las mismas existencias', async () => {
  const a = await quote(buyer, 6), b = await quote('buyer-two', 6);
  const results = await Promise.allSettled([quoteAction(db(buyer), buyer, { id: a, action: 'aceptar' }), quoteAction(db('buyer-two'), 'buyer-two', { id: b, action: 'aceptar' })]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 4);
});
test('cancelación devuelve la reserva una sola vez y deja historial', async () => {
  const id = await quote(); await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  await orderAction(db(buyer), buyer, { id, action: 'cancelado' });
  await orderAction(db(buyer), buyer, { id, action: 'cancelado' });
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 10);
  assert.equal((await read(seller, `movimientosInventario/cancelacion_${id}`)).tipo, 'ajuste');
});
test('sin transacción no puede aceptar cotización ni cancelar pedido', async () => {
  const id = await quote();
  await assertFails(updateDoc(doc(db(buyer), `cotizaciones/${id}`), { estado: 'aceptada', actualizadoEn: serverTimestamp() }));
  await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  await assertFails(updateDoc(doc(db(buyer), `pedidos/${id}`), { estado: 'cancelado', actualizadoEn: serverTimestamp() }));
});
test('transiciones y pago solo corresponden al vendedor y en orden', async () => {
  const id = await quote(); await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  await assert.rejects(orderAction(db(buyer), buyer, { id, action: 'confirmado' }));
  await assert.rejects(orderAction(db(seller), seller, { id, action: 'entregado' }));
  await assert.rejects(orderAction(db(seller), seller, { id, action: 'pago' }));
  for (const action of ['confirmado', 'preparando', 'listo', 'entregado', 'pago']) await orderAction(db(seller), seller, { id, action });
  const paid = await read(buyer, `pedidos/${id}`);
  await orderAction(db(seller), seller, { id, action: 'pago' });
  assert.equal(paid.estadoPagoEfectivo, 'recibido');
  assert.equal(paid.efectivoRecibidoEn.toMillis(), (await read(buyer, `pedidos/${id}`)).efectivoRecibidoEn.toMillis());
  await assert.rejects(orderAction(db(seller), seller, { id, action: 'cancelado' }));
});
test('cotización vencida no reserva existencias', async () => {
  const id = await quote();
  const data = await read(buyer, `cotizaciones/${id}`);
  await seed(`cotizaciones/${id}`, { ...data, venceEn: Timestamp.fromMillis(1) });
  assert.equal((await quoteAction(db(buyer), buyer, { id, action: 'aceptar' })).expired, true);
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 10);
});
test('suspensión impide edición y aceptación, pero permite terminar pedidos previos', async () => {
  const a = await quote(), b = await quote();
  await quoteAction(db(buyer), buyer, { id: a, action: 'aceptar' });
  await seed(`vendedores/${seller}`, { propietarioId: seller, estado: 'suspendido' });
  await assert.rejects(quoteAction(db(buyer), buyer, { id: b, action: 'aceptar' }));
  await assert.rejects(saveProduct(db(seller), seller, { ...product, productId, expectedStock: 8 }));
  await assert.rejects(requestQuote(db(buyer), buyer, { productId, quantity: 2 }));
  await orderAction(db(seller), seller, { id: a, action: 'confirmado' });
});
test('solo acepta URLs HTTPS; imágenes no alteran existencias', async () => {
  const paths = ['https://images.example.com/orange.jpg'];
  await updateImages(db(seller), seller, { id: productId, paths, expectedPaths: [] });
  assert.deepEqual((await read(seller, `productos/${productId}`)).rutasImagenes, paths);
  await assert.rejects(updateImages(db(buyer), buyer, { id: productId, paths: [], expectedPaths: paths }));
  for (const value of ['javascript:alert(1)', 'http://example.com/a.jpg', 'data:image/png;base64,abcd', 'https://user:pass@example.com/a.jpg']) {
    await assertFails(updateDoc(doc(db(seller), `productos/${productId}`), { rutasImagenes: [value], actualizadoEn: serverTimestamp() }));
  }
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 10);
});
test('edición obsoleta no sobrescribe reserva; presentación es inmutable', async () => {
  const id = await quote(); await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  await assert.rejects(saveProduct(db(seller), seller, { ...product, productId, expectedStock: 10 }));
  await assertFails(updateDoc(doc(db(seller), `productos/${productId}`), { presentacion: 'Kilogramo', actualizadoEn: serverTimestamp() }));
});
test('no puede cambiar cantidad o precio solicitado ni cotizar como comprador', async () => {
  const { id } = await requestQuote(db(buyer), buyer, { productId, quantity: 2 });
  const before = await read(buyer, `cotizaciones/${id}`);
  await assert.rejects(quoteAction(db(buyer), buyer, { id, action: 'cotizar', price: 1 }));
  await assertFails(updateDoc(doc(db(seller), `cotizaciones/${id}`), { estado: 'cotizada', elementos: [{ ...before.elementos[0], cantidad: 1, precioUnitarioCotizadoCentavos: 1 }], venceEn: Timestamp.fromMillis(Date.now() + 3600000), actualizadoEn: serverTimestamp() }));
});

async function forgedAcceptance(id, options = {}) {
  const database = db(buyer);
  const quoteData = await read(buyer, `cotizaciones/${id}`);
  const requested = quoteData.elementos[0];
  const line = { productoId: productId, nombreProducto: requested.nombreProducto, presentacion: requested.presentacion,
    cantidad: requested.cantidad, precioUnitarioCentavos: requested.precioUnitarioCotizadoCentavos,
    totalLineaCentavos: requested.cantidad * requested.precioUnitarioCotizadoCentavos, ...options.line };
  const oldProduct = await read(buyer, `productos/${productId}`);
  const movementId = `reserva_${id}`;
  const delta = options.delta ?? -line.cantidad;
  const batch = writeBatch(database);
  batch.update(doc(database, `productos/${productId}`), { cantidadDisponible: oldProduct.cantidadDisponible + delta, ultimoMovimientoId: movementId, actualizadoEn: serverTimestamp() });
  if (!options.omitMovement) batch.set(doc(database, `movimientosInventario/${movementId}`), {
    productoId: productId, vendedorId: seller, actorId: buyer, cantidad: delta, tipo: 'venta', motivo: 'Reserva', pedidoId: id, creadoEn: serverTimestamp(),
  });
  batch.set(doc(database, `pedidos/${id}`), {
    cotizacionId: id, compradorId: buyer, vendedorId: seller, elementos: [line], subtotalCentavos: line.totalLineaCentavos,
    moneda: 'MXN', estado: 'pendienteConfirmacionVendedor', estadoPagoEfectivo: 'pendiente', efectivoRecibidoEn: null,
    creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(), ...options.order,
  });
  if (!options.omitQuote) batch.update(doc(database, `cotizaciones/${id}`), { estado: 'aceptada', actualizadoEn: serverTimestamp() });
  return batch.commit();
}

test('reglas rechazan lotes completos con precios, totales, cantidades o estados manipulados', async () => {
  const id = await quote();
  for (const options of [
    { order: { subtotalCentavos: 1 } },
    { line: { precioUnitarioCentavos: 1, totalLineaCentavos: 2 } },
    { line: { cantidad: 1, totalLineaCentavos: 24000 } },
    { delta: -1 }, { omitMovement: true }, { omitQuote: true },
    { order: { estado: 'entregado' } }, { order: { estadoPagoEfectivo: 'recibido' } },
    { order: { compradorId: 'other' } }, { order: { extra: true } },
  ]) await assertFails(forgedAcceptance(id, options));
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 10);
  assert.equal((await read(buyer, `cotizaciones/${id}`)).estado, 'cotizada');
  await forgedAcceptance(id);
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 8);
});

test('ni siquiera el dueño puede inventar un movimiento de venta sin pedido', async () => {
  const database = db(seller);
  const batch = writeBatch(database);
  const movementId = 'reserva_fake';
  batch.update(doc(database, `productos/${productId}`), { cantidadDisponible: 9, ultimoMovimientoId: movementId, actualizadoEn: serverTimestamp() });
  batch.set(doc(database, `movimientosInventario/${movementId}`), { productoId: productId, vendedorId: seller, actorId: seller, cantidad: -1, tipo: 'venta', motivo: 'Venta falsa', pedidoId: 'fake', creadoEn: serverTimestamp() });
  await assertFails(batch.commit());
});

test('comprador no cancela confirmado y nadie cancela en preparación', async () => {
  const id = await quote(); await quoteAction(db(buyer), buyer, { id, action: 'aceptar' });
  await orderAction(db(seller), seller, { id, action: 'confirmado' });
  await assert.rejects(orderAction(db(buyer), buyer, { id, action: 'cancelado' }));
  await orderAction(db(seller), seller, { id, action: 'preparando' });
  await assert.rejects(orderAction(db(seller), seller, { id, action: 'cancelado' }));
  assert.equal((await read(seller, `productos/${productId}`)).cantidadDisponible, 8);
});

test('migración de productos previos conserva stock y no duplica saldos iniciales', async () => {
  await seed('productos/legacy', { ...product, vendedorId: seller, cantidadDisponible: 6, moneda: 'MXN', rutasImagenes: [], creadoEn: Timestamp.fromMillis(1000), actualizadoEn: Timestamp.fromMillis(1000) });
  const run = () => promisify(execFile)(process.execPath, ['scripts/migrate-spark-inventory.mjs', '--project=demo-fruteria-admin', '--apply'], { env: process.env, timeout: 30000 });
  await run();
  const migrated = await read(seller, 'productos/legacy');
  assert.equal(migrated.cantidadDisponible, 6);
  assert.equal(migrated.creadoEn.toMillis(), 1000);
  const initial = await read(seller, `movimientosInventario/${migrated.ultimoMovimientoId}`);
  assert.equal(initial.cantidad, 6);
  await run();
  const movements = await getDocs(query(collection(db(seller), 'movimientosInventario'), where('productoId', '==', 'legacy'), where('vendedorId', '==', seller)));
  assert.equal(movements.size, 1);
});
