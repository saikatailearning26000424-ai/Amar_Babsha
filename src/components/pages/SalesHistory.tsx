import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Sale, PaymentStatus } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  Search,
  Filter,
  FileText,
  RotateCcw,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  X,
} from "lucide-react";
import { ReceiptModal } from "../common/ReceiptModal";

export const SalesHistory: React.FC = () => {
  const { sales, voidSale, profile } = useBusiness();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("সব");
  const [methodFilter, setMethodFilter] = useState<string>("সব");
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  // Void modal state
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchSearch =
        !searchQuery ||
        sale.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sale.customerPhone && sale.customerPhone.includes(searchQuery));

      const matchStatus = statusFilter === "সব" || sale.paymentStatus === statusFilter;
      const matchMethod = methodFilter === "সব" || sale.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [sales, searchQuery, statusFilter, methodFilter]);

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToVoid) return;
    if (!voidReason.trim()) {
      setVoidError("দয়া করে বিক্রয় বাতিলের কারণ উল্লেখ করুন।");
      return;
    }

    const res = voidSale(saleToVoid.id, voidReason.trim());
    if (res.success) {
      setSaleToVoid(null);
      setVoidReason("");
      setVoidError("");
    } else {
      setVoidError(res.error || "বাতিল করা সম্ভব হয়নি।");
    }
  };

  const handleExportCSV = () => {
    const headers = ["রসিদ নং,তারিখ,কাস্টমার,পণ্য সংখ্যা,মোট টাকা,পরিশোধ,বাকি,পেমেন্ট মাধ্যম,অবস্থা,বাতিল কিনা"];
    const rows = filteredSales.map((s) => [
      s.receiptNo,
      s.date,
      `"${s.customerName || "সাধারণ ক্রেতা"}"`,
      s.items.length,
      s.grandTotal,
      s.paidAmount,
      s.dueAmount,
      s.paymentMethod,
      s.paymentStatus,
      s.isVoided ? "হ্যাঁ (বাতিল)" : "না",
    ].join(","));

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `বিক্রির_ইতিহাস_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24]">
            বিক্রির ইতিহাস ও রেকর্ড
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            পূর্বে সম্পন্ন হওয়া সমস্ত বিক্রয়, চালান, পরিশোধ ও বাতিলের পূর্ণাঙ্গ তালিকা
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-4 h-4 text-[#116149]" />
          CSV ডাউনলোড
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="রসিদ নং (INV-...), ক্রেতার নাম বা ফোন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#16A574]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:outline-hidden"
          >
            <option value="সব">পরিশোধের অবস্থা: সব</option>
            <option value="পরিশোধিত">পরিশোধিত</option>
            <option value="আংশিক">আংশিক পরিশোধ</option>
            <option value="বাকি">বাকি</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:outline-hidden"
          >
            <option value="সব">পেমেন্ট মাধ্যম: সব</option>
            <option value="নগদ">নগদ</option>
            <option value="বিকাশ">বিকাশ/নগদ</option>
            <option value="ব্যাংক">ব্যাংক</option>
            <option value="বাকি">বাকি</option>
            <option value="আংশিক পরিশোধ">আংশিক</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#68776F] border-b border-[#E4EAE6]">
              <tr>
                <th className="py-3 px-4 font-semibold">রসিদ নং</th>
                <th className="py-3 px-4 font-semibold">তারিখ ও সময়</th>
                <th className="py-3 px-4 font-semibold">কাস্টমার</th>
                <th className="py-3 px-4 font-semibold">পণ্য সংখ্যা</th>
                <th className="py-3 px-4 font-semibold">মোট মূল্য</th>
                <th className="py-3 px-4 font-semibold">পরিশোধ</th>
                <th className="py-3 px-4 font-semibold">বাকি</th>
                <th className="py-3 px-4 font-semibold">মাধ্যম</th>
                <th className="py-3 px-4 font-semibold">অবস্থা</th>
                <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#68776F]">
                    কোনো বিক্রয় রেকর্ড খুঁজে পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      sale.isVoided ? "bg-gray-50/60 opacity-65" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#116149]">
                      {sale.receiptNo}
                      {sale.isVoided && (
                        <span className="block text-[10px] text-red-600 font-normal">
                          [বাতিলকৃত]
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#68776F] whitespace-nowrap">
                      {formatBengaliDate(sale.date, true, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#172B24]">
                      {sale.customerName || "সাধারণ ক্রেতা"}
                      {sale.customerPhone && (
                        <span className="block text-[10px] text-[#68776F]">
                          {sale.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#172B24]">
                      {toBengaliNumber(sale.items.length)}টি পণ্য
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#172B24]">
                      {formatCurrency(sale.grandTotal, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#16834A]">
                      {formatCurrency(sale.paidAmount, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-red-600">
                      {sale.dueAmount > 0
                        ? formatCurrency(sale.dueAmount, profile.useBengaliDigits)
                        : "০"}
                    </td>
                    <td className="py-3.5 px-4 text-[#68776F] whitespace-nowrap">
                      {sale.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4">
                      {sale.isVoided ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                          বাতিল
                        </span>
                      ) : sale.paymentStatus === "পরিশোধিত" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FAF5] text-[#16834A]">
                          <CheckCircle2 className="w-3 h-3" />
                          পরিশোধিত
                        </span>
                      ) : sale.paymentStatus === "আংশিক" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
                          <Clock className="w-3 h-3" />
                          আংশিক
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          বাকি
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="px-2.5 py-1 text-[#116149] hover:bg-emerald-50 rounded-lg font-semibold inline-flex items-center gap-1 transition-colors"
                          title="রসিদ দেখুন ও প্রিন্ট করুন"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          রসিদ
                        </button>
                        {!sale.isVoided && (
                          <button
                            onClick={() => {
                              setSaleToVoid(sale);
                              setVoidReason("");
                              setVoidError("");
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="বিক্রয় বাতিল বা রিটার্ন করুন"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Confirmation Modal */}
      {saleToVoid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#D64545] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#D64545]" />
                বিক্রয় বাতিল নিশ্চিতকরণ
              </h3>
              <button onClick={() => setSaleToVoid(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-xs text-[#68776F] leading-relaxed">
              আপনি কি নিশ্চিত যে রসিদ{" "}
              <strong className="text-[#172B24]">{saleToVoid.receiptNo}</strong> (মোট ৳
              {saleToVoid.grandTotal}) বাতিল করতে চান? এটি স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট পণ্যগুলোর
              স্টক ফেরত দেবে এবং কাস্টমারের হিসাব সমন্বয় করবে।
            </p>

            <form onSubmit={handleConfirmVoid} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[#172B24]">
                  বাতিল করার কারণ লিখুন *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: কাস্টমার পণ্য পরিবর্তন করেছেন / ভুল এন্ট্রি হয়েছিল..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#D64545] focus:outline-hidden"
                />
              </div>

              {voidError && (
                <p className="text-red-600 font-medium text-xs">{voidError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaleToVoid(null)}
                  className="px-4 py-2 border rounded-xl text-[#68776F]"
                >
                  ফিরে যান
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
                >
                  হ্যাঁ, বাতিল করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        profile={profile}
        isOpen={Boolean(selectedSaleForReceipt)}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </div>
  );
};
