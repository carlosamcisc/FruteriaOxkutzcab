import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "../../../services/firestore";
import type {
  Cotizacion,
  Pedido,
  PerfilUsuario,
  PerfilVendedor,
  Producto,
} from "../../../shared/domain/models";
import { collections, documentPaths } from "../../../shared/domain/paths";

export type ConId<T> = T & { id: string };

type Listener<T> = (items: ConId<T>[]) => void;
type ErrorListener = (error: Error) => void;

function mapSnapshot<T>(snapshot: QuerySnapshot<DocumentData>): ConId<T>[] {
  return snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as T) }));
}

/**
 * Las consultas no ordenan en Firestore para no depender de índices compuestos;
 * el orden por fecha se aplica en el cliente.
 */
export function observePublishedProducts(
  onData: Listener<Producto>,
  onError: ErrorListener,
): Unsubscribe {
  const db = getFirestoreDb();
  const products = new Map<string, ConId<Producto>[]>();
  const subscriptions = new Map<string, Unsubscribe>();
  const emit = () => {
    if ([...subscriptions.keys()].every(uid => products.has(uid))) onData([...products.values()].flat());
  };
  // Query one active seller at a time so rules can enforce their live status.
  const sellers = onSnapshot(query(collection(db, collections.vendedores), where('estado', '==', 'activo')), snapshot => {
    const activeIds = new Set(snapshot.docs.map(item => item.id));
    subscriptions.forEach((unsubscribe, uid) => {
      if (!activeIds.has(uid)) { unsubscribe(); subscriptions.delete(uid); products.delete(uid); }
    });
    activeIds.forEach(uid => {
      if (subscriptions.has(uid)) return;
      const unsubscribe = onSnapshot(query(collection(db, collections.productos), where('vendedorId', '==', uid), where('estado', '==', 'publicado')), result => {
        if (subscriptions.has(uid)) { products.set(uid, mapSnapshot<Producto>(result)); emit(); }
      }, error => {
        if (!subscriptions.has(uid)) return;
        products.set(uid, []); emit();
        // Suspension can revoke a product listener before the seller query updates.
        if (error.code !== 'permission-denied') onError(error);
        else void getDoc(doc(db, documentPaths.vendedor(uid))).then(seller => {
          if (subscriptions.has(uid) && seller.data()?.estado === 'activo') onError(error);
        }).catch(onError);
      });
      subscriptions.set(uid, unsubscribe);
    });
    emit();
  }, onError);
  return () => { sellers(); subscriptions.forEach(unsubscribe => unsubscribe()); subscriptions.clear(); };
}

export function observeBuyerQuotes(
  buyerId: string,
  onData: Listener<Cotizacion>,
  onError: ErrorListener,
): Unsubscribe {
  const quotesQuery = query(
    collection(getFirestoreDb(), collections.cotizaciones),
    where("compradorId", "==", buyerId),
  );
  return onSnapshot(quotesQuery, (snapshot) => onData(mapSnapshot<Cotizacion>(snapshot)), onError);
}

export function observeBuyerOrders(
  buyerId: string,
  onData: Listener<Pedido>,
  onError: ErrorListener,
): Unsubscribe {
  const ordersQuery = query(
    collection(getFirestoreDb(), collections.pedidos),
    where("compradorId", "==", buyerId),
  );
  return onSnapshot(ordersQuery, (snapshot) => onData(mapSnapshot<Pedido>(snapshot)), onError);
}

export async function getUserProfile(uid: string): Promise<PerfilUsuario | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), documentPaths.usuario(uid)));
  return snapshot.exists() ? (snapshot.data() as PerfilUsuario) : null;
}

export function observeSeller(uid: string, next: (value: PerfilVendedor | null) => void, onError: ErrorListener) {
  return onSnapshot(doc(getFirestoreDb(), documentPaths.vendedor(uid)), snapshot => next(snapshot.exists() ? snapshot.data() as PerfilVendedor : null), onError);
}

/** Devuelve `null` para los vendedores que no tienen perfil público. */
export async function getSellers(
  sellerIds: string[],
): Promise<Record<string, PerfilVendedor | null>> {
  const db = getFirestoreDb();
  const entries = await Promise.all(
    sellerIds.map(async (sellerId) => {
      const snapshot = await getDoc(doc(db, documentPaths.vendedor(sellerId)));
      return [sellerId, snapshot.exists() ? (snapshot.data() as PerfilVendedor) : null] as const;
    }),
  );
  return Object.fromEntries(entries);
}
