import type { ProductoCatalogo } from "../hooks/useClienteInicio";
import { emojiForCategory, formatCentavos } from "../utils/formatters";

export function ProductCard({ producto }: { producto: ProductoCatalogo }) {
  const agotado = producto.cantidadDisponible <= 0;

  return (
    <article className="product-card">
      <div className="product-card-visual" aria-hidden="true">
        <span>{emojiForCategory(producto.categoria)}</span>
        <span className="product-category">{producto.categoria}</span>
      </div>
      <div className="product-card-body">
        <h3>{producto.nombre}</h3>
        <p className="product-seller">
          <i className="bi bi-shop me-1" aria-hidden="true" />
          {producto.vendedor.nombreNegocio}
          <span> · {producto.vendedor.municipio}</span>
        </p>
        {producto.descripcion && <p className="product-description">{producto.descripcion}</p>}

        <div className="product-price">
          <strong>{formatCentavos(producto.precioUnitarioCentavos)}</strong>
          <small>por {producto.presentacion}</small>
        </div>

        <dl className="product-meta">
          <div>
            <dt>Pedido mínimo</dt>
            <dd>{producto.cantidadMinimaPedido} {producto.presentacion}</dd>
          </div>
          <div>
            <dt>Disponible</dt>
            <dd className={agotado ? "text-danger" : undefined}>
              {agotado ? "Agotado" : `${producto.cantidadDisponible} ${producto.presentacion}`}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
