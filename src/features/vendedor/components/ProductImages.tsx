import { useState } from 'react';
import { ref, uploadBytes, deleteObject } from 'firebase/storage';
import type { Producto } from '../../../shared/domain/models';
import { getStorageService } from '../../../services/storage';
import { callCommerce } from '../../../services/functions';

export function ProductImages({ uid, product }: { uid: string; product: Producto & { id: string } }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(file: File) {
    const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[file.type];
    if (!extension || file.size > 5 * 1024 * 1024 || product.rutasImagenes.length >= 5) {
      setError('Usa JPG, PNG o WebP de hasta 5 MB. Máximo 5 imágenes por producto.'); return;
    }
    setBusy(true); setError('');
    const path = `productos/${uid}/${product.id}/${crypto.randomUUID()}.${extension}`;
    const image = ref(getStorageService(), path);
    try {
      await uploadBytes(image, file, { contentType: file.type });
      await callCommerce('actualizarImagenes', { id: product.id, expectedPaths: product.rutasImagenes, paths: [...product.rutasImagenes, path] });
    } catch (caught) {
      await deleteObject(image).catch(() => undefined);
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la imagen.');
    } finally { setBusy(false); }
  }
  return <section className="mt-4"><h4>Fotografías</h4><p className="form-text">Hasta 5 imágenes JPG, PNG o WebP de 5 MB cada una.</p>
    <input className="form-control" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Subir fotografía" disabled={busy || product.rutasImagenes.length >= 5} onChange={event => {
      const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = '';
    }} />
    {product.rutasImagenes.map((path, index) => <div className="d-flex gap-2 align-items-center mt-2" key={path}><span>Fotografía {index + 1}</span><button type="button" className="btn btn-outline-danger btn-sm" disabled={busy} onClick={async () => {
      setBusy(true); setError('');
      try {
        await callCommerce('actualizarImagenes', { id: product.id, expectedPaths: product.rutasImagenes, paths: product.rutasImagenes.filter(item => item !== path) });
        await deleteObject(ref(getStorageService(), path)).catch(() => undefined);
      } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo quitar la imagen.'); }
      finally { setBusy(false); }
    }}>Quitar</button></div>)}
    {busy && <p role="status">Guardando fotografía…</p>}{error && <p role="alert" className="text-danger">{error}</p>}
  </section>;
}
