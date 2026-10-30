import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, writeBatch, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getStorage, connectStorageEmulator, ref, uploadBytes, getBytes } from 'firebase/storage';
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const projectId = 'demo-fruteria-admin';
const apps = [];
async function account(name) {
  const app = initializeApp({ projectId, apiKey: 'demo-key', storageBucket: `${projectId}.appspot.com` }, `${name}-${Date.now()}`);
  apps.push(app);
  const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const functions = getFunctions(app); connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  const storage = getStorage(app); connectStorageEmulator(storage, '127.0.0.1', 9199);
  if (name === 'buyer') await assert.rejects(httpsCallable(functions, 'solicitarCotizacion')({ productId: 'missing', quantity: 2 }), error => error.code === 'functions/unauthenticated');
  const user = (await createUserWithEmailAndPassword(auth, `${name}-${Date.now()}@example.test`, 'test-password-123')).user;
  await setDoc(doc(db, `usuarios/${user.uid}`), { nombre: name, correo: user.email, telefono: null, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
  return { user, db, storage, call: (fn, data) => httpsCallable(functions, fn)(data).then(result => result.data) };
}

test('flujo real con Auth, reglas, Functions y Storage: alta, aprobación, compra y entrega', { timeout: 120000 }, async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) throw new Error('Ejecuta con los cuatro emuladores locales.');
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
    const path = `productos/${seller.user.uid}/${productId}/test.jpg`;
    const jpeg = new Uint8Array([255, 216, 255, 224]);
    await assert.rejects(uploadBytes(ref(buyer.storage, path), jpeg, { contentType: 'image/jpeg' }));
    await assert.rejects(uploadBytes(ref(seller.storage, path.replace('.jpg', '.txt')), jpeg, { contentType: 'text/plain' }));
    await assert.rejects(uploadBytes(ref(seller.storage, path), new Uint8Array(5 * 1024 * 1024 + 1), { contentType: 'image/jpeg' }));
    await uploadBytes(ref(seller.storage, path), jpeg, { contentType: 'image/jpeg' });
    await seller.call('actualizarImagenes', { id: productId, paths: [path], expectedPaths: [] });
    assert.equal((await getBytes(ref(buyer.storage, path))).byteLength, jpeg.byteLength);
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
