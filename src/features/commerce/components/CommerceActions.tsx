import { useState, type ReactNode } from 'react';
import type { Cotizacion, Pedido } from '../../../shared/domain/models';
import { callCommerce } from '../../../services/commerce';

export function ActionForm({ children, run, label }: { children?: ReactNode; run: (data: FormData) => Promise<unknown>; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  return <form className="mt-3" onSubmit={async event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setBusy(true); setError(''); setSuccess(false);
    try { await run(data); setSuccess(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo completar la operación.'); }
    finally { setBusy(false); }
  }}><fieldset disabled={busy}>{children}<button className="btn btn-outline-success btn-sm" type="submit">{busy ? 'Guardando…' : label}</button></fieldset>
    {error && <p className="text-danger mt-2" role="alert">{error}</p>}
    {success && <p className="text-success mt-2" role="status">Operación completada.</p>}
  </form>;
}

const money = (value: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value / 100);

export function QuoteActions({ quote, seller = false, active = true }: { quote: Cotizacion & { id: string }; seller?: boolean; active?: boolean }) {
  const expired = quote.estado === 'vencida' || (quote.estado === 'cotizada' && !!quote.venceEn && quote.venceEn.toMillis() <= Date.now());
  const action = async (name: string, extra = {}) => {
    const result = await callCommerce('actualizarCotizacion', { id: quote.id, action: name, ...extra });
    if (result.expired) throw new Error('La cotización venció. Solicita una nueva.');
  };
  return <div className="w-100">
    {quote.elementos.map((line, index) => <p className="mb-1" key={index}>{line.cantidad} × {line.presentacion} · {money(line.precioUnitarioCotizadoCentavos ?? line.precioUnitarioSolicitadoCentavos)} por presentación</p>)}
    {quote.notaVendedor && <p>Respuesta: {quote.notaVendedor}</p>}
    {quote.venceEn && <small>{expired ? 'Cotización vencida' : `Válida hasta ${quote.venceEn.toDate().toLocaleString('es-MX')}`}</small>}
    {seller && active && quote.estado === 'solicitada' && <ActionForm label="Enviar cotización (válida hasta 48 horas)" run={data => {
      const value = String(data.get('price'));
      if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Escribe un precio con hasta dos decimales.');
      const [whole, cents = ''] = value.split('.');
      return action('cotizar', { price: Number(whole) * 100 + Number(cents.padEnd(2, '0')), note: String(data.get('note') ?? '') });
    }}><label className="d-block">Precio por presentación (MXN)<input name="price" type="number" required min="0.01" max="9999999.99" step="0.01" className="form-control mb-2" defaultValue={(quote.elementos[0].precioUnitarioSolicitadoCentavos / 100).toFixed(2)} /></label><label className="d-block">Respuesta<textarea name="note" maxLength={1000} className="form-control mb-2" /></label></ActionForm>}
    {!seller && quote.estado === 'cotizada' && !expired && <ActionForm label="Aceptar y reservar pedido" run={() => action('aceptar')} />}
    {['solicitada', 'cotizada'].includes(quote.estado) && <div className="d-flex flex-wrap gap-2">
      {!seller && <ActionForm label="Cancelar cotización" run={() => action('cancelar')} />}
      {(seller || quote.estado === 'cotizada') && <ActionForm label="Rechazar cotización" run={() => action('rechazar')} />}
    </div>}
  </div>;
}

export function OrderActions({ order, seller = false }: { order: Pedido & { id: string }; seller?: boolean }) {
  const next: Partial<Record<Pedido['estado'], [string, string]>> = {
    pendienteConfirmacionVendedor: ['confirmado', 'Confirmar pedido'], confirmado: ['preparando', 'Comenzar preparación'],
    preparando: ['listo', 'Marcar listo'], listo: ['entregado', 'Confirmar entrega'],
  };
  const action = (name: string) => callCommerce('actualizarPedido', { id: order.id, action: name });
  return <div className="w-100"><small>Efectivo: {order.estadoPagoEfectivo}</small><div className="d-flex flex-wrap gap-2">
    {seller && next[order.estado] && <ActionForm label={next[order.estado]![1]} run={() => action(next[order.estado]![0])} />}
    {seller && order.estado === 'entregado' && order.estadoPagoEfectivo === 'pendiente' && <ActionForm label="Registrar efectivo recibido" run={() => action('pago')} />}
    {(order.estado === 'pendienteConfirmacionVendedor' || (seller && order.estado === 'confirmado')) && <ActionForm label="Cancelar pedido y devolver existencias" run={() => action('cancelado')} />}
  </div></div>;
}
