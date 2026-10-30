import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  throw new Error(
    "Define GOOGLE_APPLICATION_CREDENTIALS con la ruta del JSON de una cuenta de servicio.",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert(serviceAccountPath),
  });
const db = getFirestore(app);

const migrations = [
  ["users", "usuarios", {
    displayName: "nombre", email: "correo", phone: "telefono",
    createdAt: "creadoEn", updatedAt: "actualizadoEn",
  }],
  ["sellerApplications", "solicitudesVendedores", {
    ownerUid: "propietarioId", businessName: "nombreNegocio",
    description: "descripcion", contactPhone: "telefonoContacto",
    municipality: "municipio", status: "estado", submittedAt: "enviadoEn",
    reviewedAt: "revisadoEn", reviewedBy: "revisadoPor",
    rejectionReason: "motivoRechazo",
  }],
  ["sellers", "vendedores", {
    ownerUid: "propietarioId", businessName: "nombreNegocio",
    description: "descripcion", contactPhone: "telefonoContacto",
    municipality: "municipio", status: "estado",
    createdAt: "creadoEn", updatedAt: "actualizadoEn",
  }],
  ["products", "productos", {
    sellerId: "vendedorId", name: "nombre", description: "descripcion",
    category: "categoria", packageLabel: "presentacion",
    minimumOrderQuantity: "cantidadMinimaPedido",
    availableQuantity: "cantidadDisponible",
    unitPriceMinor: "precioUnitarioCentavos", currency: "moneda",
    status: "estado", imagePaths: "rutasImagenes",
    createdAt: "creadoEn", updatedAt: "actualizadoEn",
  }],
  ["quotes", "cotizaciones", {
    buyerId: "compradorId", sellerId: "vendedorId", items: "elementos",
    status: "estado", buyerNote: "notaComprador", sellerNote: "notaVendedor",
    expiresAt: "venceEn", createdAt: "creadoEn", updatedAt: "actualizadoEn",
  }],
  ["orders", "pedidos", {
    quoteId: "cotizacionId", buyerId: "compradorId", sellerId: "vendedorId",
    items: "elementos", subtotalMinor: "subtotalCentavos", currency: "moneda",
    status: "estado", cashPaymentStatus: "estadoPagoEfectivo",
    cashReceivedAt: "efectivoRecibidoEn", createdAt: "creadoEn",
    updatedAt: "actualizadoEn",
  }],
  ["inventoryMovements", "movimientosInventario", {
    sellerId: "vendedorId", productId: "productoId", kind: "tipo",
    quantity: "cantidad", reason: "motivo", orderId: "pedidoId",
    actorUid: "actorId", createdAt: "creadoEn",
  }],
];

const statusTranslations = {
  pending: "pendiente", approved: "aprobada", rejected: "rechazada",
  active: "activo", suspended: "suspendido", draft: "borrador",
  published: "publicado", paused: "pausado", requested: "solicitada",
  quoted: "cotizada", accepted: "aceptada", declined: "rechazada",
  cancelled: "cancelada", expired: "vencida",
  pending_seller_confirmation: "pendienteConfirmacionVendedor",
  confirmed: "confirmado", preparing: "preparando", ready: "listo",
  delivered: "entregado", due: "pendiente", received: "recibido",
  incoming: "entrada", sale: "venta", adjustment: "ajuste",
};

const fieldTranslations = Object.assign(
  {},
  ...migrations.map(([, , fields]) => fields),
  { productId: "productoId", productName: "nombreProducto", packageLabel: "presentacion", quantity: "cantidad", requestedUnitPriceMinor: "precioUnitarioSolicitadoCentavos", quotedUnitPriceMinor: "precioUnitarioCotizadoCentavos", unitPriceMinor: "precioUnitarioCentavos", lineTotalMinor: "totalLineaCentavos" },
);

function translateValue(key, value) {
  if (key === "estado" || key === "estadoPagoEfectivo" || key === "tipo") {
    return statusTranslations[value] ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => translateValue(key, item));
  }
  if (value && typeof value === "object" && !value.toDate) {
    return Object.fromEntries(
      Object.entries(value).map(([nestedKey, nestedValue]) => [
        fieldTranslations[nestedKey] ?? nestedKey,
        translateValue(fieldTranslations[nestedKey] ?? nestedKey, nestedValue),
      ]),
    );
  }
  return value;
}

function translateDocument(data, fields) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      fields[key] ?? key,
      translateValue(fields[key] ?? key, value),
    ]),
  );
}

for (const [source, target, fields] of migrations) {
  const snapshot = await db.collection(source).get();
  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchSize = 0;

  for (const document of snapshot.docs) {
    const targetReference = db.collection(target).doc(document.id);
    if ((await targetReference.get()).exists) { skipped += 1; continue; }
    const translated = translateDocument(document.data(), fields);
    if (target === "pedidos" && translated.estado === "cancelada") translated.estado = "cancelado";
    batch.create(targetReference, translated);
    migrated += 1;
    batchSize += 1;

    if (batchSize === 450) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }
  console.log(`${source} -> ${target}: ${migrated} documento(s) copiado(s), ${skipped} existente(s) conservado(s)`);
}

console.log("Migración terminada. Los documentos originales no fueron eliminados.");
