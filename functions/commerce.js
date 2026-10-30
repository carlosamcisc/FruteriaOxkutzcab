import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export class BusinessError extends Error {}
const fail = message => { throw new BusinessError(message); };
export const text = (value, max, required = true) => {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail('Revisa los campos de texto.');
  return value.trim();
};
const integer = (value, min, max) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail('Cantidad o precio fuera de rango.');
  return value;
};
const id = value => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) fail('Identificador inválido.');
  return value;
};
const now = () => FieldValue.serverTimestamp();
const exists = snapshot => snapshot.exists ? snapshot.data() : fail('El registro ya no existe.');
const active = profile => { if (!profile || profile.estado !== 'activo') fail('El negocio no está activo.'); };
function movement(tx, db, productId, sellerId, actorId, quantity, reason, orderId = null) {
  tx.create(db.collection('movimientosInventario').doc(), {
    productoId: productId, vendedorId: sellerId, actorId, cantidad: quantity,
    tipo: orderId ? (quantity < 0 ? 'venta' : 'ajuste') : quantity > 0 ? 'entrada' : 'ajuste', motivo: reason,
    pedidoId: orderId, creadoEn: now(),
  });
}

export async function saveProduct(db, uid, input) {
  const productId = input.productId ? id(input.productId) : db.collection('productos').doc().id;
  const ref = db.doc(`productos/${productId}`);
  const data = {
    nombre: text(input.nombre, 120), descripcion: text(input.descripcion, 2000, false),
    categoria: text(input.categoria, 60), presentacion: text(input.presentacion, 120),
    cantidadMinimaPedido: integer(input.cantidadMinimaPedido, 1, 1000000),
    cantidadDisponible: integer(input.cantidadDisponible, 0, 1000000),
    precioUnitarioCentavos: integer(input.precioUnitarioCentavos, 1, 999999999),
    estado: input.estado,
  };
  if (!['borrador', 'publicado', 'pausado'].includes(data.estado)) fail('Estado de producto inválido.');
  await db.runTransaction(async tx => {
    const [seller, previous] = await Promise.all([tx.get(db.doc(`vendedores/${uid}`)), tx.get(ref)]);
    active(seller.data());
    if (previous.exists && previous.data().vendedorId !== uid) fail('No puedes editar este producto.');
    if (previous.exists && previous.data().presentacion !== data.presentacion) fail('Crea otro producto para cambiar la presentación y conservar el inventario de los pedidos.');
    // Prevent an old edit form from overwriting a concurrent sale/reservation.
    if (previous.exists && input.expectedStock !== previous.data().cantidadDisponible) fail('Las existencias cambiaron. Cierra el formulario y vuelve a abrirlo.');
    const images = previous.data()?.rutasImagenes ?? [];
    tx.set(ref, { ...data, vendedorId: uid, moneda: 'MXN', rutasImagenes: images,
      creadoEn: previous.data()?.creadoEn ?? now(), actualizadoEn: now() });
    const delta = data.cantidadDisponible - (previous.data()?.cantidadDisponible ?? 0);
    if (delta) movement(tx, db, productId, uid, uid, delta, previous.exists ? 'Ajuste de existencias del vendedor' : 'Existencias iniciales');
  });
  return { id: productId };
}

export async function updateImages(db, uid, input) {
  const productId = id(input.id);
  const images = input.paths;
  const prefix = `productos/${uid}/${productId}/`;
  if (!Array.isArray(images) || images.length > 5 || new Set(images).size !== images.length || images.some(path => typeof path !== 'string' || !path.startsWith(prefix) || !/^[A-Za-z0-9_-]+\.(jpg|png|webp)$/.test(path.slice(prefix.length)))) fail('Imágenes inválidas.');
  await db.runTransaction(async tx => {
    const ref = db.doc(`productos/${productId}`);
    const [seller, snapshot] = await Promise.all([tx.get(db.doc(`vendedores/${uid}`)), tx.get(ref)]);
    active(seller.data());
    const product = exists(snapshot);
    if (product.vendedorId !== uid) fail('No puedes editar este producto.');
    if (JSON.stringify(input.expectedPaths) !== JSON.stringify(product.rutasImagenes)) fail('Las imágenes cambiaron. Vuelve a intentarlo.');
    tx.update(ref, { rutasImagenes: images, actualizadoEn: now() });
  });
  return { id: productId };
}

