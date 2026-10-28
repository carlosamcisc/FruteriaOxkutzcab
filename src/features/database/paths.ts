export const collections = {
  users: "users",
  sellerApplications: "sellerApplications",
  sellers: "sellers",
  products: "products",
  quotes: "quotes",
  orders: "orders",
  inventoryMovements: "inventoryMovements",
} as const;

export const documentPaths = {
  user: (uid: string) => `${collections.users}/${uid}`,
  sellerApplication: (uid: string) =>
    `${collections.sellerApplications}/${uid}`,
  seller: (sellerId: string) => `${collections.sellers}/${sellerId}`,
  product: (productId: string) => `${collections.products}/${productId}`,
  quote: (quoteId: string) => `${collections.quotes}/${quoteId}`,
  order: (orderId: string) => `${collections.orders}/${orderId}`,
  inventoryMovement: (movementId: string) =>
    `${collections.inventoryMovements}/${movementId}`,
} as const;
