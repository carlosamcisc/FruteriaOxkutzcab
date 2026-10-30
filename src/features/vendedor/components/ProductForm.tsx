import { useState, type FormEvent } from "react";
import type { Producto } from "../../../shared/domain/models";
import { saveProduct, type ConId, type ProductoInput } from "../services/vendedor";
import { ProductImages } from './ProductImages';

export function ProductForm({ uid, producto, onClose }: { uid: string; producto: ConId<Producto> | null; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialStock] = useState(producto?.cantidadDisponible);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const price = String(data.get("precio"));
    const [pesos, cents = ""] = price.split(".");
    const input: ProductoInput = {
      nombre: String(data.get("nombre")).trim(), descripcion: String(data.get("descripcion")).trim(),
      categoria: String(data.get("categoria")).trim(), presentacion: String(data.get("presentacion")).trim(),
      cantidadDisponible: Number(data.get("existencias")), cantidadMinimaPedido: Number(data.get("minimo")),
      precioUnitarioCentavos: Number(pesos) * 100 + Number(cents.padEnd(2, "0")),
      estado: String(data.get("estado")) as Producto["estado"],
    };
    if (!input.nombre || !input.categoria || !input.presentacion || !/^\d+(\.\d{1,2})?$/.test(price) || !Number.isSafeInteger(input.precioUnitarioCentavos) || input.precioUnitarioCentavos < 1 || !Number.isSafeInteger(input.cantidadDisponible) || input.cantidadDisponible < 0 || !Number.isSafeInteger(input.cantidadMinimaPedido) || input.cantidadMinimaPedido < 1) {
      setError("Revisa los campos: usa un precio mayor a cero con hasta dos decimales y cantidades enteras válidas."); return;
    }
    setSaving(true); setError("");
    try { await saveProduct(input, producto?.id, initialStock); onClose(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No se guardó el producto.'); }
    finally { setSaving(false); }
  }
  return <section className="registration-card mb-4" aria-labelledby="product-form-title">
    <h3 id="product-form-title">{producto ? "Editar producto" : "Nuevo producto"}</h3>
    <p className="text-secondary">El precio y las existencias corresponden a una unidad de la presentación indicada.</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    <form onSubmit={submit}>
      <fieldset disabled={saving}>
        <div className="row g-3">
          <div className="col-md-6"><label className="form-label" htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" className="form-control" required maxLength={120} defaultValue={producto?.nombre} /></div>
          <div className="col-md-6"><label className="form-label" htmlFor="categoria">Categoría</label><input id="categoria" name="categoria" className="form-control" required maxLength={60} placeholder="Frutas, verduras, cítricos…" defaultValue={producto?.categoria} /></div>
          <div className="col-12"><label className="form-label" htmlFor="descripcion">Descripción</label><textarea id="descripcion" name="descripcion" className="form-control" maxLength={2000} defaultValue={producto?.descripcion} /></div>
          <div className="col-md-6"><label className="form-label" htmlFor="presentacion">Presentación</label><input id="presentacion" name="presentacion" className="form-control" required readOnly={!!producto} maxLength={120} placeholder="Caja de 20 kg" defaultValue={producto?.presentacion} />{producto && <small>Crea otro producto para ofrecer una presentación diferente.</small>}</div>
          <div className="col-md-6"><label className="form-label" htmlFor="precio">Precio por presentación (MXN)</label><input id="precio" name="precio" type="number" className="form-control" required min="0.01" max="9999999.99" step="0.01" defaultValue={producto ? (producto.precioUnitarioCentavos / 100).toFixed(2) : undefined} /></div>
          <div className="col-md-4"><label className="form-label" htmlFor="existencias">Presentaciones disponibles</label><input id="existencias" name="existencias" type="number" className="form-control" required min="0" max="1000000" step="1" defaultValue={producto?.cantidadDisponible ?? 0} /></div>
          <div className="col-md-4"><label className="form-label" htmlFor="minimo">Pedido mínimo</label><input id="minimo" name="minimo" type="number" className="form-control" required min="1" max="1000000" step="1" defaultValue={producto?.cantidadMinimaPedido ?? 1} /></div>
          <div className="col-md-4"><label className="form-label" htmlFor="estado">Visibilidad</label><select id="estado" name="estado" className="form-select" defaultValue={producto?.estado ?? "borrador"}><option value="borrador">Borrador</option><option value="publicado">Publicado</option><option value="pausado">Pausado</option></select></div>
        </div>
        <div className="d-flex gap-2 mt-4"><button className="btn btn-primary" type="submit">{saving ? "Guardando…" : "Guardar producto"}</button><button className="btn btn-outline-secondary" type="button" onClick={onClose}>Cancelar</button></div>
      </fieldset>
    </form>
    {producto ? <ProductImages uid={uid} product={producto} /> : <p className="form-text">Guarda el producto y ábrelo para editar sus fotografías.</p>}
  </section>;
}
