import type { Cotizacion, Pedido } from "../../../shared/domain/models";
import type { ConId } from "../services/clienteInicio";
import { OrderActions, QuoteActions } from '../../commerce/components/CommerceActions';
import {
  estadoCotizacionInfo,
  estadoPedidoInfo,
  formatCentavos,
  formatDate,
} from "../utils/formatters";


function resumirElementos(elementos: { nombreProducto: string }[]): string {
  if (elementos.length === 0) {
    return "Sin productos";
  }
  const [primero, ...resto] = elementos;
  return resto.length > 0 ? `${primero.nombreProducto} y ${resto.length} más` : primero.nombreProducto;
}

function EmptyActivity({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="activity-empty">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function OrderList({ pedidos }: { pedidos: ConId<Pedido>[] }) {
  if (pedidos.length === 0) {
    return <EmptyActivity icon="bi-bag" message="Aún no tienes pedidos. Cuando confirmes una cotización aparecerá aquí." />;
  }

  return (
    <ul className="activity-list">
      {pedidos.map((pedido) => {
        const estado = estadoPedidoInfo[pedido.estado];
        return (
          <li key={pedido.id} className="flex-wrap">
            <div>
              <strong>{resumirElementos(pedido.elementos)}</strong>
              <small>
                {formatDate(pedido.creadoEn)} · {formatCentavos(pedido.subtotalCentavos)}
              </small>
            </div>
            <span className={`status-pill status-${estado.tone}`}>{estado.label}</span>
            <OrderActions order={pedido} />
          </li>
        );
      })}
    </ul>
  );
}

export function QuoteList({ cotizaciones }: { cotizaciones: ConId<Cotizacion>[] }) {
  if (cotizaciones.length === 0) {
    return <EmptyActivity icon="bi-chat-square-text" message="Aún no has solicitado cotizaciones." />;
  }

  return (
    <ul className="activity-list">
      {cotizaciones.map((cotizacion) => {
        const estado = estadoCotizacionInfo[cotizacion.estado];
        return (
          <li key={cotizacion.id} className="flex-wrap">
            <div>
              <strong>{resumirElementos(cotizacion.elementos)}</strong>
              <small>
                {formatDate(cotizacion.creadoEn)} · {cotizacion.elementos.length}{" "}
                {cotizacion.elementos.length === 1 ? "producto" : "productos"}
              </small>
            </div>
            <span className={`status-pill status-${estado.tone}`}>{estado.label}</span>
            <QuoteActions quote={cotizacion} />
          </li>
        );
      })}
    </ul>
  );
}