export async function requestQuote(db, uid, input) {
  const productId = id(input.productId);
  const quantity = integer(input.quantity, 1, 1000000);
  const ref = db.collection('cotizaciones').doc();
  await db.runTransaction(async tx => {
    const product = exists(await tx.get(db.doc(`productos/${productId}`)));
    const seller = await tx.get(db.doc(`vendedores/${product.vendedorId}`));
    active(seller.data());
    if (product.vendedorId === uid) fail('No puedes cotizar tus propios productos.');
    if (product.estado !== 'publicado' || quantity < product.cantidadMinimaPedido || quantity > product.cantidadDisponible) fail('Revisa el mínimo de compra y las existencias disponibles.');
    tx.create(ref, {
      compradorId: uid, vendedorId: product.vendedorId, estado: 'solicitada',
      elementos: [{ productoId: productId, nombreProducto: product.nombre, presentacion: product.presentacion,
        cantidad: quantity, precioUnitarioSolicitadoCentavos: product.precioUnitarioCentavos, precioUnitarioCotizadoCentavos: null }],
      notaComprador: text(input.note ?? '', 1000, false) || null, notaVendedor: null,
      venceEn: null, creadoEn: now(), actualizadoEn: now(),
    });
  });
  return { id: ref.id };
}

export async function quoteAction(db, uid, input) {
  const quoteId = id(input.id);
  const ref = db.doc(`cotizaciones/${quoteId}`);
  return db.runTransaction(async tx => {
    const quote = exists(await tx.get(ref));
    if (!Array.isArray(quote.elementos) || quote.elementos.length !== 1) fail('Solicita una nueva cotización por producto.');
    const seller = await tx.get(db.doc(`vendedores/${quote.vendedorId}`));
    const sellerActor = uid === quote.vendedorId;
    const buyerActor = uid === quote.compradorId;
    if (!sellerActor && !buyerActor) fail('No tienes acceso a esta cotización.');
    const action = input.action;
    if (action === 'cotizar') {
      if (!sellerActor || quote.estado !== 'solicitada') fail('La cotización ya no puede responderse.');
      active(seller.data());
      const price = integer(input.price, 1, 999999999);
      tx.update(ref, { estado: 'cotizada', elementos: quote.elementos.map(line => ({ ...line, precioUnitarioCotizadoCentavos: price })),
        notaVendedor: text(input.note ?? '', 1000, false) || null,
        venceEn: Timestamp.fromMillis(Date.now() + 48 * 60 * 60 * 1000), actualizadoEn: now() });
    } else if (action === 'aceptar') {
      if (!buyerActor) fail('Solo el comprador puede aceptar.');
      const orderRef = db.doc(`pedidos/${quoteId}`);
      const order = await tx.get(orderRef);
      if (quote.estado === 'aceptada' && order.exists) return { id: quoteId };
      active(seller.data());
      if (quote.estado !== 'cotizada') fail('La cotización ya no puede aceptarse.');
      if (!quote.venceEn || quote.venceEn.toMillis() <= Date.now()) {
        tx.update(ref, { estado: 'vencida', actualizadoEn: now() });
        return { expired: true };
      }
      const products = await Promise.all(quote.elementos.map(line => tx.get(db.doc(`productos/${line.productoId}`))));
      let total = 0;
      const lines = quote.elementos.map((line, index) => {
        const product = exists(products[index]);
        if (product.vendedorId !== quote.vendedorId || product.estado !== 'publicado' || product.cantidadDisponible < line.cantidad || line.cantidad < product.cantidadMinimaPedido || product.presentacion !== line.presentacion) fail('El producto cambió o no tiene existencias suficientes. Solicita otra cotización.');
        const price = integer(line.precioUnitarioCotizadoCentavos, 1, 999999999);
        const lineTotal = price * line.cantidad;
        total += lineTotal;
        return { productoId: line.productoId, nombreProducto: line.nombreProducto, presentacion: line.presentacion,
          cantidad: line.cantidad, precioUnitarioCentavos: price, totalLineaCentavos: lineTotal };
      });
      if (!Number.isSafeInteger(total)) fail('El total excede el límite permitido.');
      lines.forEach((line, index) => {
        tx.update(products[index].ref, { cantidadDisponible: products[index].data().cantidadDisponible - line.cantidad, actualizadoEn: now() });
        movement(tx, db, line.productoId, quote.vendedorId, uid, -line.cantidad, 'Reserva al aceptar cotización', quoteId);
      });
      tx.create(orderRef, { cotizacionId: quoteId, compradorId: uid, vendedorId: quote.vendedorId,
        elementos: lines, subtotalCentavos: total, moneda: 'MXN', estado: 'pendienteConfirmacionVendedor',
        estadoPagoEfectivo: 'pendiente', efectivoRecibidoEn: null, creadoEn: now(), actualizadoEn: now() });
      tx.update(ref, { estado: 'aceptada', actualizadoEn: now() });
    } else {
      if (!['solicitada', 'cotizada'].includes(quote.estado)) fail('Esta cotización ya está cerrada.');
      if (!((action === 'cancelar' && buyerActor) || (action === 'rechazar' && (sellerActor || buyerActor)))) fail('Acción no permitida.');
      tx.update(ref, { estado: action === 'cancelar' ? 'cancelada' : 'rechazada', actualizadoEn: now() });
    }
    return { id: quoteId };
  });
}

