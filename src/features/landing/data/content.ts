export const benefits = [
  {
    icon: "bi-shop-window",
    title: "Encuentra proveedores",
    description:
      "Conecta con vendedores locales y descubre productos frescos disponibles al mayoreo.",
  },
  {
    icon: "bi-tags",
    title: "Cotiza con claridad",
    description:
      "Compara presentaciones, cantidades mínimas y precios antes de confirmar tu pedido.",
  },
  {
    icon: "bi-box-seam",
    title: "Compra con confianza",
    description:
      "Consulta la disponibilidad y da seguimiento a tus pedidos directamente con cada vendedor.",
  },
] as const;

export const steps = [
  { number: "01", title: "Explora", description: "Revisa el catálogo de distintos vendedores." },
  { number: "02", title: "Solicita", description: "Indica los productos y cantidades que necesitas." },
  { number: "03", title: "Acuerda", description: "Recibe una cotización y confirma los detalles." },
] as const;
