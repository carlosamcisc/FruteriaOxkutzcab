import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { saveProduct, requestQuote, quoteAction, orderAction, updateImages } from '../commerce.js';

const projectId = 'demo-fruteria-admin';
let app, db, productId;
const seller = 'seller-one', buyer = 'buyer-one';
const product = { nombre: 'Naranja', descripcion: 'Fresca', categoria: 'Cítricos', presentacion: 'Caja 20 kg',
  cantidadMinimaPedido: 2, cantidadDisponible: 10, precioUnitarioCentavos: 25000, estado: 'publicado' };
before(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Estas pruebas requieren el emulador; nunca usan producción.');
  app = initializeApp({ projectId }, 'commerce-tests'); db = getFirestore(app);
});
beforeEach(async () => {
  await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`, { method: 'DELETE' });
  await db.doc(`vendedores/${seller}`).set({ propietarioId: seller, estado: 'activo' });
  productId = (await saveProduct(db, seller, product)).id;
});
after(async () => { await db?.terminate(); if (app) await deleteApp(app); });
async function quoted(uid = buyer, quantity = 2) {
  const { id } = await requestQuote(db, uid, { productId, quantity });
  await quoteAction(db, seller, { id, action: 'cotizar', price: 24000 });
  return id;
}
const getProduct = async () => (await db.doc(`productos/${productId}`).get()).data();

test('el servidor toma el precio y propietario del producto, no del comprador', async () => {
  const { id } = await requestQuote(db, buyer, { productId, quantity: 2, price: 1, vendedorId: buyer });
  const quote = (await db.doc(`cotizaciones/${id}`).get()).data();
  assert.equal(quote.vendedorId, seller);
  assert.equal(quote.elementos[0].precioUnitarioSolicitadoCentavos, 25000);
  assert.equal(quote.estado, 'solicitada');
});
test('no permite autocotizar, cantidades inválidas ni productos no publicados', async () => {
  await assert.rejects(requestQuote(db, seller, { productId, quantity: 2 }));
  for (const quantity of [1, 11, -1, 2.5, '2']) await assert.rejects(requestQuote(db, buyer, { productId, quantity }));
  await db.doc(`productos/${productId}`).update({ estado: 'pausado' });
  await assert.rejects(requestQuote(db, buyer, { productId, quantity: 2 }));
});
test('solo las partes pueden operar y solo el vendedor responde', async () => {
  const id = await quoted();
  await assert.rejects(quoteAction(db, 'intruder', { id, action: 'aceptar' }));
  await assert.rejects(quoteAction(db, seller, { id, action: 'aceptar' }));
  await assert.rejects(quoteAction(db, buyer, { id, action: 'cotizar', price: 1 }));
  await assert.rejects(quoteAction(db, buyer, { id, action: 'unknown' }));
});
test('aceptación idempotente crea un pedido con total confiable y una reserva', async () => {
  const id = await quoted();
  await quoteAction(db, buyer, { id, action: 'aceptar', total: 1 });
  await quoteAction(db, buyer, { id, action: 'aceptar' });
  const order = (await db.doc(`pedidos/${id}`).get()).data();
  assert.equal(order.subtotalCentavos, 48000);
  assert.equal(order.estadoPagoEfectivo, 'pendiente');
  assert.equal((await getProduct()).cantidadDisponible, 8);
  assert.equal((await db.collection('pedidos').get()).size, 1);
});
test('aceptaciones concurrentes no sobrevenden existencias', async () => {
  const a = await quoted(buyer, 6), b = await quoted('buyer-two', 6);
  const results = await Promise.allSettled([
    quoteAction(db, buyer, { id: a, action: 'aceptar' }),
    quoteAction(db, 'buyer-two', { id: b, action: 'aceptar' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await getProduct()).cantidadDisponible, 4);
});
test('una cotización vencida no crea pedido ni reserva', async () => {
  const id = await quoted();
  await db.doc(`cotizaciones/${id}`).update({ venceEn: Timestamp.fromMillis(1) });
  assert.equal((await quoteAction(db, buyer, { id, action: 'aceptar' })).expired, true);
  assert.equal((await db.doc(`cotizaciones/${id}`).get()).data().estado, 'vencida');
  assert.equal((await getProduct()).cantidadDisponible, 10);
  assert.equal((await db.collection('pedidos').get()).size, 0);
});
test('suspensión bloquea cotizaciones, aceptación, imágenes y edición', async () => {
  const id = await quoted();
  await db.doc(`vendedores/${seller}`).update({ estado: 'suspendido' });
  await assert.rejects(requestQuote(db, buyer, { productId, quantity: 2 }));
  await assert.rejects(quoteAction(db, buyer, { id, action: 'aceptar' }));
  await assert.rejects(saveProduct(db, seller, { ...product, productId, expectedStock: 10 }));
  await assert.rejects(updateImages(db, seller, { id: productId, paths: [], expectedPaths: [] }));
});
test('cancelación repetida devuelve la reserva una sola vez y audita movimientos', async () => {
  const id = await quoted();
  await quoteAction(db, buyer, { id, action: 'aceptar' });
  await orderAction(db, buyer, { id, action: 'cancelado' });
  await orderAction(db, buyer, { id, action: 'cancelado' });
  assert.equal((await getProduct()).cantidadDisponible, 10);
  const movements = (await db.collection('movimientosInventario').get()).docs.map(doc => doc.data());
  assert.equal(movements.length, 3);
  assert.equal(movements.find(move => move.cantidad === 2).tipo, 'ajuste');
  assert.equal(movements.reduce((sum, move) => sum + move.cantidad, 0), 10);
});
test('pedido respeta transiciones, roles y registra efectivo solo una vez tras entregar', async () => {
  const id = await quoted(); await quoteAction(db, buyer, { id, action: 'aceptar' });
  await assert.rejects(orderAction(db, 'intruder', { id, action: 'confirmado' }));
  await assert.rejects(orderAction(db, buyer, { id, action: 'confirmado' }));
  await assert.rejects(orderAction(db, seller, { id, action: 'entregado' }));
  await assert.rejects(orderAction(db, seller, { id, action: 'pago' }));
  for (const action of ['confirmado', 'preparando', 'listo', 'entregado', 'pago']) await orderAction(db, seller, { id, action });
  const paid = (await db.doc(`pedidos/${id}`).get()).data();
  await orderAction(db, seller, { id, action: 'pago' });
  const again = (await db.doc(`pedidos/${id}`).get()).data();
  assert.equal(paid.estadoPagoEfectivo, 'recibido');
  assert.equal(paid.efectivoRecibidoEn.toMillis(), again.efectivoRecibidoEn.toMillis());
  await assert.rejects(orderAction(db, seller, { id, action: 'cancelado' }));
});
test('comprador no cancela un pedido confirmado y vendedor no cancela uno en preparación', async () => {
  const id = await quoted(); await quoteAction(db, buyer, { id, action: 'aceptar' });
  await orderAction(db, seller, { id, action: 'confirmado' });
  await assert.rejects(orderAction(db, buyer, { id, action: 'cancelado' }));
  await orderAction(db, seller, { id, action: 'preparando' });
  await assert.rejects(orderAction(db, seller, { id, action: 'cancelado' }));
});
test('edición obsoleta no sobrescribe una reserva concurrente', async () => {
  const id = await quoted(); await quoteAction(db, buyer, { id, action: 'aceptar' });
  await assert.rejects(saveProduct(db, seller, { ...product, productId, expectedStock: 10 }));
  assert.equal((await getProduct()).cantidadDisponible, 8);
  await saveProduct(db, seller, { ...product, productId, expectedStock: 8, cantidadDisponible: 12 });
  assert.equal((await getProduct()).cantidadDisponible, 12);
});
test('imágenes de otro vendedor, rutas falsas y cambios obsoletos se rechazan', async () => {
  const path = `productos/${seller}/${productId}/photo.jpg`;
  await assert.rejects(updateImages(db, seller, { id: productId, paths: ['productos/other/photo.jpg'], expectedPaths: [] }));
  await updateImages(db, seller, { id: productId, paths: [path], expectedPaths: [] });
  await assert.rejects(updateImages(db, seller, { id: productId, paths: [], expectedPaths: [] }));
  assert.equal((await getProduct()).cantidadDisponible, 10);
});

test('la presentación del inventario no puede cambiar con una edición', async () => {
  await assert.rejects(saveProduct(db, seller, { ...product, productId, expectedStock: 10, presentacion: 'Kilogramo' }));
  assert.equal((await getProduct()).presentacion, product.presentacion);
});
