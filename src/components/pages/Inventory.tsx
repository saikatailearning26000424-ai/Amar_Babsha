import React, { useState, useMemo, useRef } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Product, ProductUnit, MovementType } from "../../types";
import { formatCurrency, toBengaliNumber, formatBengaliDate } from "../../utils/bengali";
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Edit2,
  Trash2,
  RefreshCw,
  History,
  X,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";

export const Inventory: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    movements,
    suppliers,
    profile,
  } = useBusiness();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("সব");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockAdjustModalOpen, setIsStockAdjustModalOpen] = useState(false);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<MovementType>("নতুন ক্রয়");
  const [adjustReason, setAdjustReason] = useState("");

  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  // Form states for Add/Edit
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("মুদি পণ্য");
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(profile.lowStockDefaultThreshold || 5);
  const [formUnit, setFormUnit] = useState<ProductUnit>("পিস");
  const [formSupplierId, setFormSupplierId] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["সব", ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = categoryFilter === "সব" || p.category === categoryFilter;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLowStock = !showLowStockOnly || p.stock <= p.minStockAlert;
      return matchCat && matchSearch && matchLowStock;
    });
  }, [products, categoryFilter, searchQuery, showLowStockOnly]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCode(`SKU-${Date.now().toString().slice(-4)}`);
    setFormCategory("মুদি পণ্য");
    setFormCostPrice(0);
    setFormSellingPrice(0);
    setFormStock(0);
    setFormMinStock(profile.lowStockDefaultThreshold || 5);
    setFormUnit("পিস");
    setFormSupplierId("");
    setIsAddEditModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCode(p.code);
    setFormCategory(p.category);
    setFormCostPrice(p.costPrice);
    setFormSellingPrice(p.sellingPrice);
    setFormStock(p.stock);
    setFormMinStock(p.minStockAlert);
    setFormUnit(p.unit);
    setFormSupplierId(p.supplierId || "");
    setIsAddEditModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const supplierObj = suppliers.find((s) => s.id === formSupplierId);

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName.trim(),
        code: formCode.trim(),
        category: formCategory,
        costPrice: Number(formCostPrice),
        sellingPrice: Number(formSellingPrice),
        minStockAlert: Number(formMinStock),
        unit: formUnit,
        supplierId: formSupplierId || undefined,
        supplierName: supplierObj?.name,
      });
    } else {
      addProduct({
        name: formName.trim(),
        code: formCode.trim() || `SKU-${Date.now().toString().slice(-4)}`,
        category: formCategory,
        costPrice: Number(formCostPrice),
        sellingPrice: Number(formSellingPrice),
        stock: Number(formStock),
        minStockAlert: Number(formMinStock),
        unit: formUnit,
        supplierId: formSupplierId || undefined,
        supplierName: supplierObj?.name,
        isActive: true,
      });
    }

    setIsAddEditModalOpen(false);
  };

  // Stock Adjustment
  const openAdjustStockModal = (p: Product) => {
    setStockAdjustProduct(p);
    setAdjustQuantity(1);
    setAdjustType("নতুন ক্রয়");
    setAdjustReason("");
    setIsStockAdjustModalOpen(true);
  };

  const handleConfirmStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;

    const qty = Number(adjustQuantity);
    if (qty === 0) return;

    // determine positive or negative
    const delta = adjustType === "নষ্ট বা ক্ষতি" ? -Math.abs(qty) : Math.abs(qty);

    updateStock(stockAdjustProduct.id, delta, adjustReason.trim() || adjustType, adjustType);
    setIsStockAdjustModalOpen(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["পণ্যের নাম,কোড/SKU,বিভাগ,ক্রয়মূল্য,বিক্রয়মূল্য,বর্তমান স্টক,সর্বনিম্ন সীমা,একক,সরবরাহকারী"];
    const rows = filteredProducts.map((p) =>
      [
        `"${p.name}"`,
        p.code,
        `"${p.category}"`,
        p.costPrice,
        p.sellingPrice,
        p.stock,
        p.minStockAlert,
        p.unit,
        `"${p.supplierName || ""}"`,
      ].join(",")
    );

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `পণ্য_স্টক_তালিকা_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n");
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length >= 3 && cols[0]) {
          addProduct({
            name: cols[0],
            code: cols[1] || `SKU-${Date.now().toString().slice(-4)}`,
            category: cols[2] || "সাধারণ",
            costPrice: parseFloat(cols[3]) || 0,
            sellingPrice: parseFloat(cols[4]) || 0,
            stock: parseFloat(cols[5]) || 0,
            minStockAlert: parseFloat(cols[6]) || 5,
            unit: (cols[7] as ProductUnit) || "পিস",
            isActive: true,
          });
        }
      }
      alert("পণ্য সফলভাবে আমদানি করা হয়েছে!");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#16A574]" />
            পণ্য ও স্টক ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            পণ্যের তথ্য হালনাগাদ, ক্রয়-বিক্রয় স্টক সমন্বয় ও কম স্টকের নোটিফিকেশন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Movement history */}
          <button
            onClick={() => setIsMovementsModalOpen(true)}
            className="px-3 py-2 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4 text-[#3976D8]" />
            স্টক ইতিহাস
          </button>

          {/* Import CSV */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-[#D98A12]" />
            CSV আমদানি
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-[#116149]" />
            CSV রপ্তানি
          </button>

          {/* Add Product Button */}
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন পণ্য যোগ
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="পণ্য বা কোড (SKU) দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#16A574]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "সব" ? "সব বিভাগ" : c}
              </option>
            ))}
          </select>

          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showLowStockOnly
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-white border border-[#E4EAE6] text-amber-700 hover:bg-amber-50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            কম স্টক ফিল্টার
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#68776F] border-b border-[#E4EAE6]">
              <tr>
                <th className="py-3 px-4 font-semibold">পণ্য ও কোড</th>
                <th className="py-3 px-4 font-semibold">বিভাগ</th>
                <th className="py-3 px-4 font-semibold">ক্রয়মূল্য</th>
                <th className="py-3 px-4 font-semibold">বিক্রয়মূল্য</th>
                <th className="py-3 px-4 font-semibold">লাভ মার্জিন</th>
                <th className="py-3 px-4 font-semibold">বর্তমান স্টক</th>
                <th className="py-3 px-4 font-semibold">সরবরাহকারী</th>
                <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#68776F]">
                    কোনো পণ্য পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minStockAlert;
                  const profitMargin = p.sellingPrice - p.costPrice;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172B24]">{p.name}</div>
                        <div className="text-[10px] text-[#68776F] font-mono">{p.code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#68776F]">{p.category}</td>
                      <td className="py-3.5 px-4 font-medium text-[#172B24]">
                        {formatCurrency(p.costPrice, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#116149]">
                        {formatCurrency(p.sellingPrice, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#16834A]">
                        +{formatCurrency(profitMargin, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                            isLow
                              ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                              : "bg-[#F0FAF5] text-[#116149]"
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {toBengaliNumber(p.stock)} {p.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-amber-700 mt-0.5">
                            সীমা: {toBengaliNumber(p.minStockAlert)} {p.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#68776F] truncate max-w-[140px]">
                        {p.supplierName || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAdjustStockModal(p)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#116149] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                            title="স্টক আপডেট করুন"
                          >
                            <RefreshCw className="w-3 h-3" />
                            স্টক সমন্বয়
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 text-gray-500 hover:text-[#116149] hover:bg-gray-100 rounded-lg transition-colors"
                            title="সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`আপনি কি "${p.name}" পণ্যটি নিষ্ক্রিয় করতে চান?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24]">
                {editingProduct ? "পণ্যের তথ্য সম্পাদনা" : "নতুন পণ্য যোগ করুন"}
              </h3>
              <button onClick={() => setIsAddEditModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold block mb-1">পণ্যের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মিনিকেট চাল"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-semibold block mb-1">কোড / বারকোড (SKU)</label>
                  <input
                    type="text"
                    placeholder="RICE-01"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">বিভাগ (Category)</label>
                  <input
                    type="text"
                    placeholder="যেমন: মুদি, প্রসাধন, পোশাক..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">একক (Unit)</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as ProductUnit)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  >
                    <option value="পিস">পিস</option>
                    <option value="কেজি">কেজি</option>
                    <option value="গ্রাম">গ্রাম</option>
                    <option value="লিটার">লিটার</option>
                    <option value="প্যাকেট">প্যাকেট</option>
                    <option value="ডজন">ডজন</option>
                    <option value="বক্স">বক্স</option>
                    <option value="মিটার">মিটার</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">ক্রয়মূল্য (টাকা) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formCostPrice || ""}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">বিক্রয়মূল্য (টাকা) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formSellingPrice || ""}
                    onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-[#116149] focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="font-semibold block mb-1">প্রাথমিক স্টক পরিমাণ</label>
                    <input
                      type="number"
                      min="0"
                      value={formStock || ""}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                    />
                  </div>
                )}
                <div className={editingProduct ? "col-span-2" : ""}>
                  <label className="font-semibold block mb-1">
                    সর্বনিম্ন স্টক সীমা (সতর্কতা বার্তা)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock || ""}
                    onChange={(e) => setFormMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">সরবরাহকারী (ঐচ্ছিক)</label>
                <select
                  value={formSupplierId}
                  onChange={(e) => setFormSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                >
                  <option value="">কোনো সরবরাহকারী সংযুক্ত নেই</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-[#68776F]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl font-bold shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isStockAdjustModalOpen && stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24]">
                স্টক সমন্বয় ও রি-স্টক
              </h3>
              <button onClick={() => setIsStockAdjustModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-xl text-xs space-y-1">
              <p className="font-bold text-[#172B24]">{stockAdjustProduct.name}</p>
              <p className="text-[#68776F]">
                বর্তমান মজুদ:{" "}
                <span className="font-bold text-[#116149]">
                  {toBengaliNumber(stockAdjustProduct.stock)} {stockAdjustProduct.unit}
                </span>
              </p>
            </div>

            <form onSubmit={handleConfirmStockAdjust} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">সমন্বয়ের ধরন</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as MovementType)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                >
                  <option value="নতুন ক্রয়">নতুন স্টক ক্রয় (যোগ হবে +)</option>
                  <option value="সমন্বয়">সাধারণ সমন্বয় (যোগ হবে +)</option>
                  <option value="নষ্ট বা ক্ষতি">নষ্ট / মেয়াদোত্তীর্ণ / ক্ষতি (বিয়োগ হবে -)</option>
                  <option value="বিক্রয় ফেরত">বিক্রয় ফেরত (যোগ হবে +)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">পরিমাণ ({stockAdjustProduct.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQuantity || ""}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">কারণ বা রেফারেন্স</label>
                <input
                  type="text"
                  placeholder="যেমন: চালান নং ১২০৫ থেকে পণ্য যোগ"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockAdjustModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-[#68776F]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl font-bold"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Modal */}
      {isMovementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24] flex items-center gap-2">
                <History className="w-5 h-5 text-[#16A574]" />
                স্টক পরিবর্তনের সম্পূর্ণ ইতিহাস
              </h3>
              <button onClick={() => setIsMovementsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-[#68776F] border-b">
                  <tr>
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">পণ্য</th>
                    <th className="py-2.5 px-3">ধরন</th>
                    <th className="py-2.5 px-3">পরিবর্তন</th>
                    <th className="py-2.5 px-3">নতুন স্টক</th>
                    <th className="py-2.5 px-3">কারণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#68776F]">
                        কোনো পরিবর্তন ইতিহাস নেই
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-[#68776F]">
                          {formatBengaliDate(m.date, true, profile.useBengaliDigits)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#172B24]">
                          {m.productName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-[#172B24]">
                            {m.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {m.quantityChange > 0 ? (
                            <span className="text-[#16834A]">
                              +{toBengaliNumber(m.quantityChange)}
                            </span>
                          ) : (
                            <span className="text-red-600">
                              {toBengaliNumber(m.quantityChange)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {toBengaliNumber(m.newStock)}
                        </td>
                        <td className="py-2.5 px-3 text-[#68776F]">{m.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setIsMovementsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#172B24] rounded-xl text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
