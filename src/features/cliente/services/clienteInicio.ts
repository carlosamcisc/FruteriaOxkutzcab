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
  const productsQuery = query(
    collection(getFirestoreDb(), collections.productos),
    where("estado", "==", "publicado"),
  );
  return onSnapshot(productsQuery, (snapshot) => onData(mapSnapshot<Producto>(snapshot)), onError);
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
