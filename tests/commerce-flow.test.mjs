import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, writeBatch, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { saveProduct, requestQuote, quoteAction, orderAction, updateImages } from '../src/services/commerceTransactions.ts';
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const projectId = 'demo-fruteria-admin';
const apps = [];
async function account(name) {
  const app = initializeApp({ projectId, apiKey: 'demo-key' }, `${name}-${Date.now()}`);
  apps.push(app);
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const user = (await createUserWithEmailAndPassword(auth, `${name}-${Date.now()}@example.test`, 'test-password-123')).user;
  await setDoc(doc(db, `usuarios/${user.uid}`), { nombre: name, correo: user.email, telefono: null, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
  const operations = { guardarProducto: saveProduct, solicitarCotizacion: requestQuote, actualizarCotizacion: quoteAction, actualizarPedido: orderAction, actualizarImagenes: updateImages };
  return { user, db, call: (name, data) => operations[name](db, user.uid, data) };
}

test('flujo Spark con Auth y reglas: alta, aprobación, URL externa, compra y entrega', { timeout: 120000 }, async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Ejecuta con los emuladores de Auth y Firestore.');
  const adminApp = initializeAdmin({ projectId }, 'flow-admin');
  try {
    const seller = await account('seller'), buyer = await account('buyer'), admin = await account('admin');
    await getAdminAuth(adminApp).setCustomUserClaims(admin.user.uid, { admin: true });
    await admin.user.getIdToken(true);
    await setDoc(doc(seller.db, `solicitudesVendedores/${seller.user.uid}`), {
      propietarioId: seller.user.uid, nombreNegocio: 'Huerta', descripcion: 'Fruta de temporada', telefonoContacto: '9991234567', municipio: 'Oxkutzcab',
      estado: 'pendiente', enviadoEn: serverTimestamp(), revisadoEn: null, revisadoPor: null, motivoRechazo: null,
    });
    const batch = writeBatch(admin.db);
    batch.update(doc(admin.db, `solicitudesVendedores/${seller.user.uid}`), {
      estado: 'aprobada', revisadoEn: serverTimestamp(), revisadoPor: admin.user.uid, motivoRechazo: null,
    });
    batch.set(doc(admin.db, `vendedores/${seller.user.uid}`), {
      propietarioId: seller.user.uid, nombreNegocio: 'Huerta', descripcion: 'Fruta de temporada', telefonoContacto: '9991234567', municipio: 'Oxkutzcab',
      estado: 'activo', creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp(),
    });
    await batch.commit();
    const product = { nombre: 'Naranja', descripcion: 'Fresca', categoria: 'Frutas', presentacion: 'Caja de 20 kg', cantidadDisponible: 10, cantidadMinimaPedido: 2, precioUnitarioCentavos: 25000, estado: 'publicado' };
    await assert.rejects(buyer.call('guardarProducto', product));
    const { id: productId } = await seller.call('guardarProducto', product);
    const path = 'https://images.example.com/orange.jpg';
    await assert.rejects(buyer.call('actualizarImagenes', { id: productId, paths: [path], expectedPaths: [] }));
    await seller.call('actualizarImagenes', { id: productId, paths: [path], expectedPaths: [] });
    assert.deepEqual((await getDoc(doc(buyer.db, `productos/${productId}`))).data().rutasImagenes, [path]);
    const { id: quoteId } = await buyer.call('solicitarCotizacion', { productId, quantity: 2, note: 'Entrega local' });
    await assert.rejects(buyer.call('actualizarCotizacion', { id: quoteId, action: 'cotizar', price: 1 }));
    await seller.call('actualizarCotizacion', { id: quoteId, action: 'cotizar', price: 24000 });
    await buyer.call('actualizarCotizacion', { id: quoteId, action: 'aceptar' });
    await buyer.call('actualizarCotizacion', { id: quoteId, action: 'aceptar' });
    assert.equal((await getDoc(doc(seller.db, `productos/${productId}`))).data().cantidadDisponible, 8);
    assert.equal((await getDoc(doc(buyer.db, `pedidos/${quoteId}`))).data().subtotalCentavos, 48000);
    // Suspension stops new business, while existing deliveries can finish.
    await updateDoc(doc(admin.db, `vendedores/${seller.user.uid}`), { estado: 'suspendido', actualizadoEn: serverTimestamp() });
    await assert.rejects(buyer.call('solicitarCotizacion', { productId, quantity: 2 }));
    for (const action of ['confirmado', 'preparando', 'listo', 'entregado', 'pago']) await seller.call('actualizarPedido', { id: quoteId, action });
    assert.equal((await getDoc(doc(buyer.db, `pedidos/${quoteId}`))).data().estadoPagoEfectivo, 'recibido');
    await updateDoc(doc(admin.db, `vendedores/${seller.user.uid}`), { estado: 'activo', actualizadoEn: serverTimestamp() });
  } finally {
    await Promise.all(apps.map(app => deleteApp(app)));
    await deleteAdmin(adminApp);
  }
});
