import type { Timestamp } from "firebase/firestore";

export type SellerApplicationStatus = "pending" | "approved" | "rejected";
export type SellerStatus = "active" | "suspended";
export type ProductStatus = "draft" | "published" | "paused";
export type QuoteStatus =
  | "requested"
  | "quoted"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";
export type OrderStatus =
  | "pending_seller_confirmation"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";
export type CashPaymentStatus = "due" | "received";

export interface UserProfile {
  displayName: string;
  email: string;
  phone: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SellerApplication {
  ownerUid: string;
  businessName: string;
  description: string;
  contactPhone: string;
  municipality: string;
  status: SellerApplicationStatus;
  submittedAt: Timestamp;
  reviewedAt: Timestamp | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
}

export interface SellerProfile {
  ownerUid: string;
  businessName: string;
  description: string;
  contactPhone: string;
  municipality: string;
  status: SellerStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product {
  sellerId: string;
  name: string;
  description: string;
  category: string;
  packageLabel: string;
  minimumOrderQuantity: number;
  availableQuantity: number;
  unitPriceMinor: number;
  currency: "MXN";
  status: ProductStatus;
  imagePaths: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuoteItem {
  productId: string;
  productName: string;
  packageLabel: string;
  quantity: number;
  requestedUnitPriceMinor: number;
  quotedUnitPriceMinor: number | null;
}

export interface Quote {
  buyerId: string;
  sellerId: string;
  items: QuoteItem[];
  status: QuoteStatus;
  buyerNote: string | null;
  sellerNote: string | null;
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  packageLabel: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface Order {
  quoteId: string;
  buyerId: string;
  sellerId: string;
  items: OrderItem[];
  subtotalMinor: number;
  currency: "MXN";
  status: OrderStatus;
  cashPaymentStatus: CashPaymentStatus;
  cashReceivedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type InventoryMovementKind = "incoming" | "sale" | "adjustment";

export interface InventoryMovement {
  sellerId: string;
  productId: string;
  kind: InventoryMovementKind;
  quantity: number;
  reason: string;
  orderId: string | null;
  actorUid: string;
  createdAt: Timestamp;
}
