import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Customer, CustomerPayment } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  BadgePercent,
  Plus,
  Search,
  Filter,
  DollarSign,
  Phone,
  Calendar,
  FileText,
  Share2,
  CheckCircle,
  AlertCircle,
  X,
  CreditCard,
  MessageSquare,
  Users,
} from "lucide-react";
import { ReceiptModal } from "../common/ReceiptModal";

export const DuesLedger: React.FC = () => {
  const { customers, recordCustomerPayment, sales, profile, totalDue } = useBusiness();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDueOnly, setFilterDueOnly] = useState(true);

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<"নগদ" | "বিকাশ" | "ব্যাংক">("নগদ");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Resulting Payment Receipt for Modal
  const [completedPaymentReceipt, setCompletedPaymentReceipt] =
    useState<CustomerPayment | null>(null);

  // Customer Ledger View Modal
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null);

  // Copied reminder feedback
  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDue = !filterDueOnly || c.currentDue > 0;
      return matchSearch && matchDue;
    });
  }, [customers, searchQuery, filterDueOnly]);

  const openPaymentModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomerId(customer.id);
      setPaymentAmount(customer.currentDue);
    } else {
      setSelectedCustomerId(customers[0]?.id || "");
      setPaymentAmount(customers[0]?.currentDue || 0);
    }
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("নগদ");
    setPaymentReference("");
    setPaymentNotes("");
    setPaymentError("");
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (!selectedCustomerId) {
      setPaymentError("দয়া করে একজন কাস্টমার নির্বাচন করুন।");
      return;
    }

    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const amt = Number(paymentAmount);
    if (amt <= 0) {
      setPaymentError("আদায়কৃত টাকার পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।");
      return;
    }
    if (amt > cust.currentDue) {
      setPaymentError(
        `পরিশোধের পরিমাণ বর্তমান বকেয়া (৳${cust.currentDue})-এর চেয়ে বেশি হতে পারে না!`
      );
      return;
    }

    const result = recordCustomerPayment({
      customerId: cust.id,
      customerName: cust.name,
      amount: amt,
      date: new Date(paymentDate).toISOString(),
      paymentMethod,
      reference: paymentReference.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
      previousDue: cust.currentDue,
      remainingDue: Math.max(0, cust.currentDue - amt),
    });

    if (result.success && result.paymentReceipt) {
      setIsPaymentModalOpen(false);
      setCompletedPaymentReceipt(result.paymentReceipt);
    } else {
      setPaymentError(result.error || "পেমেন্ট সংরক্ষণ করা যায়নি।");
    }
  };

  const handleCopyReminder = (c: Customer) => {
    const text =
      `আসসালামু আলাইকুম ${c.name} ভাই/আপা, \n` +
      `${profile.businessName}-এর পক্ষ থেকে শুভেচ্ছা। আপনার দোকানে বর্তমান বকেয়া পাওনার পরিমাণ ৳${c.currentDue}। ` +
      `সুযোগমতো বকেয়া হিসাবটি পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি। ধন্যবাদ!`;

    navigator.clipboard.writeText(text);
    setCopiedReminderId(c.id);
    setTimeout(() => setCopiedReminderId(null), 3000);
  };

  // Transactions for the Ledger modal
  const customerSales = useMemo(() => {
    if (!ledgerCustomer) return [];
    return sales.filter((s) => s.customerId === ledgerCustomer.id && !s.isVoided);
  }, [sales, ledgerCustomer]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-[#D64545]" />
            কাস্টমার বাকি ও পাওনা খাতা
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            বকেয়া বিক্রয় ট্র্যাকিং, কিস্তি/আংশিক আদায় ও স্বয়ংক্রিয় তাগাদা বার্তা
          </p>
        </div>

        <button
          onClick={() => openPaymentModal()}
          className="self-start sm:self-auto px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          + বাকি আদায়ের হিসাব যোগ করুন
        </button>
      </div>

      {/* Banner / Stat summary */}
      <div className="bg-linear-to-r from-red-500 to-rose-700 text-white rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-white/80 block">
            দোকানের মোট বকেয়া পাওনা
          </span>
          <h2 className="text-3xl font-extrabold mt-1">
            {formatCurrency(totalDue, profile.useBengaliDigits)}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            মোট{" "}
            {toBengaliNumber(customers.filter((c) => c.currentDue > 0).length)} জন
            কাস্টমারের কাছে বাকি রয়েছে
          </p>
        </div>

        <button
          onClick={() => openPaymentModal()}
          className="px-5 py-2.5 bg-white text-rose-800 hover:bg-rose-50 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
        >
          বাকি আদায় এন্ট্রি করুন
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="কাস্টমারের নাম, মোবাইল বা ঠিকানা দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#16A574]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterDueOnly(!filterDueOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              filterDueOnly
                ? "bg-red-100 text-red-800 border border-red-300 font-bold"
                : "bg-white border border-[#E4EAE6] text-[#68776F] hover:bg-gray-50"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filterDueOnly ? "শুধু বাকি আছে এমন (সক্রিয়)" : "সকল কাস্টমার"}
          </button>
        </div>
      </div>

      {/* Customers Due Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#68776F] border-b border-[#E4EAE6]">
              <tr>
                <th className="py-3 px-4 font-semibold">কাস্টমারের নাম</th>
                <th className="py-3 px-4 font-semibold">মোবাইল নম্বর</th>
                <th className="py-3 px-4 font-semibold">মোট কেনাকাটা</th>
                <th className="py-3 px-4 font-semibold">মোট পরিশোধ</th>
                <th className="py-3 px-4 font-semibold">বর্তমান বকেয়া</th>
                <th className="py-3 px-4 font-semibold">সর্বশেষ লেনদেন</th>
                <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#68776F]">
                    কোনো কাস্টমার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const hasDue = c.currentDue > 0;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#172B24]">{c.name}</div>
                        {c.address && (
                          <div className="text-[10px] text-[#68776F] truncate max-w-xs">
                            {c.address}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#68776F]">
                        {c.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#172B24]">
                        {formatCurrency(c.totalPurchases, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#16834A]">
                        {formatCurrency(c.totalPaid, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3.5 px-4">
                        {hasDue ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            {formatCurrency(c.currentDue, profile.useBengaliDigits)}
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FAF5] text-[#16834A]">
                            পরিশোধিত
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#68776F] whitespace-nowrap">
                        {c.lastTransactionDate
                          ? formatBengaliDate(c.lastTransactionDate, false, profile.useBengaliDigits)
                          : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasDue && (
                            <>
                              <button
                                onClick={() => openPaymentModal(c)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#116149] rounded-lg text-xs font-bold transition-colors"
                                title="বাকি আদায় জমা করুন"
                              >
                                বাকি আদায়
                              </button>
                              <button
                                onClick={() => handleCopyReminder(c)}
                                className="p-1.5 text-gray-500 hover:text-[#116149] hover:bg-gray-100 rounded-lg transition-colors"
                                title="তাগাদা বার্তা কপি করুন"
                              >
                                {copiedReminderId === c.id ? (
                                  <span className="text-[10px] text-[#16834A] font-bold">
                                    কপি হয়েছে!
                                  </span>
                                ) : (
                                  <MessageSquare className="w-3.5 h-3.5 text-[#3976D8]" />
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setLedgerCustomer(c)}
                            className="p-1.5 text-gray-400 hover:text-[#172B24] hover:bg-gray-100 rounded-lg transition-colors"
                            title="লেনদেন লেজার"
                          >
                            <FileText className="w-3.5 h-3.5" />
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#16A574]" />
                বাকি আদায়ের হিসাব যোগ করুন
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">কাস্টমার নির্বাচন *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) setPaymentAmount(cust.currentDue);
                  }}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
                >
                  <option value="">নির্বাচন করুন</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""} — বাকি: ৳{c.currentDue}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerId && (
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs flex justify-between items-center">
                  <span className="text-red-900 font-medium">বর্তমান বকেয়া:</span>
                  <span className="font-bold text-red-700 text-sm">
                    {formatCurrency(
                      customers.find((c) => c.id === selectedCustomerId)?.currentDue || 0,
                      profile.useBengaliDigits
                    )}
                  </span>
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">আদায়কৃত টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm text-[#116149] focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">আদায়ের তারিখ</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">আদায়ের মাধ্যম</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value as "নগদ" | "বিকাশ" | "ব্যাংক")
                    }
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  >
                    <option value="নগদ">নগদ</option>
                    <option value="বিকাশ">বিকাশ/নগদ</option>
                    <option value="ব্যাংক">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">রেফারেন্স / নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: TrxID বা হাতেনাতে প্রাপ্ত"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              {paymentError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-[#68776F]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl font-bold shadow-xs"
                >
                  আদায় সম্পন্ন ও রসিদ তৈরি
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger View Modal */}
      {ledgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-[#172B24]">
                  {ledgerCustomer.name} - খাতা লেজার
                </h3>
                <p className="text-xs text-[#68776F]">ফোন: {ledgerCustomer.phone || "—"}</p>
              </div>
              <button onClick={() => setLedgerCustomer(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-[#68776F] block">মোট কেনাকাটা</span>
                <span className="font-bold text-sm text-[#172B24]">
                  {formatCurrency(ledgerCustomer.totalPurchases, profile.useBengaliDigits)}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <span className="text-[#116149] block">মোট পরিশোধ</span>
                <span className="font-bold text-sm text-[#16834A]">
                  {formatCurrency(ledgerCustomer.totalPaid, profile.useBengaliDigits)}
                </span>
              </div>
              <div className="p-2.5 bg-red-50 rounded-xl">
                <span className="text-red-700 block">বর্তমান বাকি</span>
                <span className="font-bold text-sm text-red-700">
                  {formatCurrency(ledgerCustomer.currentDue, profile.useBengaliDigits)}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              <h4 className="text-xs font-bold text-[#172B24] mb-2">
                সাম্প্রতিক কেনাকাটার ইতিহাস
              </h4>
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-[#68776F] border-b">
                  <tr>
                    <th className="py-2 px-3">রসিদ</th>
                    <th className="py-2 px-3">তারিখ</th>
                    <th className="py-2 px-3">মোট</th>
                    <th className="py-2 px-3">পরিশোধ</th>
                    <th className="py-2 px-3">বাকি</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#68776F]">
                        কোনো বিক্রয় রেকর্ড নেই
                      </td>
                    </tr>
                  ) : (
                    customerSales.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3 font-bold text-[#116149]">{s.receiptNo}</td>
                        <td className="py-2 px-3 text-[#68776F]">
                          {formatBengaliDate(s.date, false, profile.useBengaliDigits)}
                        </td>
                        <td className="py-2 px-3 font-semibold">
                          {formatCurrency(s.grandTotal, profile.useBengaliDigits)}
                        </td>
                        <td className="py-2 px-3 text-[#16834A]">
                          {formatCurrency(s.paidAmount, profile.useBengaliDigits)}
                        </td>
                        <td className="py-2 px-3 font-bold text-red-600">
                          {formatCurrency(s.dueAmount, profile.useBengaliDigits)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setLedgerCustomer(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#172B24] rounded-xl text-xs font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Payment Receipt Modal */}
      <ReceiptModal
        paymentReceipt={completedPaymentReceipt}
        profile={profile}
        isOpen={Boolean(completedPaymentReceipt)}
        onClose={() => setCompletedPaymentReceipt(null)}
      />
    </div>
  );
};
