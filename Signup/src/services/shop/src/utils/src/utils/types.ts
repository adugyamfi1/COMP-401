export type IUserStatus = "ACTIVE" | "DELETED" | "SUSPENDED";
export type IShopStatus = "UNVERIFIED" | "VERIFIED" | "DELETED" | "SUSPENDED";
export type IOrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"
  | "ON HOLD"
  | "BACKORDERED"
  | "RETURNED"
  | "FAILED"
  | "COMPLETED";
export type IUserTypes = "ADMIN" | "USER";
export type IEmailTemplates = "default";
