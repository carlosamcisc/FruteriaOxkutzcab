import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { getFirestoreDb } from "../../../services/firestore";
import { callCommerce } from '../../../services/functions';
import { collections, documentPaths } from "../../../shared/domain/paths";
import type { Cotizacion, Pedido, PerfilVendedor, Producto, SolicitudVendedor } from "../../../shared/domain/models";

export type ConId<T> = T & { id: string };
export type ProductoInput = Pick<Producto, "nombre" | "descripcion" | "categoria" | "presentacion" | "cantidadMinimaPedido" | "cantidadDisponible" | "precioUnitarioCentavos" | "estado">;

export function observeSellerProfile(uid: string, next: (value: PerfilVendedor | null) => void, error: (error: Error) => void) {
  return onSnapshot(doc(getFirestoreDb(), documentPaths.vendedor(uid)), snapshot => next(snapshot.exists() ? snapshot.data() as PerfilVendedor : null), error);
}

export function observeSellerApplication(uid: string, next: (value: SolicitudVendedor | null) => void, error: (error: Error) => void) {
  return onSnapshot(doc(getFirestoreDb(), documentPaths.solicitudVendedor(uid)), snapshot => next(snapshot.exists() ? snapshot.data() as SolicitudVendedor : null), error);
}

export function observeSellerCollection<T extends Producto | Cotizacion | Pedido>(name: "productos" | "cotizaciones" | "pedidos", uid: string, next: (items: ConId<T>[]) => void, error: (error: Error) => void) {
  return onSnapshot(query(collection(getFirestoreDb(), collections[name]), where("vendedorId", "==", uid)), snapshot => {
    const items = snapshot.docs.map(item => ({ ...item.data() as T, id: item.id }));
    items.sort((a, b) => (b.actualizadoEn?.toMillis() ?? 0) - (a.actualizadoEn?.toMillis() ?? 0));
    next(items);
  }, error);
}

export async function saveProduct(input: ProductoInput, productId?: string, expectedStock?: number) {
  return callCommerce('guardarProducto', { ...input, ...(productId ? { productId, expectedStock } : {}) });
}

