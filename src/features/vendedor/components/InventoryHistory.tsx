import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getFirestoreDb } from '../../../services/firestore';
import type { MovimientoInventario } from '../../../shared/domain/models';

export function InventoryHistory({ uid }: { uid: string }) {
  const [items, setItems] = useState<(MovimientoInventario & { id: string })[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => onSnapshot(query(collection(getFirestoreDb(), 'movimientosInventario'), where('vendedorId', '==', uid)), snapshot => {
    const movements = snapshot.docs.map(doc => ({ ...doc.data() as MovimientoInventario, id: doc.id }));
    movements.sort((a, b) => (b.creadoEn?.toMillis() ?? 0) - (a.creadoEn?.toMillis() ?? 0));
    setItems(movements); setLoading(false); setError('');
  }, () => { setError('No se pudo cargar el historial de inventario.'); setLoading(false); }), [uid]);
  return <details className="activity-card mt-4"><summary>Movimientos de inventario ({items.length})</summary>
    {loading && <p role="status">Cargando movimientos…</p>}{error && <p role="alert">{error}</p>}
    <ul className="mt-3">{items.map(item => <li key={item.id}>
      {item.creadoEn?.toDate().toLocaleString('es-MX')} · Producto {item.productoId.slice(0, 8)} · {item.cantidad > 0 ? '+' : ''}{item.cantidad} · {item.motivo}
      {item.pedidoId && ` · Pedido ${item.pedidoId.slice(0, 8)}`}
    </li>)}</ul>
  </details>;
}
