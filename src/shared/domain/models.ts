import type { Timestamp } from "firebase/firestore";

/** Tipo de cuenta que se elige al registrarse. */
export type AccountRole = "customer" | "seller";

export type EstadoSolicitudVendedor = "pendiente" | "aprobada" | "rechazada";
export type EstadoVendedor = "activo" | "suspendido";
export type EstadoProducto = "borrador" | "publicado" | "pausado";
export type EstadoCotizacion =
  | "solicitada"
  | "cotizada"
  | "aceptada"
  | "rechazada"
  | "cancelada"
  | "vencida";
export type EstadoPedido =
  | "pendienteConfirmacionVendedor"
  | "confirmado"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";
export type EstadoPagoEfectivo = "pendiente" | "recibido";

export interface PerfilUsuario {
  nombre: string;
  correo: string;
  telefono: string | null;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface SolicitudVendedor {
  propietarioId: string;
  nombreNegocio: string;
  descripcion: string;
  telefonoContacto: string;
  municipio: string;
  estado: EstadoSolicitudVendedor;
  enviadoEn: Timestamp;
  revisadoEn: Timestamp | null;
  revisadoPor: string | null;
  motivoRechazo: string | null;
}

export interface PerfilVendedor {
  propietarioId: string;
  nombreNegocio: string;
  descripcion: string;
  telefonoContacto: string;
  municipio: string;
  estado: EstadoVendedor;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface Producto {
  vendedorId: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  presentacion: string;
  cantidadMinimaPedido: number;
  cantidadDisponible: number;
  precioUnitarioCentavos: number;
  moneda: "MXN";
  estado: EstadoProducto;
  rutasImagenes: string[];
  ultimoMovimientoId?: string | null;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface ElementoCotizacion {
  productoId: string;
  nombreProducto: string;
  presentacion: string;
  cantidad: number;
  precioUnitarioSolicitadoCentavos: number;
  precioUnitarioCotizadoCentavos: number | null;
}

export interface Cotizacion {
  compradorId: string;
  vendedorId: string;
  elementos: ElementoCotizacion[];
  estado: EstadoCotizacion;
  notaComprador: string | null;
  notaVendedor: string | null;
  venceEn: Timestamp | null;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface ElementoPedido {
  productoId: string;
  nombreProducto: string;
  presentacion: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  totalLineaCentavos: number;
}

export interface Pedido {
  cotizacionId: string;
  compradorId: string;
  vendedorId: string;
  elementos: ElementoPedido[];
  subtotalCentavos: number;
  moneda: "MXN";
  estado: EstadoPedido;
  estadoPagoEfectivo: EstadoPagoEfectivo;
  efectivoRecibidoEn: Timestamp | null;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export type TipoMovimientoInventario = "entrada" | "venta" | "ajuste";

export interface MovimientoInventario {
  vendedorId: string;
  productoId: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  pedidoId: string | null;
  actorId: string;
  creadoEn: Timestamp;
}
