export type BusinessCategory =
  | "মুদি দোকান"
  | "কাপড়ের দোকান"
  | "কসমেটিকস"
  | "ইলেকট্রনিকস"
  | "অনলাইন ব্যবসা"
  | "ফেসবুকভিত্তিক ব্যবসা"
  | "হোম বিজনেস"
  | "ফার্মেসি ও ঔষধ"
  | "অন্যান্য";

export type UserRole = "admin" | "customer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  role: UserRole;
}

export interface BusinessProfile {
  id: string;
  businessName: string;
  businessType: BusinessCategory;
  ownerName: string;
  phone: string;
  address: string;
  currency: string;
  startDate: string;
  tagline: string;
  receiptFooter: string;
  lowStockDefaultThreshold: number;
  useBengaliDigits: boolean;
  isOnboarded: boolean;
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  upayNumber?: string;
  deliveryFeeDefault?: number;
}

export type ProductUnit =
  | "পিস"
  | "কেজি"
  | "গ্রাম"
  | "লিটার"
  | "প্যাকেট"
  | "ডজন"
  | "বক্স"
  | "মিটার"
  | "জোড়া";

export interface Product {
  id: string;
  name: string;
  code: string; // SKU or barcode
  category: string;
  costPrice: number; // ক্রয়মূল্য
  sellingPrice: number; // বিক্রয়মূল্য
  customerPrice?: number; // কাস্টমার ক্যাটালগ বিক্রয়মূল্য
  showInCatalog?: boolean; // কাস্টমারকে অনলাইন ক্যাটালগে দেখাবে কি না (default true)
  stock: number; // বর্তমান স্টক
  minStockAlert: number; // সর্বনিম্ন স্টক সীমা
  unit: ProductUnit;
  supplierId?: string;
  supplierName?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "অপেক্ষমান" | "অনুমোদিত" | "ডেলিভারি সম্পন্ন" | "বাতিল";

export interface CustomerOrderItem {
  productId: string;
  productName: string;
  unit: ProductUnit;
  price: number;
  quantity: number;
  total: number;
}

export interface CustomerOrder {
  id: string;
  orderNo: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  items: CustomerOrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: "বিকাশ" | "নগদ" | "রকেট" | "উপায়" | "ক্যাশ অন ডেলিভারি" | "ব্যাংক ট্রান্সফার";
  paymentStatus: "অপেক্ষমান" | "পরিশোধিত" | "বাকি";
  transactionId?: string;
  orderStatus: OrderStatus;
  note?: string;
}

export type MovementType = "বিক্রি" | "নতুন ক্রয়" | "সমন্বয়" | "নষ্ট বা ক্ষতি" | "বিক্রয় ফেরত";

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // sale id or purchase id
  date: string;
}

export type PaymentMethod = "নগদ" | "বিকাশ" | "নগদ (এমএফএস)" | "রকেট" | "ব্যাংক" | "বাকি" | "আংশিক পরিশোধ";
export type PaymentStatus = "পরিশোধিত" | "বাকি" | "আংশিক";

export interface SaleItem {
  productId: string;
  productName: string;
  unit: ProductUnit;
  unitPrice: number;
  costPrice: number; // For COGS calculation
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  date: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string; // TrxID or note
  paymentStatus: PaymentStatus;
  notes?: string;
  isVoided?: boolean;
  voidReason?: string;
}

export type ExpenseCategory =
  | "দোকান ভাড়া"
  | "বিদ্যুৎ ও ইউটিলিটি"
  | "পরিবহন"
  | "কর্মচারীর বেতন"
  | "পণ্য পরিবহন ও সরাসরি খরচ"
  | "প্যাকেজিং"
  | "মার্কেটিং ও বিজ্ঞাপন"
  | "আপ্যায়ন ও বিবিধ"
  | "অন্যান্য";

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: "নগদ" | "বিকাশ" | "ব্যাংক" | "অন্যান্য";
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
  currentDue: number;
  createdAt: string;
  lastTransactionDate?: string;
}

export interface CustomerPayment {
  id: string;
  receiptNo: string;
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  paymentMethod: "নগদ" | "বিকাশ" | "ব্যাংক";
  reference?: string;
  notes?: string;
  previousDue: number;
  remainingDue: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  suppliedItems: string;
  notes?: string;
  totalPurchased: number;
  createdAt: string;
}

export interface SupplierPurchase {
  id: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "low_stock" | "due_reminder" | "high_expense" | "system" | "tip";
  date: string;
  isRead: boolean;
  actionUrl?: string; // target tab
}

export interface AIChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  isLiveAI?: boolean;
  notice?: string;
}

export type ActiveTab =
  | "setup"
  | "dashboard"
  | "pos"
  | "sales_history"
  | "inventory"
  | "catalog_manager"
  | "expenses"
  | "dues"
  | "customers"
  | "suppliers"
  | "receipts"
  | "reports"
  | "ai_assistant"
  | "settings";
