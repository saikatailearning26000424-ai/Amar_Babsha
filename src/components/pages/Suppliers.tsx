import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Supplier, Product } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  Truck,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  Package,
  ShoppingBag,
  X,
  CheckCircle,
} from "lucide-react";

export const Suppliers: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, products, updateStock, profile } =
    useBusiness();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formItems, setFormItems] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Record Purchase Modal
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseSupplier, setPurchaseSupplier] = useState<Supplier | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState<number>(1);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState<number>(0);
  const [purchaseNotes, setPurchaseNotes] = useState("");

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      return (
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        s.suppliedItems.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [suppliers, searchQuery]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormItems("");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormPhone(s.phone);
    setFormAddress(s.address || "");
    setFormItems(s.suppliedItems);
    setFormNotes(s.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim() || undefined,
        suppliedItems: formItems.trim(),
        notes: formNotes.trim() || undefined,
      });
    } else {
      addSupplier({
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim() || undefined,
        suppliedItems: formItems.trim(),
        notes: formNotes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const openPurchaseModal = (s: Supplier) => {
    setPurchaseSupplier(s);
    const firstProd = products[0];
    setSelectedProductId(firstProd?.id || "");
    setPurchaseUnitCost(firstProd?.costPrice || 0);
    setPurchaseQuantity(10);
    setPurchaseNotes("");
    setIsPurchaseModalOpen(true);
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplier || !selectedProductId) return;

    const qty = Number(purchaseQuantity);
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod || qty <= 0) return;

    // Increment inventory atomically
    updateStock(
      prod.id,
      qty,
      `সরবরাহকারী ${purchaseSupplier.name} থেকে ক্রয়`,
      "নতুন ক্রয়"
    );

    // Update supplier total purchased
    const totalCost = qty * Number(purchaseUnitCost);
    updateSupplier(purchaseSupplier.id, {
      totalPurchased: (purchaseSupplier.totalPurchased || 0) + totalCost,
    });

    setIsPurchaseModalOpen(false);
    alert(
      `সফলভাবে ${toBengaliNumber(qty)} ${prod.unit} "${prod.name}" স্টকে যোগ করা হয়েছে!`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#16A574]" />
            সরবরাহকারী ও পাইকারি বিক্রেতা
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            পণ্য সরবরাহকারী ডিলার, পরিবেশক ও পাইকারি ক্রয় ট্র্যাকিং
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          + নতুন সরবরাহকারী যোগ
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="সরবরাহকারীর নাম, মোবাইল বা পণ্যের ধরন দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#16A574]"
          />
        </div>
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#E4EAE6] text-xs text-[#68776F]">
            কোনো সরবরাহকারী পাওয়া যায়নি
          </div>
        ) : (
          filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-col justify-between hover:border-[#16A574]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#172B24]">{s.name}</h3>
                    <p className="text-xs text-[#68776F] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#16A574]" />
                      {s.phone || "ফোন নেই"}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1 text-gray-400 hover:text-[#116149] rounded"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {s.address && (
                  <p className="text-xs text-[#68776F] flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{s.address}</span>
                  </p>
                )}

                <div className="mt-3 p-2.5 bg-[#F7F9FC] rounded-xl text-xs">
                  <span className="text-[#68776F] block text-[10px]">সরবরাহকৃত পণ্য:</span>
                  <span className="font-semibold text-[#172B24] line-clamp-2">
                    {s.suppliedItems || "সকল পণ্য"}
                  </span>
                </div>

                {s.notes && (
                  <p className="text-[11px] text-[#68776F] mt-2 italic line-clamp-2">
                    "{s.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#68776F] block">মোট ক্রয় হিসাব:</span>
                  <span className="font-bold text-xs text-[#116149]">
                    {formatCurrency(s.totalPurchased, profile.useBengaliDigits)}
                  </span>
                </div>

                <button
                  onClick={() => openPurchaseModal(s)}
                  className="px-3 py-1.5 bg-[#F0FAF5] hover:bg-[#e0f4eb] text-[#116149] border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  মাল ক্রয়
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24]">
                {editingSupplier ? "সরবরাহকারী তথ্য সম্পাদনা" : "নতুন সরবরাহকারী যোগ"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">সরবরাহকারী / প্রতিষ্ঠানের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মেঘনা গ্রুপ ডিলারশিপ"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">যোগাযোগের নম্বর</label>
                <input
                  type="tel"
                  placeholder="০১৭১১-XXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">ঠিকানা / গুদাম</label>
                <input
                  type="text"
                  placeholder="তেজগাঁও, ঢাকা"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">সরবরাহকৃত পণ্য সামগ্রী</label>
                <input
                  type="text"
                  placeholder="যেমন: তীর তেল, চিনি, ডাল"
                  value={formItems}
                  onChange={(e) => setFormItems(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">নোট / শর্তাবলী (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: ডেলিভারি দিন ও পেমেন্ট শর্ত"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

      {/* Record Purchase from Supplier Modal */}
      {isPurchaseModalOpen && purchaseSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24]">
                পণ্য ক্রয় রেকর্ড (ইনভেন্টরি যোগ)
              </h3>
              <button onClick={() => setIsPurchaseModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-[#68776F]">
              সরবরাহকারী: <strong className="text-[#172B24]">{purchaseSupplier.name}</strong>
            </p>

            <form onSubmit={handleConfirmPurchase} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">পণ্য নির্বাচন করুন *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const p = products.find((prod) => prod.id === e.target.value);
                    if (p) setPurchaseUnitCost(p.costPrice);
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (বর্তমান স্টক: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">ক্রয় পরিমাণ *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchaseQuantity || ""}
                    onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">একক ক্রয় দর (৳)</label>
                  <input
                    type="number"
                    min="0"
                    value={purchaseUnitCost || ""}
                    onChange={(e) => setPurchaseUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl flex justify-between items-center text-xs">
                <span className="text-[#116149] font-medium">মোট ক্রয়মূল্য:</span>
                <span className="font-bold text-[#116149] text-sm">
                  {formatCurrency(
                    Number(purchaseQuantity) * Number(purchaseUnitCost),
                    profile.useBengaliDigits
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-[#68776F]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#116149] text-white rounded-xl font-bold"
                >
                  স্টকে যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
