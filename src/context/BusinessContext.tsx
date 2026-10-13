import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  BusinessProfile,
  Product,
  Customer,
  Supplier,
  Expense,
  Sale,
  AppNotification,
  InventoryMovement,
  CustomerPayment,
  ActiveTab,
  MovementType,
  CustomerOrder,
  OrderStatus,
  CustomerOrderItem,
  SaleItem,
} from "../types";
import {
  initialBusinessProfile,
  sampleProducts,
  sampleCustomers,
  sampleSuppliers,
  sampleExpenses,
  sampleSales,
  sampleNotifications,
  sampleMovements,
} from "../data/initialData";

const STORAGE_KEY_PREFIX = "amar_business_ai_";
const CLEAN_STORAGE_VERSION = "v8_order_catalog_ready";

// One-time clear of previous mock/fake demo data to ensure a fresh clean slate
try {
  if (typeof window !== "undefined" && localStorage.getItem("amar_business_ai_clean_version") !== CLEAN_STORAGE_VERSION) {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}profile`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}sales`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}expenses`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}customers`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}suppliers`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}movements`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}notifications`);
    localStorage.setItem("amar_business_ai_clean_version", CLEAN_STORAGE_VERSION);
  }
} catch (e) {
  console.warn("Storage migration warning:", e);
}

interface BusinessContextType {
  profile: BusinessProfile;
  updateProfile: (profile: Partial<BusinessProfile>) => void;
  products: Product[];
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (productId: string, quantityChange: number, reason: string, type?: MovementType) => void;
  toggleProductCatalogVisibility: (id: string, show?: boolean) => void;
  updateProductCustomerPrice: (id: string, customerPrice: number) => void;
  batchSetCatalogVisibility: (show: boolean) => void;
  customerVisibleProducts: Product[];
  orders: CustomerOrder[];
  placeCustomerOrder: (order: Omit<CustomerOrder, "id" | "orderNo" | "createdAt" | "orderStatus">) => { success: boolean; order?: CustomerOrder; error?: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteCustomerOrder: (orderId: string) => void;
  convertOrderToSale: (orderId: string) => { success: boolean; sale?: Sale; error?: string };
  sales: Sale[];
  completeSale: (sale: Omit<Sale, "id" | "receiptNo">) => { success: boolean; sale?: Sale; error?: string };
  voidSale: (saleId: string, reason: string) => { success: boolean; error?: string };
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Expense;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, "id" | "totalPurchases" | "totalPaid" | "currentDue" | "createdAt">) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  recordCustomerPayment: (payment: Omit<CustomerPayment, "id" | "receiptNo">) => { success: boolean; paymentReceipt?: CustomerPayment; error?: string };
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, "id" | "totalPurchased" | "createdAt">) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  movements: InventoryMovement[];
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Computed helpers
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  totalDue: number;
  lowStockItems: Product[];
  recentSales: Sale[];
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Business Profile (starts clean)
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}profile`);
      return saved ? JSON.parse(saved) : initialBusinessProfile;
    } catch {
      return initialBusinessProfile;
    }
  });

  // 2. Products (with catalog fields support)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}products`);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            showInCatalog: p.showInCatalog ?? true,
            customerPrice: p.customerPrice ?? p.sellingPrice,
          }));
        }
      }
      return sampleProducts.map((p) => ({
        ...p,
        showInCatalog: p.showInCatalog ?? true,
        customerPrice: p.customerPrice ?? p.sellingPrice,
      }));
    } catch {
      return sampleProducts;
    }
  });

  // 2.1 Customer Orders
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}orders`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Sales (starts clean and empty - zero fake data)
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sales`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Expenses (starts clean and empty - zero fake data)
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}expenses`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Customers (starts clean and empty - zero fake data)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}customers`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 6. Suppliers (starts clean and empty - zero fake data)
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}suppliers`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 7. Inventory Movements (starts clean and empty - zero fake data)
  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}movements`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 8. Notifications (starts clean and empty)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}notifications`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 9. Navigation Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return profile.isOnboarded ? "dashboard" : "setup";
  });

  // Synchronize to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}profile`, JSON.stringify(profile));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}products`, JSON.stringify(products));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}sales`, JSON.stringify(sales));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}expenses`, JSON.stringify(expenses));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}customers`, JSON.stringify(customers));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}suppliers`, JSON.stringify(suppliers));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [suppliers]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}movements`, JSON.stringify(movements));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}notifications`, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}orders`, JSON.stringify(orders));
    } catch (e) {
      console.warn("Storage error saving orders", e);
    }
  }, [orders]);

  // Profile update
  const updateProfile = (data: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  // Product management
  const addProduct = (prodData: Omit<Product, "id" | "createdAt" | "updatedAt">): Product => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      showInCatalog: prodData.showInCatalog ?? true,
      customerPrice: prodData.customerPrice ?? prodData.sellingPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Initial movement
    if (newProduct.stock > 0) {
      const mov: InventoryMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        type: "নতুন ক্রয়",
        quantityChange: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reason: "প্রাথমিক স্টক এন্ট্রি",
        date: new Date().toISOString(),
      };
      setMovements((prev) => [mov, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, prodData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...prodData, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    // Soft-archive
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
  };

  // Catalog & Customer Price Controls (Admin Section)
  const toggleProductCatalogVisibility = (id: string, show?: boolean) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const currentShow = p.showInCatalog ?? true;
          const nextShow = show !== undefined ? show : !currentShow;
          return { ...p, showInCatalog: nextShow, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  const updateProductCustomerPrice = (id: string, customerPrice: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, customerPrice, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const batchSetCatalogVisibility = (show: boolean) => {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, showInCatalog: show, updatedAt: new Date().toISOString() }))
    );
  };

  // Customer visible products helper
  const customerVisibleProducts = useMemo(() => {
    return products.filter((p) => p.isActive && (p.showInCatalog ?? true));
  }, [products]);

  // Customer Orders Management
  const placeCustomerOrder = (
    orderData: Omit<CustomerOrder, "id" | "orderNo" | "createdAt" | "orderStatus">
  ): { success: boolean; order?: CustomerOrder; error?: string } => {
    try {
      const orderCount = orders.length + 1;
      const orderNo = `ORD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
      const newOrder: CustomerOrder = {
        ...orderData,
        id: `ord-${Date.now()}`,
        orderNo,
        createdAt: new Date().toISOString(),
        orderStatus: "অপেক্ষমান",
      };

      setOrders((prev) => [newOrder, ...prev]);

      // In-app notification for shop owner/admin
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: "নতুন অনলাইন কাস্টমার অর্ডার!",
        message: `${newOrder.customerName} মোট ৳${newOrder.totalAmount} টাকার অর্ডার (#${orderNo}) দিয়েছেন।`,
        type: "system",
        date: new Date().toISOString(),
        isRead: false,
        actionUrl: "catalog_manager",
      };
      setNotifications((prev) => [notif, ...prev]);

      return { success: true, order: newOrder };
    } catch (e: any) {
      return { success: false, error: e?.message || "অর্ডার সম্পন্ন করতে ব্যর্থ হয়েছে" };
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, orderStatus: status } : ord))
    );
  };

  const deleteCustomerOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
  };

  const convertOrderToSale = (
    orderId: string
  ): { success: boolean; sale?: Sale; error?: string } => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: "অর্ডারটি পাওয়া যায়নি" };

    const saleItems: SaleItem[] = order.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        unitPrice: item.price,
        costPrice: prod?.costPrice || 0,
        quantity: item.quantity,
        subtotal: item.total,
        discount: 0,
        total: item.total,
      };
    });

    const paymentMethodMap: Record<string, any> = {
      "বিকাশ": "বিকাশ",
      "নগদ": "নগদ (এমএফএস)",
      "রকেট": "রকেট",
      "ক্যাশ অন ডেলিভারি": "নগদ",
      "ব্যাংক ট্রান্সফার": "ব্যাংক",
      "উপায়": "নগদ (এমএফএস)",
    };

    const res = completeSale({
      date: new Date().toISOString(),
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: saleItems,
      subtotal: order.subtotal,
      discount: 0,
      tax: 0,
      grandTotal: order.totalAmount,
      paidAmount: order.totalAmount,
      dueAmount: 0,
      paymentMethod: paymentMethodMap[order.paymentMethod] || "নগদ",
      paymentReference: order.transactionId,
      paymentStatus: "পরিশোধিত",
      notes: `অনলাইন কাস্টমার অর্ডার #${order.orderNo} হতে বিক্রয় সম্পন্ন`,
    });

    if (res.success) {
      updateOrderStatus(orderId, "ডেলিভারি সম্পন্ন");
    }
    return res;
  };

  const updateStock = (
    productId: string,
    quantityChange: number,
    reason: string,
    type: MovementType = "সমন্বয়"
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const previousStock = target.stock;
    const newStock = Math.max(0, previousStock + quantityChange);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    const mov: InventoryMovement = {
      id: `mov-${Date.now()}`,
      productId: target.id,
      productName: target.name,
      type,
      quantityChange,
      previousStock,
      newStock,
      reason: reason || "স্টক সমন্বয়",
      date: new Date().toISOString(),
    };

    setMovements((prev) => [mov, ...prev]);

    // Check low stock alert
    if (newStock <= target.minStockAlert) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: "স্টক কমে এসেছে!",
        message: `${target.name}-এর স্টক কমে ${newStock} ${target.unit}-এ নেমেছে।`,
        type: "low_stock",
        date: new Date().toISOString(),
        isRead: false,
        actionUrl: "inventory",
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // Complete Sale with atomic inventory check & deduction
  const completeSale = (saleData: Omit<Sale, "id" | "receiptNo">) => {
    // 1. Verify stock availability
    for (const item of saleData.items) {
      const current = products.find((p) => p.id === item.productId);
      if (!current) {
        return { success: false, error: `পণ্য পাওয়া যায়নি: ${item.productName}` };
      }
      if (current.stock < item.quantity) {
        return {
          success: false,
          error: `পর্যাপ্ত স্টক নেই: ${item.productName} (বর্তমান স্টক: ${current.stock} ${current.unit})`,
        };
      }
    }

    // 2. Generate Receipt ID
    const today = new Date();
    const datePrefix = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
    const sequence = String(sales.length + 1).padStart(3, "0");
    const receiptNo = `INV-${datePrefix}-${sequence}`;

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      receiptNo,
    };

    // 3. Atomically decrement stock and log movement
    const movementEntries: InventoryMovement[] = [];
    setProducts((prev) => {
      return prev.map((prod) => {
        const soldItem = saleData.items.find((i) => i.productId === prod.id);
        if (soldItem) {
          const newQty = prod.stock - soldItem.quantity;
          movementEntries.push({
            id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            type: "বিক্রি",
            quantityChange: -soldItem.quantity,
            previousStock: prod.stock,
            newStock: newQty,
            reason: `রসিদ নং ${receiptNo}`,
            referenceId: newSale.id,
            date: newSale.date,
          });
          return { ...prod, stock: newQty };
        }
        return prod;
      });
    });

    if (movementEntries.length > 0) {
      setMovements((prev) => [...movementEntries, ...prev]);
    }

    // 4. Update customer balance if applicable
    if (saleData.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === saleData.customerId) {
            return {
              ...c,
              totalPurchases: c.totalPurchases + saleData.grandTotal,
              totalPaid: c.totalPaid + saleData.paidAmount,
              currentDue: Math.max(0, c.currentDue + saleData.dueAmount),
              lastTransactionDate: newSale.date,
            };
          }
          return c;
        })
      );
    }

    // 5. Save sale
    setSales((prev) => [newSale, ...prev]);

    return { success: true, sale: newSale };
  };

  // Void a sale
  const voidSale = (saleId: string, reason: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, error: "বিক্রয় রেকর্ড পাওয়া যায়নি।" };
    if (sale.isVoided) return { success: false, error: "এই বিক্রয়টি ইতিমধ্যে বাতিল করা হয়েছে।" };

    // 1. Restore inventory
    const restoredMovements: InventoryMovement[] = [];
    setProducts((prev) => {
      return prev.map((prod) => {
        const item = sale.items.find((i) => i.productId === prod.id);
        if (item) {
          const restored = prod.stock + item.quantity;
          restoredMovements.push({
            id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            type: "বিক্রয় ফেরত",
            quantityChange: item.quantity,
            previousStock: prod.stock,
            newStock: restored,
            reason: `বাতিল রসিদ ${sale.receiptNo}: ${reason}`,
            referenceId: sale.id,
            date: new Date().toISOString(),
          });
          return { ...prod, stock: restored };
        }
        return prod;
      });
    });

    if (restoredMovements.length > 0) {
      setMovements((prev) => [...restoredMovements, ...prev]);
    }

    // 2. Adjust customer balance if needed
    if (sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              totalPurchases: Math.max(0, c.totalPurchases - sale.grandTotal),
              totalPaid: Math.max(0, c.totalPaid - sale.paidAmount),
              currentDue: Math.max(0, c.currentDue - sale.dueAmount),
            };
          }
          return c;
        })
      );
    }

    // 3. Mark sale as voided
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, isVoided: true, voidReason: reason } : s))
    );

    return { success: true };
  };

  // Expenses management
  const addExpense = (expData: Omit<Expense, "id" | "createdAt">): Expense => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    return newExp;
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Customers management
  const addCustomer = (
    cData: Omit<Customer, "id" | "totalPurchases" | "totalPaid" | "currentDue" | "createdAt">
  ): Customer => {
    const newCust: Customer = {
      ...cData,
      id: `cust-${Date.now()}`,
      totalPurchases: 0,
      totalPaid: 0,
      currentDue: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  // Record customer payment (বাকি আদায়)
  const recordCustomerPayment = (
    paymentData: Omit<CustomerPayment, "id" | "receiptNo">
  ) => {
    const customer = customers.find((c) => c.id === paymentData.customerId);
    if (!customer) {
      return { success: false, error: "কাস্টমার পাওয়া যায়নি।" };
    }
    if (paymentData.amount <= 0) {
      return { success: false, error: "টাকার পরিমাণ সঠিক নয়।" };
    }

    const previousDue = customer.currentDue;
    const remainingDue = Math.max(0, previousDue - paymentData.amount);

    const receiptNo = `PAY-${Date.now().toString().slice(-6)}`;
    const paymentReceipt: CustomerPayment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receiptNo,
      previousDue,
      remainingDue,
    };

    // Update customer ledger
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === paymentData.customerId) {
          return {
            ...c,
            totalPaid: c.totalPaid + paymentData.amount,
            currentDue: remainingDue,
            lastTransactionDate: paymentData.date,
          };
        }
        return c;
      })
    );

    return { success: true, paymentReceipt };
  };

  // Suppliers management
  const addSupplier = (
    sData: Omit<Supplier, "id" | "totalPurchased" | "createdAt">
  ): Supplier => {
    const newSup: Supplier = {
      ...sData,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSup, ...prev]);
    return newSup;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Reset to Demo Data
  const resetToDemoData = () => {
    setProfile(initialBusinessProfile);
    setProducts(sampleProducts);
    setCustomers(sampleCustomers);
    setSuppliers(sampleSuppliers);
    setExpenses(sampleExpenses);
    setSales(sampleSales);
    setMovements(sampleMovements);
    setNotifications(sampleNotifications);
    setActiveTab("dashboard");
  };

  // Clear all data
  const clearAllData = () => {
    const freshProfile: BusinessProfile = {
      ...initialBusinessProfile,
      businessName: "নতুন ব্যবসা",
      ownerName: "",
      isOnboarded: false,
    };
    setProfile(freshProfile);
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setExpenses([]);
    setSales([]);
    setMovements([]);
    setNotifications([]);
    setActiveTab("setup");
  };

  // Export JSON
  const exportDataJSON = () => {
    const data = {
      profile,
      products,
      customers,
      suppliers,
      expenses,
      sales,
      movements,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    return JSON.stringify(data, null, 2);
  };

  // Import JSON
  const importDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) setProfile(data.profile);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (Array.isArray(data.sales)) setSales(data.sales);
      if (Array.isArray(data.movements)) setMovements(data.movements);
      return true;
    } catch (err) {
      console.error("Failed to parse import JSON", err);
      return false;
    }
  };

  // Real-time summary calculations
  const todayStr = new Date().toISOString().split("T")[0];

  const todaySales = useMemo(() => {
    return sales
      .filter((s) => !s.isVoided && s.date.startsWith(todayStr))
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales, todayStr]);

  const todayExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const todayProfit = useMemo(() => {
    // Profit = Revenue - COGS - Expenses
    const todaySalesList = sales.filter((s) => !s.isVoided && s.date.startsWith(todayStr));
    let totalRevenue = 0;
    let totalCOGS = 0;

    for (const sale of todaySalesList) {
      totalRevenue += sale.grandTotal;
      for (const item of sale.items) {
        totalCOGS += (item.costPrice || 0) * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCOGS;
    return Math.max(0, grossProfit - todayExpenses);
  }, [sales, expenses, todayStr, todayExpenses]);

  const totalDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDue || 0), 0);
  }, [customers]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.isActive && p.stock <= p.minStockAlert);
  }, [products]);

  const recentSales = useMemo(() => {
    return sales.slice(0, 10);
  }, [sales]);

  return (
    <BusinessContext.Provider
      value={{
        profile,
        updateProfile,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        toggleProductCatalogVisibility,
        updateProductCustomerPrice,
        batchSetCatalogVisibility,
        customerVisibleProducts,
        orders,
        placeCustomerOrder,
        updateOrderStatus,
        deleteCustomerOrder,
        convertOrderToSale,
        sales,
        completeSale,
        voidSale,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        customers,
        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        suppliers,
        addSupplier,
        updateSupplier,
        movements,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        activeTab,
        setActiveTab,
        todaySales,
        todayExpenses,
        todayProfit,
        totalDue,
        lowStockItems,
        recentSales,
        resetToDemoData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used within a BusinessProvider");
  }
  return context;
};
