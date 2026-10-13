import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import { BrandMark } from "../common/BrandLogo";
import { Product, CustomerOrder, CustomerOrderItem, ProductUnit } from "../../types";
import {
  formatBengaliNumber,
  formatBengaliCurrency,
  formatBengaliDate,
} from "../../utils/bengali";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  ArrowRight,
  X,
  Printer,
  ChevronRight,
  Store,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Package,
  LogOut,
  Sparkles,
  ArrowLeft,
  Receipt,
  RotateCcw,
  Download,
  Loader2,
} from "lucide-react";
import { downloadElementAsPDF } from "../../utils/pdfGenerator";

interface CartItem {
  product: Product;
  quantity: number;
}

export const CustomerStorefront: React.FC = () => {
  const { profile, customerVisibleProducts, placeCustomerOrder, orders } = useBusiness();
  const { user, logout, switchRole } = useAuth();

  // Active view: "shop" | "cart" | "my_orders"
  const [activeView, setActiveView] = useState<"shop" | "cart" | "my_orders">("shop");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সকল");

  // Cart State
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // Checkout Form State
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "বিকাশ" | "নগদ" | "রকেট" | "উপায়" | "ক্যাশ অন ডেলিভারি" | "ব্যাংক ট্রান্সফার"
  >("বিকাশ");
  const [transactionId, setTransactionId] = useState("");
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Completed Order Modal / Invoice
  const [confirmedOrder, setConfirmedOrder] = useState<CustomerOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadOrderPdf = async () => {
    if (!confirmedOrder) return;
    setIsDownloadingPdf(true);
    const docName = `Order_Memo_${confirmedOrder.orderNo}.pdf`;
    await downloadElementAsPDF("customer-order-memo-card", {
      fileName: docName,
      format: "thermal",
    });
    setIsDownloadingPdf(false);
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    customerVisibleProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["সকল", ...Array.from(set)];
  }, [customerVisibleProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return customerVisibleProducts.filter((p) => {
      const matchesCategory =
        selectedCategory === "সকল" || p.category === selectedCategory;
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [customerVisibleProducts, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartItemList = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(
    () => cartItemList.reduce((sum, item) => sum + item.quantity, 0),
    [cartItemList]
  );
  const subtotal = useMemo(
    () =>
      cartItemList.reduce((sum, item) => {
        const price = item.product.customerPrice ?? item.product.sellingPrice;
        return sum + price * item.quantity;
      }, 0),
    [cartItemList]
  );
  const deliveryFee = subtotal > 0 ? profile.deliveryFeeDefault ?? 50 : 0;
  const grandTotal = subtotal + deliveryFee;

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const current = prev[product.id];
      const newQty = current ? current.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: { product, quantity: newQty },
      };
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const newQty = current.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { ...current, quantity: newQty },
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Copy number helper
  const handleCopyNumber = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Submit Order
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cartItemList.length === 0) {
      setFormError("আপনার কার্ট খালি। অনুগ্রহ করে পণ্য যোগ করুন।");
      return;
    }
    if (!customerName.trim()) {
      setFormError("অনুগ্রহ করে আপনার নাম প্রদান করুন।");
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      setFormError("অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর প্রদান করুন (১০-১১ ডিজিট)।");
      return;
    }
    if (!deliveryAddress.trim()) {
      setFormError("অনুগ্রহ করে ডেলিভারি পাওয়ার সম্পূর্ণ ঠিকানা প্রদান করুন।");
      return;
    }

    if (
      ["বিকাশ", "নগদ", "রকেট", "উপায়"].includes(paymentMethod) &&
      !transactionId.trim()
    ) {
      setFormError(
        `আপনি ${paymentMethod} পেমেন্ট বেছে নিয়েছেন। অনুগ্রহ করে পেমেন্ট করার পর ট্রানজেকশন আইডি (TrxID) লিখুন।`
      );
      return;
    }

    setIsSubmitting(true);

    const items: CustomerOrderItem[] = cartItemList.map((item) => {
      const price = item.product.customerPrice ?? item.product.sellingPrice;
      return {
        productId: item.product.id,
        productName: item.product.name,
        unit: item.product.unit,
        price,
        quantity: item.quantity,
        total: price * item.quantity,
      };
    });

    const result = placeCustomerOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: user?.email,
      deliveryAddress: deliveryAddress.trim(),
      items,
      subtotal,
      deliveryFee,
      totalAmount: grandTotal,
      paymentMethod,
      paymentStatus:
        paymentMethod === "ক্যাশ অন ডেলিভারি" ? "বাকি" : "অপেক্ষমান",
      transactionId: transactionId.trim() || undefined,
      note: orderNote.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.order) {
      setConfirmedOrder(result.order);
      setCart({});
      setTransactionId("");
      setOrderNote("");
    } else {
      setFormError(result.error || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে।");
    }
  };

  // Filter user's my orders
  const myOrders = useMemo(() => {
    if (!user) return orders;
    return orders.filter(
      (o) =>
        (user.email && o.customerEmail === user.email) ||
        (user.phone && o.customerPhone === user.phone) ||
        o.customerName === user.name
    );
  }, [orders, user]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172B24] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E4EAE6] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Store Info */}
          <div className="flex items-center gap-3">
            <BrandMark size="sm" animated={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-[#116149] tracking-tight">
                  {profile.businessName || "আমার ব্যবসা"}
                </span>
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#116149] border border-emerald-200">
                  অনলাইন শপ
                </span>
              </div>
              <p className="text-[10px] text-[#68776F] hidden sm:block truncate max-w-xs">
                {profile.tagline || "সরাসরি দোকান থেকে সুলভ মূল্যে কেনাকাটা"}
              </p>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Switchers */}
            <button
              onClick={() => setActiveView("shop")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === "shop"
                  ? "bg-[#116149] text-white shadow-xs"
                  : "bg-gray-100 text-[#68776F] hover:text-[#172B24]"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">পণ্য ক্যাটালগ</span>
            </button>

            <button
              onClick={() => setActiveView("my_orders")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeView === "my_orders"
                  ? "bg-[#116149] text-white shadow-xs"
                  : "bg-gray-100 text-[#68776F] hover:text-[#172B24]"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">আমার অর্ডারসমূহ</span>
              {myOrders.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                  {myOrders.length}
                </span>
              )}
            </button>

            {/* Cart Button with Count Badge */}
            <button
              onClick={() => setActiveView("cart")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
                activeView === "cart"
                  ? "bg-[#16A574] text-white shadow-sm"
                  : "bg-[#F0FAF5] text-[#116149] border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">কার্ট</span>
              {cartItemCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#116149] text-white text-[11px] font-black">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Admin Switch Back Button if previewing */}
            {user?.role === "admin" && (
              <button
                onClick={() => switchRole("admin")}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                title="অ্যাডমিন ড্যাশবোর্ডে ফিরে যান"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">অ্যাডমিন মোডে ফিরুন</span>
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ============================================================== */}
        {/* VIEW 1: SHOP CATALOG & PRODUCTS */}
        {/* ============================================================== */}
        {activeView === "shop" && (
          <div className="space-y-6">
            {/* Store Hero Banner */}
            <div className="rounded-3xl bg-linear-to-r from-[#116149] via-[#0e523e] to-[#16A574] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 rounded-l-full pointer-events-none" />
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  সরাসরি দোকান থেকে খাঁটি পণ্য ও দ্রুত হোম ডেলিভারি
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                  {profile.businessName || "আমাদের দোকান"} ক্যাটালগ
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
                  পছন্দের পণ্য বেছে নিয়ে সহজে কার্টে যোগ করুন। বিকাশ, নগদ, রকেট অথবা পণ্য হাতে পেয়ে ক্যাশ অন ডেলিভারিতে বিল পরিশোধের সুবিধা রয়েছে।
                </p>

                {/* Search Bar inside Hero */}
                <div className="mt-5 relative max-w-lg">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="পণ্য খুঁজুন (নাম বা বারকোড দিয়ে)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white text-[#172B24] placeholder-gray-400 text-sm focus:outline-hidden shadow-lg font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#116149] text-white shadow-xs"
                      : "bg-white text-[#68776F] hover:text-[#172B24] border border-[#E4EAE6]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Count and Summary */}
            <div className="flex items-center justify-between text-xs text-[#68776F]">
              <span>
                মোট প্রদর্শিত পণ্য:{" "}
                <strong className="text-[#172B24]">
                  {formatBengaliNumber(filteredProducts.length)} টি
                </strong>
              </span>
              {cartItemCount > 0 && (
                <button
                  onClick={() => setActiveView("cart")}
                  className="text-[#116149] font-bold flex items-center gap-1 hover:underline"
                >
                  কার্টে {formatBengaliNumber(cartItemCount)} টি পণ্য রয়েছে ({formatBengaliCurrency(subtotal)})
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E4EAE6] p-12 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-base text-[#172B24]">
                  কোনো পণ্য পাওয়া যায়নি
                </h3>
                <p className="text-xs text-[#68776F] max-w-sm mx-auto mt-1">
                  আপনার অনুসন্ধানের সাথে মেলে এমন কোনো পণ্য এই মুহূর্তে নেই। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("সকল");
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-50 text-[#116149] rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  সব পণ্য দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredProducts.map((product) => {
                  const inCart = cart[product.id];
                  const displayPrice =
                    product.customerPrice ?? product.sellingPrice;
                  const isOutOfStock = product.stock <= 0;

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-[#E4EAE6] p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      {/* Top Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F0FAF5] text-[#116149] border border-emerald-100 truncate">
                            {product.category || "সাধারণ"}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                              স্টক শেষ
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-50 text-emerald-700 border border-gray-200">
                              স্টকে আছে ({formatBengaliNumber(product.stock)} {product.unit})
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <h3 className="font-bold text-sm text-[#172B24] line-clamp-2 leading-snug group-hover:text-[#116149] transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-[#68776F] mt-0.5 font-mono">
                          কোড: {product.code}
                        </p>
                      </div>

                      {/* Pricing & Add to Cart */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#68776F] block leading-none">
                            মূল্য (প্রতি {product.unit})
                          </span>
                          <span className="font-black text-lg text-[#116149] leading-tight">
                            {formatBengaliCurrency(displayPrice)}
                          </span>
                        </div>

                        {/* Cart Action Buttons */}
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed"
                          >
                            স্টক আউট
                          </button>
                        ) : inCart ? (
                          <div className="flex items-center gap-1.5 bg-[#F0FAF5] border border-emerald-200 rounded-xl p-1">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white text-[#116149] flex items-center justify-center hover:bg-emerald-100 active:scale-95 shadow-2xs font-bold transition-all"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 font-black text-xs text-[#116149]">
                              {formatBengaliNumber(inCart.quantity)}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="w-7 h-7 rounded-lg bg-[#116149] text-white flex items-center justify-center hover:bg-[#0e523e] active:scale-95 shadow-2xs font-bold transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="py-2 px-3.5 bg-[#116149] hover:bg-[#0e523e] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 hover:shadow"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            কার্টে নিন
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: CART & BILLING / CHECKOUT WITH BD PAYMENT METHODS */}
        {/* ============================================================== */}
        {activeView === "cart" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveView("shop")}
                  className="text-xs text-[#116149] font-bold flex items-center gap-1 hover:underline mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  পণ্য ক্যাটালগে ফিরে যান
                </button>
                <h1 className="text-2xl font-black text-[#172B24]">
                  আপনার শপিং ব্যাগ ও বিলিং সেকশন
                </h1>
              </div>
              {cartItemList.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 p-2 rounded-xl hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  কার্ট খালি করুন
                </button>
              )}
            </div>

            {cartItemList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E4EAE6] p-12 text-center">
                <ShoppingCart className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-[#172B24]">
                  আপনার শপিং ব্যাগ খালি!
                </h3>
                <p className="text-xs text-[#68776F] max-w-sm mx-auto mt-1 mb-5">
                  আপনি এখনো কোনো পণ্য কার্টে যোগ করেননি। ক্যাটালগ থেকে আপনার প্রয়োজনীয় পণ্যগুলো বেছে নিন।
                </p>
                <button
                  onClick={() => setActiveView("shop")}
                  className="px-6 py-3 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-2xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  দোকানের পণ্য ক্যাটালগ দেখুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Cart Items List (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-2xl border border-[#E4EAE6] p-5 shadow-xs">
                    <h2 className="font-extrabold text-base text-[#172B24] mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#116149]" />
                      অর্ডারকৃত পণ্যের তালিকা ({formatBengaliNumber(cartItemList.length)} টি আইটেম)
                    </h2>

                    <div className="divide-y divide-gray-100">
                      {cartItemList.map(({ product, quantity }) => {
                        const unitPrice =
                          product.customerPrice ?? product.sellingPrice;
                        const itemTotal = unitPrice * quantity;

                        return (
                          <div
                            key={product.id}
                            className="py-3.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-[#172B24] truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs text-[#68776F] mt-0.5">
                                প্রতি {product.unit}: {formatBengaliCurrency(unitPrice)}
                              </p>
                            </div>

                            {/* Stepper */}
                            <div className="flex items-center gap-1.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl p-1">
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                className="w-6 h-6 rounded-lg bg-white text-[#172B24] flex items-center justify-center hover:bg-gray-100 shadow-2xs font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-black text-xs text-[#116149]">
                                {formatBengaliNumber(quantity)}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                className="w-6 h-6 rounded-lg bg-[#116149] text-white flex items-center justify-center hover:bg-[#0e523e] shadow-2xs font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right min-w-[75px]">
                              <span className="font-extrabold text-sm text-[#116149] block">
                                {formatBengaliCurrency(itemTotal)}
                              </span>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="text-[10px] text-gray-400 hover:text-red-500 font-semibold"
                              >
                                মুছুন
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-white rounded-2xl border border-[#E4EAE6] p-5 shadow-xs space-y-2.5">
                    <h3 className="font-bold text-sm text-[#172B24]">
                      বিলের সংক্ষিপ্ত বিবরণ
                    </h3>
                    <div className="flex justify-between text-xs text-[#68776F]">
                      <span>পণ্যের মোট মূল্য (Subtotal):</span>
                      <span className="font-bold text-[#172B24]">
                        {formatBengaliCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#68776F]">
                      <span>ডেলিভারি চার্জ:</span>
                      <span className="font-bold text-[#172B24]">
                        {formatBengaliCurrency(deliveryFee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                      <span className="font-black text-sm text-[#172B24]">
                        সর্বমোট প্রদেয় বিল:
                      </span>
                      <span className="font-black text-xl text-[#116149]">
                        {formatBengaliCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Customer Info & Bangladeshi Payment Methods (5 cols) */}
                <div className="lg:col-span-5">
                  <form
                    onSubmit={handleConfirmOrder}
                    className="bg-white rounded-2xl border border-[#E4EAE6] p-6 shadow-xs space-y-4"
                  >
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="font-extrabold text-base text-[#172B24] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#116149]" />
                        ডেলিভারি ও বিলিং তথ্য
                      </h3>
                      <p className="text-xs text-[#68776F] mt-0.5">
                        সঠিক তথ্য দিয়ে অর্ডারটি চূড়ান্ত করুন
                      </p>
                    </div>

                    {formError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Customer Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#172B24] mb-1">
                        আপনার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: তানভীর হাসান"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:border-[#16A574] focus:outline-hidden"
                      />
                    </div>

                    {/* Customer Phone */}
                    <div>
                      <label className="block text-xs font-bold text-[#172B24] mb-1">
                        মোবাইল নম্বর (বাংলাদেশি) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="০১৭xxxxxxxx"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:border-[#16A574] focus:outline-hidden"
                      />
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <label className="block text-xs font-bold text-[#172B24] mb-1">
                        ডেলিভারির সম্পূর্ণ ঠিকানা *
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা, থানা ও জেলা..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:border-[#16A574] focus:outline-hidden resize-none"
                      />
                    </div>

                    {/* Bangladeshi Payment Methods */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-xs font-bold text-[#172B24] mb-2">
                        পেমেন্ট পদ্ধতি নির্বাচন করুন (Bangladeshi Payment Methods) *
                      </label>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* bKash */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("বিকাশ")}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            paymentMethod === "বিকাশ"
                              ? "border-pink-500 bg-pink-50/70 text-pink-900 shadow-2xs font-extrabold ring-1 ring-pink-500"
                              : "border-[#E4EAE6] hover:bg-gray-50 text-gray-700 font-semibold"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-bold">
                            🌸 বিকাশ (bKash)
                          </span>
                          <span className="text-[10px] text-pink-700 mt-1 font-medium">
                            সেন্ড মানি / মার্চেন্ট
                          </span>
                        </button>

                        {/* Nagad */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("নগদ")}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            paymentMethod === "নগদ"
                              ? "border-orange-500 bg-orange-50/70 text-orange-900 shadow-2xs font-extrabold ring-1 ring-orange-500"
                              : "border-[#E4EAE6] hover:bg-gray-50 text-gray-700 font-semibold"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-bold">
                            🟧 নগদ (Nagad)
                          </span>
                          <span className="text-[10px] text-orange-700 mt-1 font-medium">
                            সেন্ড মানি / পেমেন্ট
                          </span>
                        </button>

                        {/* Rocket */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("রকেট")}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            paymentMethod === "রকেট"
                              ? "border-purple-500 bg-purple-50/70 text-purple-900 shadow-2xs font-extrabold ring-1 ring-purple-500"
                              : "border-[#E4EAE6] hover:bg-gray-50 text-gray-700 font-semibold"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-bold">
                            🟣 রকেট (Rocket)
                          </span>
                          <span className="text-[10px] text-purple-700 mt-1 font-medium">
                            DBBL মোবাইল ব্যাংকিং
                          </span>
                        </button>

                        {/* Upay */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("উপায়")}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                            paymentMethod === "উপায়"
                              ? "border-blue-500 bg-blue-50/70 text-blue-900 shadow-2xs font-extrabold ring-1 ring-blue-500"
                              : "border-[#E4EAE6] hover:bg-gray-50 text-gray-700 font-semibold"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-bold">
                            🔵 উপায় (Upay)
                          </span>
                          <span className="text-[10px] text-blue-700 mt-1 font-medium">
                            ইউসিবি মোবাইল ওয়ালেট
                          </span>
                        </button>

                        {/* Cash on Delivery */}
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("ক্যাশ অন ডেলিভারি")}
                          className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all col-span-2 ${
                            paymentMethod === "ক্যাশ অন ডেলিভারি"
                              ? "border-[#116149] bg-emerald-50 text-[#116149] shadow-2xs font-extrabold ring-1 ring-[#116149]"
                              : "border-[#E4EAE6] hover:bg-gray-50 text-gray-700 font-semibold"
                          }`}
                        >
                          <span className="flex items-center gap-1.5 font-bold">
                            💵 ক্যাশ অন ডেলিভারি (Cash on Delivery)
                          </span>
                          <span className="text-[10px] text-emerald-800 mt-0.5 font-medium">
                            পণ্য হাতে পেয়ে ডেলিভারিম্যানকে নগদ টাকা পরিশোধ করুন
                          </span>
                        </button>
                      </div>

                      {/* MFS Instructions & TrxID field */}
                      {paymentMethod === "বিকাশ" && (
                        <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-pink-900">
                              বিকাশ নম্বর: {profile.bkashNumber || "01712-345678"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyNumber(profile.bkashNumber || "01712-345678")
                              }
                              className="px-2 py-0.5 bg-white text-pink-700 border border-pink-300 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-pink-100"
                            >
                              {copiedNumber ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                              {copiedNumber ? "কপি হয়েছে!" : "কপি"}
                            </button>
                          </div>
                          <p className="text-[11px] text-pink-800 leading-relaxed">
                            বিকাশ অ্যাপ থেকে <strong>Send Money</strong> করে সর্বমোট <strong>{formatBengaliCurrency(grandTotal)}</strong> পাঠিয়ে প্রাপ্ত TrxID নিচে লিখুন।
                          </p>
                          <input
                            type="text"
                            required
                            placeholder="বিকাশ TrxID লিখুন (যেমন: 9J3K8L2M)..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-pink-300 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                          />
                        </div>
                      )}

                      {paymentMethod === "নগদ" && (
                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-orange-900">
                              নগদ নম্বর: {profile.nagadNumber || "01912-345678"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyNumber(profile.nagadNumber || "01912-345678")
                              }
                              className="px-2 py-0.5 bg-white text-orange-700 border border-orange-300 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-orange-100"
                            >
                              {copiedNumber ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                              {copiedNumber ? "কপি হয়েছে!" : "কপি"}
                            </button>
                          </div>
                          <p className="text-[11px] text-orange-800 leading-relaxed">
                            নগদ অ্যাপ বা *167# ডায়াল করে Send Money করে TrxID দিন।
                          </p>
                          <input
                            type="text"
                            required
                            placeholder="নগদ TrxID লিখুন..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                          />
                        </div>
                      )}

                      {paymentMethod === "রকেট" && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-900">
                              রকেট নম্বর: {profile.rocketNumber || "01812-345678"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyNumber(profile.rocketNumber || "01812-345678")
                              }
                              className="px-2 py-0.5 bg-white text-purple-700 border border-purple-300 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-purple-100"
                            >
                              {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedNumber ? "কপি হয়েছে!" : "কপি"}
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="রকেট TrxID লিখুন..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                          />
                        </div>
                      )}

                      {paymentMethod === "উপায়" && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-900">
                              উপায় নম্বর: {profile.upayNumber || "01612-345678"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyNumber(profile.upayNumber || "01612-345678")
                              }
                              className="px-2 py-0.5 bg-white text-blue-700 border border-blue-300 rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-blue-100"
                            >
                              {copiedNumber ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {copiedNumber ? "কপি হয়েছে!" : "কপি"}
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="উপায় TrxID লিখুন..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>

                    {/* Order Note */}
                    <div>
                      <label className="block text-xs font-bold text-[#172B24] mb-1">
                        বিশেষ নির্দেশনা বা নোট (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: বিকেলে ডেলিভারি দিন..."
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:border-[#16A574] focus:outline-hidden"
                      />
                    </div>

                    {/* Confirm Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#116149] hover:bg-[#0e523e] text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] hover:shadow-lg mt-2"
                    >
                      {isSubmitting ? (
                        <span>অর্ডার সম্পন্ন হচ্ছে...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          অর্ডার কনফার্ম করুন ({formatBengaliCurrency(grandTotal)})
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: MY ORDERS (কাস্টমারের অর্ডার হিস্ট্রি) */}
        {/* ============================================================== */}
        {activeView === "my_orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveView("shop")}
                  className="text-xs text-[#116149] font-bold flex items-center gap-1 hover:underline mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  পণ্য ক্যাটালগে ফিরে যান
                </button>
                <h1 className="text-2xl font-black text-[#172B24]">
                  আমার অর্ডারসমূহ ({formatBengaliNumber(myOrders.length)} টি)
                </h1>
              </div>
            </div>

            {myOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E4EAE6] p-12 text-center">
                <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-[#172B24]">
                  এখনো কোনো অর্ডার করেননি!
                </h3>
                <p className="text-xs text-[#68776F] max-w-sm mx-auto mt-1 mb-5">
                  দোকান থেকে আপনার প্রয়োজনীয় সামগ্রী অর্ডার করুন এবং সহজে ডেলিভারি গ্রহণ করুন।
                </p>
                <button
                  onClick={() => setActiveView("shop")}
                  className="px-6 py-3 bg-[#116149] text-white rounded-2xl text-xs font-bold hover:bg-[#0d4f3b] shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  পণ্য ক্যাটালগ দেখুন
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((ord) => {
                  const statusColors: Record<string, string> = {
                    "অপেক্ষমান": "bg-amber-100 text-amber-800 border-amber-200",
                    "অনুমোদিত": "bg-blue-100 text-blue-800 border-blue-200",
                    "ডেলিভারি সম্পন্ন": "bg-emerald-100 text-emerald-800 border-emerald-200",
                    "বাতিল": "bg-red-100 text-red-800 border-red-200",
                  };

                  return (
                    <div
                      key={ord.id}
                      className="bg-white rounded-2xl border border-[#E4EAE6] p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-sm text-[#116149]">
                            #{ord.orderNo}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                              statusColors[ord.orderStatus] || "bg-gray-100"
                            }`}
                          >
                            {ord.orderStatus}
                          </span>
                        </div>
                        <span className="text-xs text-[#68776F]">
                          {formatBengaliDate(ord.createdAt)}
                        </span>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 text-xs">
                        {ord.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-gray-700"
                          >
                            <span>
                              {item.productName} ({formatBengaliNumber(item.quantity)} {item.unit})
                            </span>
                            <span className="font-bold">
                              {formatBengaliCurrency(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Payment details */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-[#68776F]">
                          পেমেন্ট মেথড:{" "}
                          <strong className="text-[#172B24]">
                            {ord.paymentMethod}
                          </strong>
                          {ord.transactionId && (
                            <span className="ml-2 font-mono text-gray-500">
                              (TrxID: {ord.transactionId})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-[#172B24]">
                            মোট বিল:{" "}
                            <span className="font-black text-[#116149]">
                              {formatBengaliCurrency(ord.totalAmount)}
                            </span>
                          </span>

                          <button
                            onClick={() => setConfirmedOrder(ord)}
                            className="px-3 py-1.5 bg-[#F0FAF5] text-[#116149] border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            রসিদ মেমো
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* ORDER CONFIRMATION / DIGITAL INVOICE MODAL */}
      {/* ============================================================== */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative my-8">
            <button
              onClick={() => setConfirmedOrder(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Success Badge */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#116149] flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-xl text-[#172B24]">
                অর্ডার সফলভাবে গৃহীত হয়েছে!
              </h3>
              <p className="text-xs text-[#68776F] mt-1">
                অর্ডার নম্বর:{" "}
                <strong className="text-[#116149] font-mono text-sm">
                  #{confirmedOrder.orderNo}
                </strong>
              </p>
            </div>

            {/* Receipt Card */}
            <div
              id="customer-order-memo-card"
              className="bg-[#F7F9FC] rounded-2xl border border-[#E4EAE6] p-4 text-xs space-y-3 font-sans"
            >
              <div className="flex justify-between border-b border-gray-200 pb-2">
                <div>
                  <h4 className="font-bold text-[#116149]">
                    {profile.businessName}
                  </h4>
                  <p className="text-[11px] text-gray-500">{profile.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-700 block">
                    তারিখ ও সময়
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {formatBengaliDate(confirmedOrder.createdAt)}
                  </span>
                </div>
              </div>

              {/* Customer details */}
              <div>
                <p className="text-gray-600">
                  গ্রাহক:{" "}
                  <strong className="text-gray-900">
                    {confirmedOrder.customerName}
                  </strong>{" "}
                  ({confirmedOrder.customerPhone})
                </p>
                <p className="text-gray-600 mt-0.5">
                  ঠিকানা: {confirmedOrder.deliveryAddress}
                </p>
              </div>

              {/* Items Table */}
              <div className="border-t border-gray-200 pt-2 space-y-1">
                {confirmedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-gray-800">
                    <span>
                      {it.productName} ({formatBengaliNumber(it.quantity)} {it.unit})
                    </span>
                    <span className="font-bold">
                      {formatBengaliCurrency(it.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Financials */}
              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>সাবটোটাল:</span>
                  <span>{formatBengaliCurrency(confirmedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span>{formatBengaliCurrency(confirmedOrder.deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-[#116149] pt-1 border-t border-gray-200">
                  <span>সর্বমোট বিল:</span>
                  <span>{formatBengaliCurrency(confirmedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white rounded-xl p-2.5 border border-gray-200">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-600">পেমেন্ট মেথড:</span>
                  <strong className="text-[#172B24]">
                    {confirmedOrder.paymentMethod}
                  </strong>
                </div>
                {confirmedOrder.transactionId && (
                  <div className="flex justify-between text-[11px] mt-1 font-mono">
                    <span className="text-gray-600">TrxID:</span>
                    <strong className="text-emerald-700">
                      {confirmedOrder.transactionId}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between text-[11px] mt-1">
                  <span className="text-gray-600">অর্ডার স্ট্যাটাস:</span>
                  <span className="font-bold text-amber-600">
                    {confirmedOrder.orderStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleDownloadOrderPdf}
                disabled={isDownloadingPdf}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloadingPdf ? "তৈরি হচ্ছে..." : "মেমো PDF ডাউনলোড"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 border border-[#E4EAE6] bg-gray-50 hover:bg-gray-100 text-[#172B24] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                প্রিন্ট
              </button>
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  setActiveView("shop");
                }}
                className="py-2.5 px-4 bg-[#116149] hover:bg-[#0e523e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                চালিয়ে যান
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
