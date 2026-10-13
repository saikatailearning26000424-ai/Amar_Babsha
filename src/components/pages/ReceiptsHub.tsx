import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Sale } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  FileText,
  Search,
  Printer,
  Share2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Loader2,
} from "lucide-react";
import { ReceiptModal } from "../common/ReceiptModal";
import { downloadElementAsPDF } from "../../utils/pdfGenerator";

export const ReceiptsHub: React.FC = () => {
  const { sales, profile } = useBusiness();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(() => sales[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paperFormat, setPaperFormat] = useState<"thermal" | "a4">("thermal");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      return (
        !searchQuery ||
        s.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.customerPhone && s.customerPhone.includes(searchQuery))
      );
    });
  }, [sales, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPreviewPdf = async () => {
    if (!selectedSale) return;
    setIsDownloadingPdf(true);
    const docName = `Invoice_${selectedSale.receiptNo.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
    await downloadElementAsPDF("hub-receipt-preview", {
      fileName: docName,
      format: paperFormat,
    });
    setIsDownloadingPdf(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#16A574]" />
            চালান ও রসিদ কেন্দ্র
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            দোকানের মেমো, বিক্রয় রসিদ ও চালান অনুসন্ধান এবং PDF ডাউনলোড বা প্রিন্ট করুন
          </p>
        </div>

        {selectedSale && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleDownloadPreviewPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              title="মেমো PDF ডাউনলোড করুন"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isDownloadingPdf ? "তৈরি হচ্ছে..." : "PDF মেমো ডাউনলোড"}</span>
            </button>
            <button
              onClick={() => {
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              রসিদ প্রিন্ট করুন
            </button>
          </div>
        )}
      </div>

      {/* Main Layout: List on Left (5 cols), Live Preview on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Receipts Search & List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E4EAE6] shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[#68776F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="রসিদ নং (INV-...) বা ক্রেতার নাম..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs focus:outline-hidden focus:border-[#16A574]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden max-h-[620px] overflow-y-auto divide-y divide-gray-100">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#68776F]">
                কোনো রসিদ পাওয়া যায়নি
              </div>
            ) : (
              filteredSales.map((s) => {
                const isSelected = selectedSale?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSale(s)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#F0FAF5] border-l-4 border-[#16A574]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#116149]">
                        {s.receiptNo}
                      </span>
                      <span className="font-bold text-xs text-[#172B24]">
                        {formatCurrency(s.grandTotal, profile.useBengaliDigits)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[11px] text-[#68776F]">
                      <span className="truncate pr-2">{s.customerName || "সাধারণ ক্রেতা"}</span>
                      <span>{formatBengaliDate(s.date, false, profile.useBengaliDigits)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Live Receipt Document Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-6 space-y-4">
          {/* Format Toggle Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E4EAE6]">
            <span className="text-xs font-bold text-[#172B24] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#16A574]" />
              রসিদ প্রিভিউ
            </span>

            <div className="flex items-center gap-2">
              <div className="flex bg-[#F7F9FC] p-1 rounded-xl border text-xs">
                <button
                  onClick={() => setPaperFormat("thermal")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    paperFormat === "thermal"
                      ? "bg-white text-[#116149] shadow-xs font-bold"
                      : "text-[#68776F]"
                  }`}
                >
                  থার্মাল স্লিপ
                </button>
                <button
                  onClick={() => setPaperFormat("a4")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    paperFormat === "a4"
                      ? "bg-white text-[#116149] shadow-xs font-bold"
                      : "text-[#68776F]"
                  }`}
                >
                  চালান (A4)
                </button>
              </div>

              <button
                onClick={handleDownloadPreviewPdf}
                disabled={isDownloadingPdf}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                title="PDF ডাউনলোড করুন"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloadingPdf ? "..." : "PDF"}</span>
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 bg-[#116149] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                প্রিন্ট
              </button>
            </div>
          </div>

          {/* Actual Document Mockup */}
          {selectedSale ? (
            <div
              id="hub-receipt-preview"
              className={`p-6 border border-gray-200 rounded-xl bg-white shadow-2xs mx-auto ${
                paperFormat === "thermal" ? "max-w-sm text-xs" : "w-full text-sm"
              }`}
            >
              {/* Shop Header */}
              <div className="text-center pb-4 border-b border-dashed border-gray-300">
                <h2 className="text-lg font-bold text-[#116149]">
                  {profile.businessName}
                </h2>
                {profile.tagline && (
                  <p className="text-[11px] text-[#68776F] mt-0.5">{profile.tagline}</p>
                )}
                <p className="text-[11px] text-[#68776F] mt-1">{profile.address}</p>
                {profile.phone && (
                  <p className="text-[11px] font-semibold text-[#172B24] mt-0.5">
                    মোবাইল: {profile.phone}
                  </p>
                )}
              </div>

              {/* Invoice Meta */}
              <div className="mt-4 pb-2 border-b border-gray-200 flex justify-between items-center text-[11px] text-[#68776F]">
                <div>
                  <span className="font-semibold text-[#172B24]">রসিদ নং:</span>{" "}
                  {selectedSale.receiptNo}
                </div>
                <div>
                  {formatBengaliDate(selectedSale.date, true, profile.useBengaliDigits)}
                </div>
              </div>

              {/* Customer */}
              <div className="py-2.5 text-[11px] border-b border-gray-200 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-[#68776F]">ক্রেতা:</span>
                  <span className="font-semibold text-[#172B24]">
                    {selectedSale.customerName || "সাধারণ খুচরা ক্রেতা"}
                  </span>
                </div>
                {selectedSale.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-[#68776F]">ফোন:</span>
                    <span>{selectedSale.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#68776F]">পেমেন্ট:</span>
                  <span className="font-medium text-[#116149]">
                    {selectedSale.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-3">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-300 text-[#68776F] pb-1">
                      <th className="py-1 font-semibold">পণ্য</th>
                      <th className="py-1 text-center font-semibold">পরিমাণ</th>
                      <th className="py-1 text-right font-semibold">দর</th>
                      <th className="py-1 text-right font-semibold">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1.5 pr-2 font-medium text-[#172B24]">
                          {item.productName}
                        </td>
                        <td className="py-1.5 text-center whitespace-nowrap">
                          {toBengaliNumber(item.quantity)} {item.unit}
                        </td>
                        <td className="py-1.5 text-right whitespace-nowrap">
                          {formatCurrency(item.unitPrice, profile.useBengaliDigits)}
                        </td>
                        <td className="py-1.5 text-right font-medium whitespace-nowrap">
                          {formatCurrency(item.total, profile.useBengaliDigits)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 pt-2 border-t border-dashed border-gray-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-[#68776F]">
                  <span>মোট মূল্য:</span>
                  <span>
                    {formatCurrency(selectedSale.subtotal, profile.useBengaliDigits)}
                  </span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>বিশেষ ছাড়:</span>
                    <span>
                      - {formatCurrency(selectedSale.discount, profile.useBengaliDigits)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-[#172B24] pt-1 border-t border-gray-200">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-[#116149]">
                    {formatCurrency(selectedSale.grandTotal, profile.useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between text-[#16834A] font-semibold">
                  <span>পরিশোধিত টাকা:</span>
                  <span>
                    {formatCurrency(selectedSale.paidAmount, profile.useBengaliDigits)}
                  </span>
                </div>
                {selectedSale.dueAmount > 0 ? (
                  <div className="flex justify-between text-red-600 font-bold bg-red-50 p-1.5 rounded-md mt-1">
                    <span>বাকি টাকা:</span>
                    <span>
                      {formatCurrency(selectedSale.dueAmount, profile.useBengaliDigits)}
                    </span>
                  </div>
                ) : (
                  <div className="text-center text-[10px] font-bold text-[#16834A] bg-[#F0FAF5] py-1 rounded-md mt-1">
                    সম্পূর্ণ পরিশোধিত (পরিশোধ সম্পন্ন)
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-6 pt-3 border-t border-dashed border-gray-300 text-[10px] text-[#68776F]">
                <p className="font-semibold text-[#172B24]">{profile.receiptFooter}</p>
                <p className="text-gray-400 mt-0.5">আমার ব্যবসা AI সফটওয়্যার প্রস্তুতকৃত</p>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-[#68776F]">
              প্রিভিউ দেখার জন্য বাম পাশ থেকে একটি রসিদ নির্বাচন করুন
            </div>
          )}
        </div>
      </div>

      {/* Reusable Print Modal */}
      <ReceiptModal
        sale={selectedSale}
        profile={profile}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
