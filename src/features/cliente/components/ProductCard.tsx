import type { ProductoCatalogo } from "../hooks/useClienteInicio";
import { emojiForCategory, formatCentavos } from "../utils/formatters";
import { ActionForm } from '../../commerce/components/CommerceActions';
import { callCommerce } from '../../../services/functions';
import { useAuth } from '../../auth/hooks/useAuth';
import { ProductPhoto } from '../../../shared/components/ProductPhoto';

export function ProductCard({ producto }: { producto: ProductoCatalogo }) {
  const { user } = useAuth();
  const agotado = producto.cantidadDisponible <= 0;

  return (
    <article className="product-card">
      <ProductPhoto path={producto.rutasImagenes[0]} name={producto.nombre} />
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
        {!agotado && producto.cantidadDisponible >= producto.cantidadMinimaPedido && user?.uid !== producto.vendedorId && <ActionForm label="Solicitar cotización" run={data => callCommerce('solicitarCotizacion', {
          productId: producto.id, quantity: Number(data.get('quantity')), note: String(data.get('note') ?? ''),
        })}>
          <label className="d-block">Presentaciones<input className="form-control mb-2" name="quantity" type="number" min={producto.cantidadMinimaPedido} max={producto.cantidadDisponible} step="1" required defaultValue={producto.cantidadMinimaPedido} /></label>
          <label className="d-block">Nota para el vendedor<textarea className="form-control mb-2" name="note" maxLength={1000} /></label>
        </ActionForm>}
      </div>
    </article>
  );
}
