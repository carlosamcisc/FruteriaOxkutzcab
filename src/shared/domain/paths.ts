export const collections = {
  usuarios: "usuarios",
  solicitudesVendedores: "solicitudesVendedores",
  vendedores: "vendedores",
  productos: "productos",
  cotizaciones: "cotizaciones",
  pedidos: "pedidos",
  movimientosInventario: "movimientosInventario",
} as const;

export const documentPaths = {
  usuario: (uid: string) => `${collections.usuarios}/${uid}`,
  solicitudVendedor: (uid: string) =>
    `${collections.solicitudesVendedores}/${uid}`,
  vendedor: (vendedorId: string) => `${collections.vendedores}/${vendedorId}`,
  producto: (productoId: string) => `${collections.productos}/${productoId}`,
  cotizacion: (cotizacionId: string) =>
    `${collections.cotizaciones}/${cotizacionId}`,
  pedido: (pedidoId: string) => `${collections.pedidos}/${pedidoId}`,
  movimientoInventario: (movimientoId: string) =>
    `${collections.movimientosInventario}/${movimientoId}`,
} as const;
