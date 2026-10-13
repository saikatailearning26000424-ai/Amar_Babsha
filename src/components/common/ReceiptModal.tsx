import React, { useState } from "react";
import { Sale, CustomerPayment, BusinessProfile } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import { Printer, X, CheckCircle, Download, FileText, Share2, Loader2 } from "lucide-react";
import { downloadElementAsPDF } from "../../utils/pdfGenerator";

interface ReceiptModalProps {
  sale?: Sale | null;
  paymentReceipt?: CustomerPayment | null;
  profile: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  paymentReceipt,
  profile,
  isOpen,
  onClose,
}) => {
  const [paperFormat, setPaperFormat] = useState<"thermal" | "a4">("thermal");
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || (!sale && !paymentReceipt)) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    const docName = sale
      ? `Memo_${sale.receiptNo.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`
      : `Payment_${paymentReceipt?.receiptNo.replace(/[^a-zA-Z0-9_-]/g, "_") || "Receipt"}.pdf`;
    await downloadElementAsPDF("printable-receipt", {
      fileName: docName,
      format: paperFormat,
    });
    setIsDownloadingPdf(false);
  };

  const handleCopySummary = () => {
    let text = "";
    if (sale) {
      text = `🧾 ${profile.businessName}\nরসিদ নং: ${sale.receiptNo}\nতারিখ: ${formatBengaliDate(sale.date, true, profile.useBengaliDigits)}\n` +
        `কাস্টমার: ${sale.customerName || "সাধারণ ক্রেতা"}\n` +
        `--------------------\n` +
        sale.items.map(i => `${i.productName} x ${i.quantity} = ৳${i.total}`).join("\n") +
        `\n--------------------\n` +
        `মোট: ৳${sale.grandTotal}\nপরিশোধ: ৳${sale.paidAmount}\nবাকি: ৳${sale.dueAmount}\n` +
        `ধন্যবাদ! আবার আসবেন।`;
    } else if (paymentReceipt) {
      text = `🧾 ${profile.businessName}\nবাকি আদায় রসিদ: ${paymentReceipt.receiptNo}\n` +
        `কাস্টমার: ${paymentReceipt.customerName}\nটাকা: ৳${paymentReceipt.amount}\nঅবশিষ্ট বাকি: ৳${paymentReceipt.remainingDue}\nধন্যবাদ!`;
    }

    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E4EAE6] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4EAE6] bg-[#F7F9FC] print:hidden">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#F0FAF5] text-[#116149]">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="font-semibold text-lg text-[#172B24]">
              {sale ? "বিক্রয় রসিদ" : "বাকি আদায়ের রসিদ"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex bg-[#E4EAE6] p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setPaperFormat("thermal")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperFormat === "thermal"
                    ? "bg-white text-[#116149] shadow-xs"
                    : "text-[#68776F] hover:text-[#172B24]"
                }`}
              >
                রসিদ স্লিপ
              </button>
              <button
                onClick={() => setPaperFormat("a4")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperFormat === "a4"
                    ? "bg-white text-[#116149] shadow-xs"
                    : "text-[#68776F] hover:text-[#172B24]"
                }`}
              >
                পূর্ণ চালান (A4)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-[#F0FAF5] border-b border-[#E4EAE6] text-xs print:hidden">
          <span className="text-[#116149] font-medium flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-[#16A574]" />
            লেনদেন সফলভাবে সম্পন্ন হয়েছে
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-2.5 py-1 bg-white border border-[#E4EAE6] text-[#172B24] rounded-md font-medium hover:bg-gray-50 flex items-center gap-1 transition-colors"
              title="কপি করুন"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedNotice ? "কপি হয়েছে!" : "শেয়ার"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              title="মেমো PDF ফাইল ডাউনলোড করুন"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-md font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              প্রিন্ট
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div
          id="printable-receipt"
          className={`p-6 max-h-[75vh] overflow-y-auto bg-white text-[#172B24] ${
            paperFormat === "thermal" ? "max-w-sm mx-auto text-sm" : "w-full"
          }`}
        >
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-dashed border-gray-300">
            <h2 className="text-xl font-bold tracking-tight text-[#116149]">
              {profile.businessName}
            </h2>
            {profile.tagline && (
              <p className="text-xs text-[#68776F] mt-0.5">{profile.tagline}</p>
            )}
            <p className="text-xs text-[#68776F] mt-1">{profile.address}</p>
            {profile.phone && (
              <p className="text-xs font-medium text-[#172B24] mt-0.5">
                মোবাইল: {profile.phone}
              </p>
            )}
          </div>

          {/* Sale Receipt */}
          {sale && (
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs text-[#68776F] pb-2 border-b border-gray-200">
                <div>
                  <span className="font-semibold text-[#172B24]">রসিদ নং:</span>{" "}
                  {sale.receiptNo}
                </div>
                <div>{formatBengaliDate(sale.date, true, profile.useBengaliDigits)}</div>
              </div>

              {/* Customer info */}
              <div className="py-2.5 text-xs border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-[#68776F]">ক্রেতার নাম:</span>
                  <span className="font-semibold text-[#172B24]">
                    {sale.customerName || "সাধারণ খুচরা ক্রেতা"}
                  </span>
                </div>
                {sale.customerPhone && (
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[#68776F]">মোবাইল:</span>
                    <span>{sale.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between mt-0.5">
                  <span className="text-[#68776F]">পরিশোধের মাধ্যম:</span>
                  <span className="font-medium text-[#116149]">
                    {sale.paymentMethod}
                    {sale.paymentReference ? ` (${sale.paymentReference})` : ""}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-3">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-300 text-[#68776F] pb-1">
                      <th className="py-1 font-semibold">পণ্য</th>
                      <th className="py-1 text-center font-semibold">পরিমাণ</th>
                      <th className="py-1 text-right font-semibold">দর</th>
                      <th className="py-1 text-right font-semibold">মোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="py-1.5">
                        <td className="py-1.5 pr-2">
                          <p className="font-medium text-[#172B24]">{item.productName}</p>
                          {item.discount > 0 && (
                            <span className="text-[10px] text-amber-700">
                              ছাড়: {formatCurrency(item.discount, profile.useBengaliDigits)}
                            </span>
                          )}
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
              <div className="mt-4 pt-2 border-t border-dashed border-gray-300 space-y-1 text-xs">
                <div className="flex justify-between text-[#68776F]">
                  <span>মোট মূল্য:</span>
                  <span>{formatCurrency(sale.subtotal, profile.useBengaliDigits)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>বিশেষ ছাড়:</span>
                    <span>- {formatCurrency(sale.discount, profile.useBengaliDigits)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#172B24] pt-1 border-t border-gray-200">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-[#116149]">
                    {formatCurrency(sale.grandTotal, profile.useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between text-[#16834A] font-semibold">
                  <span>পরিশোধিত টাকা:</span>
                  <span>{formatCurrency(sale.paidAmount, profile.useBengaliDigits)}</span>
                </div>
                {sale.dueAmount > 0 ? (
                  <div className="flex justify-between text-[#D64545] font-bold text-sm bg-red-50 p-1.5 rounded-md mt-1">
                    <span>বাকি টাকা:</span>
                    <span>{formatCurrency(sale.dueAmount, profile.useBengaliDigits)}</span>
                  </div>
                ) : (
                  <div className="text-center text-[11px] font-bold text-[#16834A] bg-[#F0FAF5] py-1 rounded-md mt-1">
                    সম্পূর্ণ পরিশোধিত (পরিশোধ সম্পন্ন)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Due Collection Receipt */}
          {paymentReceipt && (
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs text-[#68776F] pb-2 border-b border-gray-200">
                <div>
                  <span className="font-semibold text-[#172B24]">রসিদ নং:</span>{" "}
                  {paymentReceipt.receiptNo}
                </div>
                <div>{formatBengaliDate(paymentReceipt.date, true, profile.useBengaliDigits)}</div>
              </div>

              <div className="py-3 text-xs space-y-2 border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-[#68776F]">কাস্টমারের নাম:</span>
                  <span className="font-semibold text-[#172B24]">{paymentReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68776F]">আদায়ের মাধ্যম:</span>
                  <span className="font-medium text-[#116149]">{paymentReceipt.paymentMethod}</span>
                </div>
                {paymentReceipt.reference && (
                  <div className="flex justify-between">
                    <span className="text-[#68776F]">রেফারেন্স / নোট:</span>
                    <span>{paymentReceipt.reference}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#68776F]">
                  <span>পূর্বের বকেয়া ছিল:</span>
                  <span>{formatCurrency(paymentReceipt.previousDue, profile.useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between text-[#16834A] font-bold text-sm bg-emerald-50 p-2 rounded-md">
                  <span>আদায়কৃত টাকা:</span>
                  <span>{formatCurrency(paymentReceipt.amount, profile.useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between text-[#D64545] font-semibold text-xs pt-1">
                  <span>বর্তমান অবশিষ্ট বকেয়া:</span>
                  <span>{formatCurrency(paymentReceipt.remainingDue, profile.useBengaliDigits)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center mt-6 pt-3 border-t border-dashed border-gray-300 text-xs text-[#68776F]">
            <p className="font-medium text-[#172B24]">{profile.receiptFooter}</p>
            <p className="text-[10px] text-gray-400 mt-1">
              সফটওয়্যার তৈরি করেছে: আমার ব্যবসা AI
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions - Hidden in Print */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-[#F7F9FC] border-t border-[#E4EAE6] print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[#E4EAE6] text-[#68776F] hover:text-[#172B24] bg-white rounded-xl text-sm font-medium transition-colors"
          >
            বন্ধ করুন
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloadingPdf ? "তৈরি হচ্ছে..." : "PDF ডাউনলোড"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            প্রিন্ট
          </button>
        </div>
      </div>
    </div>
  );
};
