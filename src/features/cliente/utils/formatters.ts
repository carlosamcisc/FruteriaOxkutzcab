import type { Timestamp } from "firebase/firestore";
import type { EstadoCotizacion, EstadoPedido } from "../../../shared/domain/models";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" });

export function formatCentavos(centavos: number): string {
  return currencyFormatter.format(centavos / 100);
}

/** Las escrituras con `serverTimestamp()` llegan como `null` hasta confirmarse. */
export function formatDate(timestamp: Timestamp | null | undefined): string {
  return timestamp ? dateFormatter.format(timestamp.toDate()) : "Hace un momento";
}

export function timestampMillis(timestamp: Timestamp | null | undefined): number {
  return timestamp?.toMillis() ?? Date.now();
}

type Tono = "success" | "warning" | "info" | "muted" | "danger";

export const estadoPedidoInfo: Record<EstadoPedido, { label: string; tone: Tono }> = {
  pendienteConfirmacionVendedor: { label: "Por confirmar", tone: "warning" },
  confirmado: { label: "Confirmado", tone: "info" },
  preparando: { label: "Preparando", tone: "info" },
  listo: { label: "Listo para entrega", tone: "success" },
  entregado: { label: "Entregado", tone: "muted" },
  cancelado: { label: "Cancelado", tone: "danger" },
};

export const estadoCotizacionInfo: Record<EstadoCotizacion, { label: string; tone: Tono }> = {
  solicitada: { label: "Solicitada", tone: "warning" },
  cotizada: { label: "Cotizada", tone: "success" },
  aceptada: { label: "Aceptada", tone: "info" },
  rechazada: { label: "Rechazada", tone: "danger" },
  cancelada: { label: "Cancelada", tone: "muted" },
  vencida: { label: "Vencida", tone: "muted" },
};

const categoryEmoji: Record<string, string> = {
  frutas: "🍊",
  fruta: "🍊",
  citricos: "🍋",
  citrico: "🍋",
  verduras: "🥬",
  verdura: "🥬",
  hortalizas: "🥕",
  tropicales: "🥭",
  tropical: "🥭",
  berries: "🍓",
  frutosrojos: "🍓",
  chiles: "🌶️",
};

export function emojiForCategory(categoria: string): string {
  const key = categoria
    .normalize("NFD")
    .replace(/[̀-ͯ\s]/g, "")
    .toLowerCase();
  return categoryEmoji[key] ?? "🧺";
}
