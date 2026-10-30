import { readFileSync } from 'node:fs';
import { initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const apply = process.argv.includes('--apply');
const project = process.argv.find(value => value.startsWith('--project='))?.slice('--project='.length);
if (!project || (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.GOOGLE_APPLICATION_CREDENTIALS)) throw new Error('Indica --project=ID y GOOGLE_APPLICATION_CREDENTIALS. Sin --apply solo se audita.');
if (process.env.FIRESTORE_EMULATOR_HOST && !project.startsWith('demo-')) throw new Error('Usa un proyecto demo con emuladores.');
const account = process.env.FIRESTORE_EMULATOR_HOST ? null : JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
if (account && account.project_id !== project) throw new Error('La cuenta de servicio no coincide con el proyecto.');
const app = initializeApp({ ...(account ? { credential: cert(account) } : {}), projectId: project });
const db = getFirestore(app);
try {
  const products = await db.collection('productos').get();
  const candidates = products.docs.filter(item => !item.data().ultimoMovimientoId);
  // Do not reinterpret stock belonging to orders created by older implementations.
  if (candidates.length) {
    const pending = await db.collection('pedidos').where('estado', 'in', ['pendienteConfirmacionVendedor', 'confirmado', 'preparando', 'listo']).limit(1).get();
    if (!pending.empty) throw new Error('Hay pedidos previos en curso: concilia el inventario antes de crear saldos iniciales.');
  }
  for (const item of candidates) {
    const data = item.data();
    if (!Number.isSafeInteger(data.cantidadDisponible) || data.cantidadDisponible < 0 || typeof data.vendedorId !== 'string') throw new Error(`Producto inválido: ${item.id}`);
    const existing = await db.collection('movimientosInventario').where('productoId', '==', item.id).limit(1).get();
    if (!existing.empty) throw new Error(`El producto ${item.id} ya tiene movimientos sin enlace; requiere conciliación.`);
  }
  console.log(JSON.stringify({ project, products: products.size, baselineRequired: candidates.length, apply }));
  if (apply) {
    let migrated = 0;
    for (const item of candidates) {
      const changed = await db.runTransaction(async tx => {
        const current = await tx.get(item.ref);
        if (!current.exists || current.data().ultimoMovimientoId) return false;
        const data = current.data();
        const movement = db.doc(`movimientosInventario/baseline_spark_${item.id}`);
        const history = await tx.get(db.collection('movimientosInventario').where('productoId', '==', item.id).limit(1));
        if (!history.empty) throw new Error('El historial cambió durante la migración.');
        tx.create(movement, { productoId: item.id, vendedorId: data.vendedorId, actorId: 'migracion-spark-v1',
          cantidad: data.cantidadDisponible, tipo: data.cantidadDisponible > 0 ? 'entrada' : 'ajuste',
          motivo: 'Saldo inicial al habilitar historial Spark', pedidoId: null, creadoEn: FieldValue.serverTimestamp() });
        tx.update(item.ref, { ultimoMovimientoId: movement.id, actualizadoEn: FieldValue.serverTimestamp() });
        return true;
      });
      if (changed) migrated++;
    }
    console.log(JSON.stringify({ migrated, originalProductsPreserved: true }));
  }
} finally { await db.terminate(); await deleteApp(app); }
