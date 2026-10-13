import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Product, Customer, PaymentMethod, PaymentStatus, SaleItem, Sale } from "../../types";
import { formatCurrency, toBengaliNumber } from "../../utils/bengali";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { ReceiptModal } from "../common/ReceiptModal";

export const PosSale: React.FC = () => {
  const { products, customers, addCustomer, completeSale, profile, setActiveTab } = useBusiness();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সব");

  // Cart
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Customer & Payment
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("নগদ");
  const [paidAmountInput, setPaidAmountInput] = useState<string>("");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [saleNotes, setSaleNotes] = useState<string>("");

  // Quick Customer Creation modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Post-Sale Receipt Modal & State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.isActive) set.add(p.category);
    });
    return ["সব", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === "সব" || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const itemsDiscount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  }, [cart]);

  const totalDiscount = itemsDiscount + Number(overallDiscount || 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  // Effective Paid and Due amount calculations based on payment method
  const effectivePaidAmount = useMemo(() => {
    if (paymentMethod === "বাকি") {
      return 0;
    }
    if (paymentMethod === "আংশিক পরিশোধ") {
      const parsed = parseFloat(paidAmountInput);
      return isNaN(parsed) ? 0 : Math.min(grandTotal, Math.max(0, parsed));
    }
    // Fully paid for cash, bKash, bank
    return grandTotal;
  }, [paymentMethod, paidAmountInput, grandTotal]);

  const dueAmount = Math.max(0, grandTotal - effectivePaidAmount);

  // Cart Operations
  const addToCart = (product: Product) => {
    setErrorMessage(null);
    if (product.stock <= 0) {
      setErrorMessage(`"${product.name}" এর পর্যাপ্ত স্টক নেই!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setErrorMessage(`স্টকে মাত্র ${product.stock} ${product.unit} বিদ্যমান!`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
                total: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        );
      } else {
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          quantity: 1,
          subtotal: product.sellingPrice,
          discount: 0,
          total: product.sellingPrice,
        };
        return [...prev, newItem];
      }
    });
  };

  const updateItemQuantity = (productId: string, newQty: number) => {
    setErrorMessage(null);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && newQty > prod.stock) {
      setErrorMessage(`স্টকে মাত্র ${prod.stock} ${prod.unit} বিদ্যমান!`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
              total: Math.max(0, newQty * item.unitPrice - item.discount),
            }
          : item
      )
    );
  };

  const updateItemDiscount = (productId: string, discountVal: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? {
              ...item,
              discount: Math.max(0, discountVal),
              total: Math.max(0, item.subtotal - Math.max(0, discountVal)),
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const resetForm = () => {
    setCart([]);
    setOverallDiscount(0);
    setSelectedCustomerId("");
    setPaymentMethod("নগদ");
    setPaidAmountInput("");
    setPaymentReference("");
    setSaleNotes("");
    setErrorMessage(null);
  };

  // Quick Customer Creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
    });

    setSelectedCustomerId(created.id);
    setNewCustName("");
    setNewCustPhone("");
    setNewCustAddress("");
    setIsCustomerModalOpen(false);
  };

  // Final Submission with Atomic Execution
  const handleCompleteSale = () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage("দয়া করে কার্টে অন্তত একটি পণ্য যোগ করুন।");
      return;
    }

    // If Credit or Partial payment, require Customer
    if ((paymentMethod === "বাকি" || dueAmount > 0) && !selectedCustomerId) {
      setErrorMessage("বাকি বা আংশিক বিক্রয়ের ক্ষেত্রে কাস্টমার নির্বাচন করা আবশ্যক!");
      return;
    }

    setIsSubmitting(true);

    const customer = customers.find((c) => c.id === selectedCustomerId);

    let paymentStatus: PaymentStatus = "পরিশোধিত";
    if (dueAmount > 0) {
      paymentStatus = effectivePaidAmount > 0 ? "আংশিক" : "বাকি";
    }

    const result = completeSale({
      date: new Date().toISOString(),
      customerId: customer?.id,
      customerName: customer?.name,
      customerPhone: customer?.phone,
      items: cart,
      subtotal,
      discount: totalDiscount,
      tax: 0,
      grandTotal,
      paidAmount: effectivePaidAmount,
      dueAmount,
      paymentMethod,
      paymentReference: paymentReference.trim() || undefined,
      paymentStatus,
      notes: saleNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.success || !result.sale) {
      setErrorMessage(result.error || "বিক্রি সম্পন্ন করা যায়নি। দয়া করে আবার চেষ্টা করুন।");
      return;
    }

    // Trigger Celebration Confetti
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    // Open receipt modal and reset cart
    setCompletedSale(result.sale);
    resetForm();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#16A574]" />
            নতুন বিক্রির হিসাব (POS কাউন্টার)
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            পণ্য নির্বাচন করুন, কাস্টমার সিলেক্ট করুন এবং দ্রুত রসিদ প্রদান করুন
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={resetForm}
            className="self-start sm:self-auto px-3 py-1.5 text-xs text-[#D64545] hover:bg-red-50 border border-red-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            কার্ট খালি করুন
          </button>
        )}
      </div>

      {/* Main Grid: Products on Left (7 cols), Cart & Checkout on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Picker */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Pills */}
          <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="পণ্যের নাম বা কোড (SKU) দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#16A574]/30 focus:border-[#16A574] transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#116149] text-white font-semibold"
                      : "bg-[#F7F9FC] text-[#68776F] hover:bg-gray-100 hover:text-[#172B24]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-[#E4EAE6] text-xs text-[#68776F] space-y-3">
                <p>
                  {products.length === 0
                    ? "আপনার দোকানে এখনো কোনো পণ্য যোগ করা হয়নি।"
                    : "অনুসন্ধানের সাথে মিলে এমন কোনো পণ্য পাওয়া যায়নি।"}
                </p>
                {products.length === 0 && (
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    প্রথম পণ্য যোগ করুন
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = cart.find((i) => i.productId === product.id);
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all relative group ${
                      isOutOfStock
                        ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                        : inCart
                        ? "bg-[#F0FAF5] border-[#16A574] shadow-xs ring-1 ring-[#16A574]"
                        : "bg-white border-[#E4EAE6] hover:border-[#16A574] hover:shadow-sm"
                    }`}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#116149] text-white text-[10px] font-bold">
                        {toBengaliNumber(inCart.quantity)}
                      </span>
                    )}

                    <div>
                      <span className="text-[10px] text-[#68776F] font-mono block truncate">
                        {product.code || "পণ্য"}
                      </span>
                      <h4 className="font-semibold text-xs text-[#172B24] line-clamp-2 mt-0.5 leading-snug">
                        {product.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#116149]">
                        {formatCurrency(product.sellingPrice, profile.useBengaliDigits)}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                          product.stock <= product.minStockAlert
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-[#68776F]"
                        }`}
                      >
                        স্টক: {toBengaliNumber(product.stock)} {product.unit}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Sales Cart & Checkout Counter */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E4EAE6] shadow-sm p-5 space-y-5">
          {/* Section: Customer Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#172B24]">
                ক্রেতা / কাস্টমার (ঐচ্ছিক)
              </label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs font-semibold text-[#116149] hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + নতুন কাস্টমার
              </button>
            </div>

            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#16A574]"
            >
              <option value="">সাধারণ খুচরা ক্রেতা (নামহীন)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""} {c.currentDue > 0 ? `[বাকি: ৳${c.currentDue}]` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Section: Cart Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#172B24] border-b pb-1.5">
              <span>কার্টের পণ্যসমূহ ({toBengaliNumber(cart.length)}টি)</span>
              <span>মোট</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#68776F]">
                  কার্ট বর্তমানে খালি। বাম পাশের পণ্য তালিকা থেকে ক্লিক করে যোগ করুন।
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-2.5 bg-[#F7F9FC] rounded-xl border border-[#E4EAE6] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-[#172B24] pr-2">
                        {item.productName}
                      </span>
                      <span className="font-bold text-[#116149]">
                        {formatCurrency(item.total, profile.useBengaliDigits)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-white border border-[#E4EAE6] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded text-[#68776F]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-xs">
                          {toBengaliNumber(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded text-[#68776F]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Unit Price */}
                      <span className="text-[11px] text-[#68776F]">
                        @{formatCurrency(item.unitPrice, profile.useBengaliDigits)}/{item.unit}
                      </span>

                      {/* Remove item */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="পণ্য বাদ দিন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Discount & Financial Summary */}
          <div className="space-y-2 pt-2 border-t border-[#E4EAE6] text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#68776F]">পণ্যের মোট মূল্য:</span>
              <span className="font-semibold text-[#172B24]">
                {formatCurrency(subtotal, profile.useBengaliDigits)}
              </span>
            </div>

            {/* Overall Discount Input */}
            <div className="flex items-center justify-between">
              <span className="text-[#68776F]">বিশেষ ছাড় (টাকা):</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ""}
                placeholder="০"
                onChange={(e) => setOverallDiscount(Math.max(0, Number(e.target.value)))}
                className="w-24 px-2 py-1 text-right bg-[#F7F9FC] border border-[#E4EAE6] rounded-lg text-xs font-bold text-amber-700 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#E4EAE6]">
              <span className="text-[#172B24]">সর্বমোট প্রদেয়:</span>
              <span className="text-base text-[#116149]">
                {formatCurrency(grandTotal, profile.useBengaliDigits)}
              </span>
            </div>
          </div>

          {/* Section: Payment Method Selection */}
          <div className="space-y-2 pt-2 border-t border-[#E4EAE6]">
            <label className="text-xs font-semibold text-[#172B24] block">
              পরিশোধের মাধ্যম
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod("নগদ")}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                  paymentMethod === "নগদ"
                    ? "bg-[#F0FAF5] border-[#16A574] text-[#116149] font-bold ring-1 ring-[#16A574]"
                    : "border-[#E4EAE6] text-[#68776F] hover:bg-gray-50"
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600" />
                নগদ
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("বিকাশ")}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                  paymentMethod === "বিকাশ"
                    ? "bg-pink-50 border-pink-500 text-pink-700 font-bold ring-1 ring-pink-500"
                    : "border-[#E4EAE6] text-[#68776F] hover:bg-gray-50"
                }`}
              >
                <Smartphone className="w-4 h-4 text-pink-600" />
                বিকাশ/নগদ
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("আংশিক পরিশোধ")}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                  paymentMethod === "আংশিক পরিশোধ"
                    ? "bg-amber-50 border-amber-500 text-amber-800 font-bold ring-1 ring-amber-500"
                    : "border-[#E4EAE6] text-[#68776F] hover:bg-gray-50"
                }`}
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                আংশিক
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("বাকি")}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                  paymentMethod === "বাকি"
                    ? "bg-red-50 border-red-500 text-red-700 font-bold ring-1 ring-red-500"
                    : "border-[#E4EAE6] text-[#68776F] hover:bg-gray-50"
                }`}
              >
                <AlertCircle className="w-4 h-4 text-red-600" />
                বাকি
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("ব্যাংক")}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                  paymentMethod === "ব্যাংক"
                    ? "bg-blue-50 border-blue-500 text-blue-700 font-bold ring-1 ring-blue-500"
                    : "border-[#E4EAE6] text-[#68776F] hover:bg-gray-50"
                }`}
              >
                <Building className="w-4 h-4 text-blue-600" />
                ব্যাংক
              </button>
            </div>

            {/* Partial Payment Input Field */}
            {paymentMethod === "আংশিক পরিশোধ" && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-900">নগদ পরিশোধিত টাকা:</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    placeholder="০"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    className="w-28 px-2 py-1 text-right bg-white border border-amber-300 rounded-lg font-bold text-amber-900 focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-between text-red-700 font-bold">
                  <span>অবশিষ্ট বাকি থাকবে:</span>
                  <span>{formatCurrency(dueAmount, profile.useBengaliDigits)}</span>
                </div>
              </div>
            )}

            {/* MFS / Bank Reference Field */}
            {(paymentMethod === "বিকাশ" || paymentMethod === "ব্যাংক") && (
              <div>
                <input
                  type="text"
                  placeholder="ট্রানজেকশন আইডি (TrxID) / নোট..."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs focus:outline-hidden focus:border-[#16A574]"
                />
              </div>
            )}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Sale Button */}
          <button
            type="button"
            disabled={cart.length === 0 || isSubmitting}
            onClick={handleCompleteSale}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              cart.length === 0 || isSubmitting
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-[#116149] hover:bg-[#0d4f3b] text-white hover:shadow-md"
            }`}
          >
            <CheckCircle className="w-5 h-5 text-[#16A574]" />
            {isSubmitting ? "বিক্রি প্রসেস হচ্ছে..." : "বিক্রি সম্পন্ন করুন"}
          </button>
        </div>
      </div>

      {/* Quick Customer Creation Inline Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-[#E4EAE6] shadow-xl space-y-4">
            <h3 className="font-bold text-base text-[#172B24]">
              নতুন কাস্টমার যোগ করুন
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ জহিরুল ইসলাম"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  placeholder="০১৭১১-XXXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="দোকান/বাসার ঠিকানা"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-3 py-2 border rounded-xl text-[#68776F]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#116149] text-white rounded-xl font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completed Sale Receipt Modal */}
      <ReceiptModal
        sale={completedSale}
        profile={profile}
        isOpen={Boolean(completedSale)}
        onClose={() => setCompletedSale(null)}
      />
    </div>
  );
};
