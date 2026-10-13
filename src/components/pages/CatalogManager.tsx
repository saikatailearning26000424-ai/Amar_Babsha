import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import { Product, CustomerOrder, OrderStatus } from "../../types";
import {
  formatBengaliNumber,
  formatBengaliCurrency,
  formatBengaliDate,
} from "../../utils/bengali";
import {
  Globe,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Printer,
  Trash2,
  ArrowRight,
  ExternalLink,
  Save,
  Copy,
  ChevronDown,
  Download,
  Loader2,
} from "lucide-react";
import { downloadElementAsPDF } from "../../utils/pdfGenerator";

export const CatalogManager: React.FC = () => {
  const {
    products,
    updateProduct,
    toggleProductCatalogVisibility,
    updateProductCustomerPrice,
    batchSetCatalogVisibility,
    orders,
    updateOrderStatus,
    deleteCustomerOrder,
    convertOrderToSale,
    profile,
    updateProfile,
  } = useBusiness();
  const { switchRole } = useAuth();

  // Active Tab: "catalog" | "orders" | "payment_settings"
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "payment_settings">("catalog");

  // Catalog Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>("");

  // Order Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("সকল");
  const [selectedOrderReceipt, setSelectedOrderReceipt] = useState<CustomerOrder | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadAdminOrderPdf = async () => {
    if (!selectedOrderReceipt) return;
    setIsDownloadingPdf(true);
    const docName = `Order_Memo_${selectedOrderReceipt.orderNo}.pdf`;
    await downloadElementAsPDF("admin-order-receipt-card", {
      fileName: docName,
      format: "thermal",
    });
    setIsDownloadingPdf(false);
  };

  // Settings Form State
  const [bkashNum, setBkashNum] = useState(profile.bkashNumber || "01712-345678");
  const [nagadNum, setNagadNum] = useState(profile.nagadNumber || "01912-345678");
  const [rocketNum, setRocketNum] = useState(profile.rocketNumber || "01812-345678");
  const [upayNum, setUpayNum] = useState(profile.upayNumber || "01612-345678");
  const [deliveryFee, setDeliveryFee] = useState(String(profile.deliveryFeeDefault || 50));
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Computed metrics
  const totalProducts = products.length;
  const visibleProducts = useMemo(
    () => products.filter((p) => p.isActive && (p.showInCatalog ?? true)),
    [products]
  );
  const hiddenProducts = useMemo(
    () => products.filter((p) => p.isActive && p.showInCatalog === false),
    [products]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.orderStatus === "অপেক্ষমান"),
    [orders]
  );

  // Filtered Products for Catalog Table
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const isVisible = p.showInCatalog ?? true;
      if (visibilityFilter === "visible" && !isVisible) return false;
      if (visibilityFilter === "hidden" && isVisible) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          p.code.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [products, visibilityFilter, searchQuery]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "সকল") return orders;
    return orders.filter((o) => o.orderStatus === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  // Price Edit handlers
  const handleStartEditPrice = (product: Product) => {
    setEditingPriceId(product.id);
    setTempPriceInput(String(product.customerPrice ?? product.sellingPrice));
  };

  const handleSavePrice = (productId: string) => {
    const val = parseFloat(tempPriceInput);
    if (!isNaN(val) && val >= 0) {
      updateProductCustomerPrice(productId, val);
    }
    setEditingPriceId(null);
  };

  // Save Payment Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      bkashNumber: bkashNum.trim(),
      nagadNumber: nagadNum.trim(),
      rocketNumber: rocketNum.trim(),
      upayNumber: upayNum.trim(),
      deliveryFeeDefault: parseFloat(deliveryFee) || 50,
    });
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#116149] border border-emerald-200 text-xs font-bold mb-1.5">
            <Globe className="w-3.5 h-3.5" />
            অনলাইন শপ ও কাস্টমার ম্যানেজমেন্ট
          </div>
          <h1 className="text-2xl font-black text-[#172B24]">
            কাস্টমার ক্যাটালগ ও অনলাইন অর্ডার
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            কাস্টমাররা দোকানে কোন কোন পণ্য দেখতে পারবে তা নির্ধারণ করুন, কাস্টমার মূল্য পরিবর্তন করুন এবং অনলাইন অর্ডার পরিচালনা করুন।
          </p>
        </div>

        {/* Quick Customer Storefront Preview */}
        <button
          onClick={() => switchRole("customer")}
          className="px-4 py-2.5 bg-[#116149] hover:bg-[#0e523e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98]"
        >
          <ExternalLink className="w-4 h-4" />
          🛍️ কাস্টমার স্টোর ভিউ দেখুন
        </button>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <span className="text-[11px] font-semibold text-[#68776F] block">
            মোট স্টোরের পণ্য
          </span>
          <span className="text-xl font-black text-[#172B24] mt-1 block">
            {formatBengaliNumber(totalProducts)} টি
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">
            কাস্টমারকে দেখানো হচ্ছে
          </span>
          <span className="text-xl font-black text-[#116149] mt-1 block">
            {formatBengaliNumber(visibleProducts.length)} টি
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 block">
            লুকানো পণ্য
          </span>
          <span className="text-xl font-black text-gray-600 mt-1 block">
            {formatBengaliNumber(hiddenProducts.length)} টি
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 block">
            অপেক্ষমান নতুন অর্ডার
          </span>
          <span className="text-xl font-black text-amber-600 mt-1 block">
            {formatBengaliNumber(pendingOrders.length)} টি
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-white p-1 rounded-2xl border border-[#E4EAE6] shadow-xs text-xs font-bold">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "catalog"
              ? "bg-[#116149] text-white shadow-xs"
              : "text-[#68776F] hover:text-[#172B24]"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>পণ্য ক্যাটালগ ও মূল্য নিয়ন্ত্রণ ({formatBengaliNumber(products.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 relative ${
            activeTab === "orders"
              ? "bg-[#116149] text-white shadow-xs"
              : "text-[#68776F] hover:text-[#172B24]"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>অনলাইন কাস্টমার অর্ডার ({formatBengaliNumber(orders.length)})</span>
          {pendingOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("payment_settings")}
          className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "payment_settings"
              ? "bg-[#116149] text-white shadow-xs"
              : "text-[#68776F] hover:text-[#172B24]"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>পেমেন্ট নম্বর ও ডেলিভারি ফি</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: CATALOG & PRICE MANAGEMENT */}
      {/* =================================================================== */}
      {activeTab === "catalog" && (
        <div className="bg-white rounded-3xl border border-[#E4EAE6] p-5 sm:p-6 shadow-xs space-y-5">
          {/* Controls: Search, Filter, Bulk Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="পণ্য বা কোড দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:border-[#16A574] focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Visibility Filters & Bulk toggles */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex bg-[#F7F9FC] p-1 rounded-xl border border-[#E4EAE6]">
                <button
                  onClick={() => setVisibilityFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    visibilityFilter === "all"
                      ? "bg-white text-[#116149] shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  সব ({formatBengaliNumber(products.length)})
                </button>
                <button
                  onClick={() => setVisibilityFilter("visible")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    visibilityFilter === "visible"
                      ? "bg-white text-[#116149] shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  ক্যাটালগে প্রদর্শিত ({formatBengaliNumber(visibleProducts.length)})
                </button>
                <button
                  onClick={() => setVisibilityFilter("hidden")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    visibilityFilter === "hidden"
                      ? "bg-white text-gray-800 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  লুকানো ({formatBengaliNumber(hiddenProducts.length)})
                </button>
              </div>

              {/* Bulk Buttons */}
              <button
                onClick={() => batchSetCatalogVisibility(true)}
                className="px-3 py-1.5 bg-emerald-50 text-[#116149] border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
                title="সব পণ্য কাস্টমারদের জন্য দৃশ্যমান করুন"
              >
                সব পণ্য ক্যাটালগে দেখান
              </button>
              <button
                onClick={() => batchSetCatalogVisibility(false)}
                className="px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                title="সব পণ্য ক্যাটালগ থেকে লুকান"
              >
                সব লুকান
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4EAE6] text-[#68776F] uppercase font-bold text-[10px]">
                  <th className="py-3 px-3">পণ্যের বিবরণ</th>
                  <th className="py-3 px-3">স্টক ও একক</th>
                  <th className="py-3 px-3">কেনা মূল্য (অ্যাডমিন)</th>
                  <th className="py-3 px-3">সাধারণ বিক্রয়মূল্য</th>
                  <th className="py-3 px-3">
                    <span className="text-[#116149] font-black">
                      কাস্টমার বিক্রয়মূল্য (৳)
                    </span>
                  </th>
                  <th className="py-3 px-3 text-center">কাস্টমারকে দেখান</th>
                  <th className="py-3 px-3 text-right">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCatalogProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      কোনো পণ্য পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  filteredCatalogProducts.map((product) => {
                    const isVisible = product.showInCatalog ?? true;
                    const customerPrice =
                      product.customerPrice ?? product.sellingPrice;
                    const isEditing = editingPriceId === product.id;

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          !isVisible ? "opacity-75 bg-gray-50/30" : ""
                        }`}
                      >
                        {/* Product Info */}
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-sm text-[#172B24]">
                            {product.name}
                          </div>
                          <div className="text-[11px] text-[#68776F] flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{product.code}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">
                              {product.category}
                            </span>
                          </div>
                        </td>

                        {/* Stock & Unit */}
                        <td className="py-3.5 px-3 font-medium">
                          <span
                            className={
                              product.stock <= 0
                                ? "text-red-600 font-bold"
                                : "text-gray-900"
                            }
                          >
                            {formatBengaliNumber(product.stock)} {product.unit}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3.5 px-3 text-gray-500 font-medium">
                          {formatBengaliCurrency(product.costPrice)}
                        </td>

                        {/* Regular Selling Price */}
                        <td className="py-3.5 px-3 text-gray-700 font-semibold">
                          {formatBengaliCurrency(product.sellingPrice)}
                        </td>

                        {/* Customer Catalog Price (Editable) */}
                        <td className="py-3.5 px-3">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                autoFocus
                                value={tempPriceInput}
                                onChange={(e) => setTempPriceInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSavePrice(product.id);
                                  if (e.key === "Escape") setEditingPriceId(null);
                                }}
                                className="w-24 px-2 py-1 bg-white border-2 border-[#16A574] rounded-lg text-xs font-black text-[#116149] focus:outline-hidden"
                              />
                              <button
                                onClick={() => handleSavePrice(product.id)}
                                className="p-1 rounded-md bg-[#116149] text-white hover:bg-[#0e523e]"
                                title="সংরক্ষণ করুন"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingPriceId(null)}
                                className="p-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200"
                                title="বাতিল"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <span className="font-black text-sm text-[#116149]">
                                {formatBengaliCurrency(customerPrice)}
                              </span>
                              <button
                                onClick={() => handleStartEditPrice(product)}
                                className="p-1 rounded-md text-gray-400 hover:text-[#116149] hover:bg-emerald-50 transition-colors"
                                title="কাস্টমার মূল্য পরিবর্তন করুন"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Toggle Visibility */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() =>
                              toggleProductCatalogVisibility(product.id, !isVisible)
                            }
                            className={`w-12 h-6 rounded-full transition-colors relative inline-flex items-center p-0.5 ${
                              isVisible ? "bg-[#116149]" : "bg-gray-300"
                            }`}
                            title={isVisible ? "ক্যাটালগ থেকে লুকান" : "ক্যাটালগে প্রদর্শন করুন"}
                          >
                            <span
                              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                                isVisible ? "translate-x-6" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 text-right">
                          {isVisible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#116149] border border-emerald-200">
                              <Eye className="w-3 h-3" />
                              ক্যাটালগে সক্রিয়
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                              <EyeOff className="w-3 h-3" />
                              লুকানো
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: INCOMING ONLINE CUSTOMER ORDERS */}
      {/* =================================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Order Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {["সকল", "অপেক্ষমান", "অনুমোদিত", "ডেলিভারি সম্পন্ন", "বাতিল"].map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderStatusFilter === st
                    ? "bg-[#116149] text-white shadow-xs"
                    : "bg-white text-[#68776F] border border-[#E4EAE6] hover:text-[#172B24]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E4EAE6] p-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-base text-[#172B24]">
                কোনো অনলাইন অর্ডার পাওয়া যায়নি
              </h3>
              <p className="text-xs text-[#68776F] max-w-sm mx-auto mt-1">
                কাস্টমাররা অনলাইন স্টোরফ্রন্ট থেকে অর্ডার প্রদান করলে এখানে তালিকাভুক্ত হবে।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => {
                const statusStyles: Record<string, string> = {
                  "অপেক্ষমান": "bg-amber-100 text-amber-800 border-amber-200",
                  "অনুমোদিত": "bg-blue-100 text-blue-800 border-blue-200",
                  "ডেলিভারি সম্পন্ন": "bg-emerald-100 text-emerald-800 border-emerald-200",
                  "বাতিল": "bg-red-100 text-red-800 border-red-200",
                };

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-[#E4EAE6] p-5 shadow-xs space-y-4 hover:border-emerald-200 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-base text-[#116149]">
                            #{order.orderNo}
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                              statusStyles[order.orderStatus] || "bg-gray-100"
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#68776F] mt-0.5 block">
                          অর্ডারের তারিখ: {formatBengaliDate(order.createdAt)}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="text-right text-xs">
                        <span className="font-bold text-[#172B24] block">
                          {order.customerName}
                        </span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-[#116149] font-mono hover:underline block"
                        >
                          {order.customerPhone}
                        </a>
                      </div>
                    </div>

                    {/* Order Items & Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-500 block mb-1">
                          অর্ডারকৃত পণ্যসমূহ:
                        </span>
                        <div className="space-y-1 bg-[#F7F9FC] p-3 rounded-xl border border-gray-100">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-gray-800"
                            >
                              <span>
                                {it.productName} ({formatBengaliNumber(it.quantity)} {it.unit})
                              </span>
                              <span className="font-bold">
                                {formatBengaliCurrency(it.total)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-1.5 flex justify-between font-black text-sm text-[#116149]">
                            <span>সর্বমোট বিল:</span>
                            <span>{formatBengaliCurrency(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="font-bold text-gray-500 block">
                            ডেলিভারি ঠিকানা:
                          </span>
                          <p className="text-gray-800 mt-0.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                            {order.deliveryAddress}
                          </p>
                        </div>

                        <div>
                          <span className="font-bold text-gray-500 block">
                            পেমেন্ট তথ্য:
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-extrabold text-[#116149]">
                              {order.paymentMethod}
                            </span>
                            {order.transactionId && (
                              <span className="font-mono text-gray-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                TrxID: {order.transactionId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrderReceipt(order)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          মেমো দেখুন
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.orderStatus === "অপেক্ষমান" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "অনুমোদিত")}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            অনুমোদন করুন
                          </button>
                        )}

                        {order.orderStatus !== "ডেলিভারি সম্পন্ন" &&
                          order.orderStatus !== "বাতিল" && (
                            <button
                              onClick={() => {
                                const res = convertOrderToSale(order.id);
                                if (res.success) {
                                  alert("অর্ডার ডেলিভারি সম্পন্ন হয়েছে এবং দোকানের বিক্রয় হিসাবে যুক্ত হয়েছে!");
                                }
                              }}
                              className="px-3.5 py-1.5 bg-[#116149] hover:bg-[#0e523e] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              ডেলিভারি সম্পন্ন ও ক্যাশে যোগ করুন
                            </button>
                          )}

                        {order.orderStatus !== "বাতিল" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "বাতিল")}
                            className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            বাতিল
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: PAYMENT NUMBERS & DELIVERY SETTINGS */}
      {/* =================================================================== */}
      {activeTab === "payment_settings" && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white rounded-3xl border border-[#E4EAE6] p-6 sm:p-8 shadow-xs max-w-2xl space-y-5"
        >
          <div>
            <h2 className="text-lg font-black text-[#172B24]">
              দোকানের পেমেন্ট নম্বর ও ডেলিভারি ফি কনফিগারেশন
            </h2>
            <p className="text-xs text-[#68776F] mt-1">
              কাস্টমার যখন অনলাইন থেকে অর্ডার করবে, বিল সেকশনে এই নম্বরগুলো ও পেমেন্ট নির্দেশিকা স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
            </p>
          </div>

          {settingsSavedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#116149]" />
              পেমেন্ট তথ্য ও ডেলিভারি ফি সফলভাবে সংরক্ষিত হয়েছে!
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* bKash */}
            <div>
              <label className="block font-bold text-pink-700 mb-1">
                🌸 বিকাশ নম্বর (Personal / Merchant)
              </label>
              <input
                type="text"
                value={bkashNum}
                onChange={(e) => setBkashNum(e.target.value)}
                placeholder="যেমন: 01712-345678"
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl font-mono font-bold text-gray-800 focus:border-[#16A574] focus:outline-hidden"
              />
            </div>

            {/* Nagad */}
            <div>
              <label className="block font-bold text-orange-700 mb-1">
                🟧 নগদ নম্বর (Personal / Merchant)
              </label>
              <input
                type="text"
                value={nagadNum}
                onChange={(e) => setNagadNum(e.target.value)}
                placeholder="যেমন: 01912-345678"
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl font-mono font-bold text-gray-800 focus:border-[#16A574] focus:outline-hidden"
              />
            </div>

            {/* Rocket */}
            <div>
              <label className="block font-bold text-purple-700 mb-1">
                🟣 রকেট নম্বর (DBBL)
              </label>
              <input
                type="text"
                value={rocketNum}
                onChange={(e) => setRocketNum(e.target.value)}
                placeholder="যেমন: 01812-345678-0"
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl font-mono font-bold text-gray-800 focus:border-[#16A574] focus:outline-hidden"
              />
            </div>

            {/* Upay */}
            <div>
              <label className="block font-bold text-blue-700 mb-1">
                🔵 উপায় নম্বর (UCB)
              </label>
              <input
                type="text"
                value={upayNum}
                onChange={(e) => setUpayNum(e.target.value)}
                placeholder="যেমন: 01612-345678"
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl font-mono font-bold text-gray-800 focus:border-[#16A574] focus:outline-hidden"
              />
            </div>

            {/* Default Delivery Fee */}
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                🚚 ডিফল্ট ডেলিভারি ফি (টাকায়)
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl font-bold text-gray-800 focus:border-[#16A574] focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#116149] hover:bg-[#0e523e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            সেটিংস সংরক্ষণ করুন
          </button>
        </form>
      )}

      {/* Invoice Modal for Admin */}
      {selectedOrderReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrderReceipt(null)}
              className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-black text-lg text-[#172B24] mb-3">
              অর্ডার মেমো #{selectedOrderReceipt.orderNo}
            </h3>

            <div
              id="admin-order-receipt-card"
              className="bg-[#F7F9FC] p-4 rounded-2xl text-xs space-y-2 border border-[#E4EAE6]"
            >
              <div className="flex justify-between font-bold">
                <span>গ্রাহক:</span>
                <span>{selectedOrderReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>মোবাইল:</span>
                <span className="font-mono">{selectedOrderReceipt.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>ঠিকানা:</span>
                <span className="max-w-[180px] text-right truncate">
                  {selectedOrderReceipt.deliveryAddress}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1">
                {selectedOrderReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.productName} ({it.quantity} {it.unit})
                    </span>
                    <span className="font-bold">
                      {formatBengaliCurrency(it.total)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-black text-sm text-[#116149]">
                <span>সর্বমোট:</span>
                <span>{formatBengaliCurrency(selectedOrderReceipt.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDownloadAdminOrderPdf}
                disabled={isDownloadingPdf}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isDownloadingPdf ? "তৈরি হচ্ছে..." : "PDF মেমো ডাউনলোড"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#172B24] border border-[#E4EAE6] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                প্রিন্ট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
