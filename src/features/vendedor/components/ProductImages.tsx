import { useState } from 'react';
import type { Producto } from '../../../shared/domain/models';
import { callCommerce } from '../../../services/commerce';
import { isImageUrl } from '../../../services/commerceTransactions';

export function ProductImages({ product }: { product: Producto & { id: string } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  async function save(paths: string[]) {
    setBusy(true); setError('');
    try {
      await callCommerce('actualizarImagenes', { id: product.id, expectedPaths: product.rutasImagenes, paths });
      setUrl('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la URL.');
    } finally { setBusy(false); }
  }
  return <section className="mt-4"><h4>Imágenes por URL</h4><p className="form-text">Pega el enlace HTTPS directo a una imagen de internet. Máximo cinco enlaces; no se cargan archivos.</p>
    <form onSubmit={event => {
      event.preventDefault(); const value = url.trim();
      if (!isImageUrl(value) || product.rutasImagenes.includes(value)) { setError('Usa una URL HTTPS válida que no esté repetida.'); return; }
      void save([...product.rutasImagenes, value]);
    }}><fieldset disabled={busy || product.rutasImagenes.length >= 5}>
      <label className="form-label" htmlFor="product-image-url">URL de la imagen</label>
      <input id="product-image-url" className="form-control" type="url" required maxLength={2048} placeholder="https://ejemplo.com/fruta.jpg" value={url} onChange={event => setUrl(event.target.value)} />
      <button className="btn btn-outline-success btn-sm mt-2" type="submit">Agregar URL</button>
    </fieldset></form>
    {product.rutasImagenes.map((path, index) => <div className="d-flex gap-2 align-items-center mt-2" key={path}>
      <span className="text-break">Imagen {index + 1}: {path}</span><button type="button" className="btn btn-outline-danger btn-sm" disabled={busy} onClick={() => void save(product.rutasImagenes.filter(item => item !== path))}>Quitar</button>
    </div>)}
    {busy && <p role="status">Guardando enlaces…</p>}{error && <p role="alert" className="text-danger">{error}</p>}
  </section>;
}