export async function orderAction(db, uid, input) {
  const ref = db.doc(`pedidos/${id(input.id)}`);
  await db.runTransaction(async tx => {
    const order = exists(await tx.get(ref));
    const sellerActor = uid === order.vendedorId;
    const buyerActor = uid === order.compradorId;
    if (!sellerActor && !buyerActor) fail('No tienes acceso a este pedido.');
    const action = input.action;
    if (action === 'cancelado') {
      if (order.estado === 'cancelado') return;
      if (!['pendienteConfirmacionVendedor', 'confirmado'].includes(order.estado) || (buyerActor && order.estado !== 'pendienteConfirmacionVendedor') || order.estadoPagoEfectivo !== 'pendiente') fail('El pedido ya no puede cancelarse.');
      const products = await Promise.all(order.elementos.map(line => tx.get(db.doc(`productos/${line.productoId}`))));
      order.elementos.forEach((line, index) => {
        const product = exists(products[index]);
        tx.update(products[index].ref, { cantidadDisponible: product.cantidadDisponible + line.cantidad, actualizadoEn: now() });
        movement(tx, db, line.productoId, order.vendedorId, uid, line.cantidad, 'Devolución de reserva por cancelación', ref.id);
      });
    } else if (action === 'pago') {
      if (!sellerActor || order.estado !== 'entregado') fail('Registra el efectivo después de entregar el pedido.');
      if (order.estadoPagoEfectivo === 'recibido') return;
      tx.update(ref, { estadoPagoEfectivo: 'recibido', efectivoRecibidoEn: now(), actualizadoEn: now() });
      return;
    } else {
      const next = { pendienteConfirmacionVendedor: 'confirmado', confirmado: 'preparando', preparando: 'listo', listo: 'entregado' };
      if (!sellerActor || next[order.estado] !== action) fail('Transición de pedido no permitida.');
    }
    tx.update(ref, { estado: action, actualizadoEn: now() });
  });
  return { id: ref.id };
}
