import { useEffect, useState } from "react";
import type { Cotizacion, Pedido, PerfilVendedor, Producto, SolicitudVendedor } from "../../../shared/domain/models";
import { observeSellerApplication, observeSellerCollection, observeSellerProfile, type ConId } from "../services/vendedor";

export function useVendedor(uid: string) {
  const [perfil, setPerfil] = useState<PerfilVendedor | null>(null);
  const [solicitud, setSolicitud] = useState<SolicitudVendedor | null>(null);
  const [productos, setProductos] = useState<ConId<Producto>[]>([]);
  const [cotizaciones, setCotizaciones] = useState<ConId<Cotizacion>[]>([]);
  const [pedidos, setPedidos] = useState<ConId<Pedido>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let profileLoaded = false;
    let applicationLoaded = false;
    const fail = () => { profileLoaded = true; applicationLoaded = true; setError("No pudimos leer tu cuenta. Verifica la conexión y las reglas de Firebase."); setLoading(false); };
    const unsubscribes = [
      observeSellerProfile(uid, value => { setPerfil(value); profileLoaded = true; setLoading(!applicationLoaded); }, fail),
      observeSellerApplication(uid, value => { setSolicitud(value); applicationLoaded = true; setLoading(!profileLoaded); }, fail),
    ];
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [uid]);

  const hasProfile = perfil !== null;
  useEffect(() => {
    if (!hasProfile) return;
    setActivityLoading(true);
    const pending = new Set(["productos", "cotizaciones", "pedidos"]);
    const done = (name: string) => { pending.delete(name); setActivityLoading(pending.size > 0); };
    const fail = (name: string) => { setError(`No pudimos cargar ${name}. Verifica tu conexión y que las reglas del vendedor estén publicadas.`); done(name); };
    const unsubscribes = [
      observeSellerCollection<Producto>("productos", uid, value => { setProductos(value); done("productos"); }, () => fail("productos")),
      observeSellerCollection<Cotizacion>("cotizaciones", uid, value => { setCotizaciones(value); done("cotizaciones"); }, () => fail("cotizaciones")),
      observeSellerCollection<Pedido>("pedidos", uid, value => { setPedidos(value); done("pedidos"); }, () => fail("pedidos")),
    ];
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [uid, hasProfile]);

  return { perfil, solicitud, productos, cotizaciones, pedidos, loading, activityLoading, error };
}
