import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Customer } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  X,
  CreditCard,
  FileText,
} from "lucide-react";

export const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer, setActiveTab, profile } = useBusiness();

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });
  }, [customers, searchQuery]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormAddress(c.address || "");
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim() || undefined,
      });
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#16A574]" />
            কাস্টমার তালিকা ও প্রোফাইল
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            দোকানের সমস্ত নিবন্ধিত কাস্টমারদের তালিকা ও কেনাকাটার হিসাব
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="self-start sm:self-auto px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          + নতুন কাস্টমার যোগ
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কাস্টমারের নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#16A574]"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-[#E4EAE6] text-xs text-[#68776F]">
            কোনো কাস্টমার পাওয়া যায়নি
          </div>
        ) : (
          filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-col justify-between hover:border-[#16A574]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#172B24]">{c.name}</h3>
                    <p className="text-xs text-[#68776F] flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#16A574]" />
                      {c.phone || "ফোন নেই"}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1 text-gray-400 hover:text-[#116149] rounded"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {c.address && (
                  <p className="text-xs text-[#68776F] flex items-center gap-1 mt-2">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{c.address}</span>
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-center text-xs">
                  <div>
                    <span className="text-[#68776F] block text-[10px]">মোট কেনাকাটা</span>
                    <span className="font-bold text-[#172B24]">
                      {formatCurrency(c.totalPurchases, profile.useBengaliDigits)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#68776F] block text-[10px]">পরিশোধ</span>
                    <span className="font-bold text-[#16834A]">
                      {formatCurrency(c.totalPaid, profile.useBengaliDigits)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#68776F] block text-[10px]">বর্তমান বাকি</span>
                    <span
                      className={`font-bold ${
                        c.currentDue > 0 ? "text-red-600" : "text-[#16834A]"
                      }`}
                    >
                      {formatCurrency(c.currentDue, profile.useBengaliDigits)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab("dues")}
                  className="text-xs font-semibold text-[#116149] hover:underline flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  বাকি খাতা দেখুন
                </button>
                <span className="text-[10px] text-gray-400">
                  নিবন্ধিত: {formatBengaliDate(c.createdAt, false, profile.useBengaliDigits)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24]">
                {editingCustomer ? "কাস্টমার তথ্য সম্পাদনা" : "নতুন কাস্টমার যোগ করুন"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">কাস্টমারের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ আল-আমিন"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  placeholder="০১৭১১-XXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">ঠিকানা (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="দোকান/বাসার ঠিকানা"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
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
    </div>
  );
};
