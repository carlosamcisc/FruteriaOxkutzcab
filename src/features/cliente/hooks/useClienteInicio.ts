import { useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import type {
  Cotizacion,
  Pedido,
  PerfilUsuario,
  PerfilVendedor,
  Producto,
} from "../../../shared/domain/models";
import {
  getSellers,
  getUserProfile,
  observeBuyerOrders,
  observeBuyerQuotes,
  observePublishedProducts,
  type ConId,
} from "../services/clienteInicio";
import { timestampMillis } from "../utils/formatters";

export interface ProductoCatalogo extends ConId<Producto> {
  vendedor: PerfilVendedor;
}

const pedidosEnCurso = new Set<Pedido["estado"]>([
  "pendienteConfirmacionVendedor",
  "confirmado",
  "preparando",
  "listo",
]);
const cotizacionesActivas = new Set<Cotizacion["estado"]>(["solicitada", "cotizada"]);

function mapLoadError(error: unknown): string {
  if (error instanceof FirebaseError && error.code === "permission-denied") {
    return "No tienes permiso para consultar esta información. Verifica que las reglas de Firestore estén publicadas.";
  }
  if (error instanceof FirebaseError && error.code === "unavailable") {
    return "No hay conexión con Firebase. Revisa tu conexión a internet.";
  }
  return "No pudimos cargar tu información. Intenta recargar la página.";
}

function byNewest<T extends { actualizadoEn: Producto["actualizadoEn"] | null }>(a: T, b: T) {
  return timestampMillis(b.actualizadoEn) - timestampMillis(a.actualizadoEn);
}

/** Reúne en tiempo real los datos que necesita la pantalla de inicio del cliente. */
export function useClienteInicio(uid: string) {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [productos, setProductos] = useState<ConId<Producto>[] | null>(null);
  const [vendedores, setVendedores] = useState<Record<string, PerfilVendedor | null>>({});
  const [cotizaciones, setCotizaciones] = useState<ConId<Cotizacion>[] | null>(null);
  const [pedidos, setPedidos] = useState<ConId<Pedido>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedSellers = useRef(new Set<string>());

  useEffect(() => {
    const handleError = (caughtError: unknown) => setError(mapLoadError(caughtError));

    getUserProfile(uid).then(setPerfil).catch(handleError);
    const unsubscribers = [
      observePublishedProducts(setProductos, (caughtError) => {
        setProductos([]);
        handleError(caughtError);
      }),
      observeBuyerQuotes(uid, setCotizaciones, (caughtError) => {
        setCotizaciones([]);
        handleError(caughtError);
      }),
      observeBuyerOrders(uid, setPedidos, (caughtError) => {
        setPedidos([]);
        handleError(caughtError);
      }),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid]);

  // Solo se consultan los perfiles de vendedor que aún no se han pedido.
  useEffect(() => {
    if (!productos) {
      return;
    }
    const missing = [...new Set(productos.map((producto) => producto.vendedorId))].filter(
      (sellerId) => !requestedSellers.current.has(sellerId),
    );
    if (missing.length === 0) {
      return;
    }
    missing.forEach((sellerId) => requestedSellers.current.add(sellerId));
    getSellers(missing)
      .then((loaded) => setVendedores((current) => ({ ...current, ...loaded })))
      .catch((caughtError) => {
        // Se marcan como no disponibles para que el catálogo deje de mostrarse como cargando.
        const unavailable = Object.fromEntries(missing.map((sellerId) => [sellerId, null]));
        setVendedores((current) => ({ ...current, ...unavailable }));
        setError(mapLoadError(caughtError));
      });
  }, [productos]);

  const catalogo = useMemo<ProductoCatalogo[]>(() => {
    if (!productos) {
      return [];
    }
    return productos
      .flatMap((producto) => {
        const vendedor = vendedores[producto.vendedorId];
        return vendedor?.estado === "activo" ? [{ ...producto, vendedor }] : [];
      })
      .sort(byNewest);
  }, [productos, vendedores]);

  const isCatalogLoading =
    productos === null ||
    productos.some((producto) => !(producto.vendedorId in vendedores));

  const pedidosRecientes = useMemo(() => [...(pedidos ?? [])].sort(byNewest), [pedidos]);
  const cotizacionesRecientes = useMemo(
    () => [...(cotizaciones ?? [])].sort(byNewest),
    [cotizaciones],
  );

  const resumen = {
    productosDisponibles: catalogo.length,
    vendedoresActivos: new Set(catalogo.map((producto) => producto.vendedorId)).size,
    cotizacionesActivas: cotizacionesRecientes.filter((cotizacion) =>
      cotizacionesActivas.has(cotizacion.estado),
    ).length,
    pedidosEnCurso: pedidosRecientes.filter((pedido) => pedidosEnCurso.has(pedido.estado)).length,
  };

  return {
    perfil,
    catalogo,
    isCatalogLoading,
    pedidos: pedidosRecientes,
    cotizaciones: cotizacionesRecientes,
    isActivityLoading: pedidos === null || cotizaciones === null,
    resumen,
    error,
  };
}
