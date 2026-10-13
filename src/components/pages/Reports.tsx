import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Package,
  PiggyBank,
  Receipt,
  Users,
  Printer,
  FileSpreadsheet,
} from "lucide-react";

type ReportPeriod = "today" | "7days" | "30days" | "month" | "all";
type ReportTab = "summary" | "sales" | "expenses" | "profit" | "inventory" | "dues";

export const Reports: React.FC = () => {
  const { sales, expenses, products, customers, profile } = useBusiness();

  const [period, setPeriod] = useState<ReportPeriod>("30days");
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>("summary");

  // Filter dates
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();

    if (period === "today") {
      // same date
    } else if (period === "7days") {
      start.setDate(end.getDate() - 7);
    } else if (period === "30days") {
      start.setDate(end.getDate() - 30);
    } else if (period === "month") {
      start.setDate(1); // 1st of this month
    } else if (period === "all") {
      start.setFullYear(2020);
    }

    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [period]);

  // Filtered Sales within period
  const periodSales = useMemo(() => {
    return sales.filter((s) => {
      if (s.isVoided) return false;
      const d = s.date.split("T")[0];
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  // Filtered Expenses within period
  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => {
      return e.date >= startDate && e.date <= endDate;
    });
  }, [expenses, startDate, endDate]);

  // Financial Metrics
  const totalSalesRevenue = useMemo(() => {
    return periodSales.reduce((sum, s) => sum + s.grandTotal, 0);
  }, [periodSales]);

  const totalSalesPaid = useMemo(() => {
    return periodSales.reduce((sum, s) => sum + s.paidAmount, 0);
  }, [periodSales]);

  const totalSalesDue = useMemo(() => {
    return periodSales.reduce((sum, s) => sum + s.dueAmount, 0);
  }, [periodSales]);

  const totalCOGS = useMemo(() => {
    let cost = 0;
    for (const sale of periodSales) {
      for (const item of sale.items) {
        cost += (item.costPrice || 0) * item.quantity;
      }
    }
    return cost;
  }, [periodSales]);

  const totalExpensesAmount = useMemo(() => {
    return periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [periodExpenses]);

  // Gross profit = Revenue - COGS
  const grossProfit = totalSalesRevenue - totalCOGS;

  // Operating net profit = Gross Profit - Operating Expenses
  const netOperatingProfit = grossProfit - totalExpensesAmount;

  // Inventory valuation
  const inventoryCostValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  }, [products]);

  const inventoryRetailValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  }, [products]);

  // Product performance in period
  const productPerformance = useMemo(() => {
    const map: Record<
      string,
      { name: string; quantity: number; revenue: number; cost: number; unit: string }
    > = {};

    for (const sale of periodSales) {
      for (const item of sale.items) {
        if (!map[item.productId]) {
          map[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            cost: 0,
            unit: item.unit,
          };
        }
        map[item.productId].quantity += item.quantity;
        map[item.productId].revenue += item.total;
        map[item.productId].cost += (item.costPrice || 0) * item.quantity;
      }
    }

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [periodSales]);

  // Expense categories breakdown in period
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of periodExpenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodExpenses]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let fileName = `ব্যবসায়িক_রিপোর্ট_${startDate}_থেকে_${endDate}.csv`;

    if (activeReportTab === "sales") {
      headers = ["রসিদ নং,তারিখ,কাস্টমার,পণ্য সংখ্যা,মোট টাকা,পরিশোধ,বাকি,মাধ্যম"];
      rows = periodSales.map((s) => [
        s.receiptNo,
        s.date,
        `"${s.customerName || "সাধারণ ক্রেতা"}"`,
        String(s.items.length),
        String(s.grandTotal),
        String(s.paidAmount),
        String(s.dueAmount),
        s.paymentMethod,
      ]);
    } else if (activeReportTab === "expenses") {
      headers = ["বিবরণ,খাত,টাকার পরিমাণ,তারিখ,মাধ্যম"];
      rows = periodExpenses.map((e) => [
        `"${e.title}"`,
        `"${e.category}"`,
        String(e.amount),
        e.date,
        e.paymentMethod,
      ]);
    } else {
      // General summary
      headers = ["মেট্রিক,টাকার পরিমাণ (৳)"];
      rows = [
        ["মোট বিক্রয় (বিক্রয় আয়)", String(totalSalesRevenue)],
        ["পণ্যের ক্রয়মূল্য (COGS)", String(totalCOGS)],
        ["মোট স্থূল লাভ (Gross Profit)", String(grossProfit)],
        ["দোকানের পরিচালন খরচ (Expenses)", String(totalExpensesAmount)],
        ["নিট পরিচালন লাভ (Net Operating Profit)", String(netOperatingProfit)],
        ["নগদ আদায়", String(totalSalesPaid)],
        ["নতুন তৈরি বকেয়া", String(totalSalesDue)],
      ];
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#16A574]" />
            ব্যবসায়িক রিপোর্ট ও আর্থিক বিশ্লেষণ
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            বিক্রি, খরচ, পণ্য লাভ ও মজুদ মালের সঠিক আর্থিক হিসাব
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-[#116149]" />
            CSV ডাউনলোড
          </button>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            রিপোর্ট প্রিন্ট
          </button>
        </div>
      </div>

      {/* Date Period Filter Pills */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[#68776F] font-semibold flex items-center gap-1 mr-2">
            <Calendar className="w-4 h-4 text-[#16A574]" /> সময়সীমা:
          </span>
          <button
            onClick={() => setPeriod("today")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              period === "today"
                ? "bg-[#116149] text-white font-bold"
                : "bg-[#F7F9FC] text-[#68776F] hover:bg-gray-100"
            }`}
          >
            আজ
          </button>
          <button
            onClick={() => setPeriod("7days")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              period === "7days"
                ? "bg-[#116149] text-white font-bold"
                : "bg-[#F7F9FC] text-[#68776F] hover:bg-gray-100"
            }`}
          >
            গত ৭ দিন
          </button>
          <button
            onClick={() => setPeriod("30days")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              period === "30days"
                ? "bg-[#116149] text-white font-bold"
                : "bg-[#F7F9FC] text-[#68776F] hover:bg-gray-100"
            }`}
          >
            গত ৩০ দিন
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              period === "month"
                ? "bg-[#116149] text-white font-bold"
                : "bg-[#F7F9FC] text-[#68776F] hover:bg-gray-100"
            }`}
          >
            চলতি মাস
          </button>
          <button
            onClick={() => setPeriod("all")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              period === "all"
                ? "bg-[#116149] text-white font-bold"
                : "bg-[#F7F9FC] text-[#68776F] hover:bg-gray-100"
            }`}
          >
            সম্পূর্ণ রেকর্ড
          </button>
        </div>

        <span className="text-xs text-[#68776F] font-medium">
          {formatBengaliDate(startDate, false, profile.useBengaliDigits)} থেকে{" "}
          {formatBengaliDate(endDate, false, profile.useBengaliDigits)}
        </span>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveReportTab("summary")}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeReportTab === "summary"
              ? "bg-[#116149] text-white shadow-xs"
              : "bg-white border text-[#68776F] hover:bg-gray-50"
          }`}
        >
          আর্থিক সারাংশ (P&L)
        </button>
        <button
          onClick={() => setActiveReportTab("sales")}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeReportTab === "sales"
              ? "bg-[#116149] text-white shadow-xs"
              : "bg-white border text-[#68776F] hover:bg-gray-50"
          }`}
        >
          বিক্রির রিপোর্ট ({toBengaliNumber(periodSales.length)})
        </button>
        <button
          onClick={() => setActiveReportTab("expenses")}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeReportTab === "expenses"
              ? "bg-[#116149] text-white shadow-xs"
              : "bg-white border text-[#68776F] hover:bg-gray-50"
          }`}
        >
          খরচের রিপোর্ট ({toBengaliNumber(periodExpenses.length)})
        </button>
        <button
          onClick={() => setActiveReportTab("inventory")}
          className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeReportTab === "inventory"
              ? "bg-[#116149] text-white shadow-xs"
              : "bg-white border text-[#68776F] hover:bg-gray-50"
          }`}
        >
          স্টক মূল্যায়ন ও সম্পদ
        </button>
      </div>

      {/* Tab 1: Financial Summary (Profit & Loss / P&L) */}
      {activeReportTab === "summary" && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
              <span className="text-xs font-semibold text-[#68776F] block">মোট বিক্রয় আয়</span>
              <h3 className="text-2xl font-bold text-[#172B24] mt-2">
                {formatCurrency(totalSalesRevenue, profile.useBengaliDigits)}
              </h3>
              <p className="text-[11px] text-[#68776F] mt-1">
                নগদ আদায়: {formatCurrency(totalSalesPaid, profile.useBengaliDigits)}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
              <span className="text-xs font-semibold text-[#68776F] block">
                পণ্যের ক্রয়মূল্য (COGS)
              </span>
              <h3 className="text-2xl font-bold text-[#68776F] mt-2">
                {formatCurrency(totalCOGS, profile.useBengaliDigits)}
              </h3>
              <p className="text-[11px] text-[#68776F] mt-1">বিক্রীত মালের আসল ক্রয় দর</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
              <span className="text-xs font-semibold text-[#68776F] block">
                দোকানের মোট খরচ
              </span>
              <h3 className="text-2xl font-bold text-[#D64545] mt-2">
                {formatCurrency(totalExpensesAmount, profile.useBengaliDigits)}
              </h3>
              <p className="text-[11px] text-[#68776F] mt-1">ভাড়া, বেতন, ইউটিলিটি ইত্যাদি</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
              <span className="text-xs font-semibold text-[#68776F] block">
                নিট পরিচালন লাভ (Net Profit)
              </span>
              <h3
                className={`text-2xl font-bold mt-2 ${
                  netOperatingProfit >= 0 ? "text-[#16834A]" : "text-[#D64545]"
                }`}
              >
                {formatCurrency(netOperatingProfit, profile.useBengaliDigits)}
              </h3>
              <p className="text-[11px] text-[#68776F] mt-1">স্থূল লাভ - মোট পরিচালনা ব্যয়</p>
            </div>
          </div>

          {/* Detailed Accounting Statement Table */}
          <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-6">
            <h3 className="text-base font-bold text-[#172B24] mb-4">
              আয়-ব্যয় ও লাভ-ক্ষতির পূর্ণাঙ্গ বিবরণী (Income Statement)
            </h3>

            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between items-center font-bold text-[#172B24]">
                <span>১. মোট বিক্রয় (Gross Sales Revenue)</span>
                <span>{formatCurrency(totalSalesRevenue, profile.useBengaliDigits)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-[#68776F] pl-4">
                <span>(-) বিক্রীত পণ্যের মোট ক্রয়মূল্য (Cost of Goods Sold - COGS)</span>
                <span>- {formatCurrency(totalCOGS, profile.useBengaliDigits)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center font-bold text-[#116149] bg-[#F0FAF5] px-3 rounded-lg">
                <span>= মোট স্থূল লাভ (Gross Profit)</span>
                <span>{formatCurrency(grossProfit, profile.useBengaliDigits)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-[#D64545] pl-4">
                <span>(-) দোকানের দৈনন্দিন পরিচালন খরচ (Operating Expenses)</span>
                <span>- {formatCurrency(totalExpensesAmount, profile.useBengaliDigits)}</span>
              </div>
              <div className="py-3 flex justify-between items-center text-sm font-bold text-[#16834A] border-t-2 border-emerald-600 px-3 bg-emerald-50 rounded-lg">
                <span>= নিট অর্জিত লাভ (Net Operating Profit)</span>
                <span>{formatCurrency(netOperatingProfit, profile.useBengaliDigits)}</span>
              </div>
            </div>
          </div>

          {/* Product Sales Performance in this period */}
          <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-6">
            <h3 className="text-base font-bold text-[#172B24] mb-3">
              পণ্যভিত্তিক বিক্রয় ও মুনাফা বিশ্লেষণ
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-[#68776F] border-b">
                  <tr>
                    <th className="py-2.5 px-3">পণ্যের নাম</th>
                    <th className="py-2.5 px-3 text-center">বিক্রীত পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right">মোট বিক্রয় আয়</th>
                    <th className="py-2.5 px-3 text-right">ক্রয়মূল্য</th>
                    <th className="py-2.5 px-3 text-right">অর্জিত লাভ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#68776F]">
                        এই সময়ে কোনো বিক্রয় হয়নি
                      </td>
                    </tr>
                  ) : (
                    productPerformance.map((p, idx) => {
                      const itemProfit = p.revenue - p.cost;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-[#172B24]">{p.name}</td>
                          <td className="py-2.5 px-3 text-center">
                            {toBengaliNumber(p.quantity)} {p.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-[#116149]">
                            {formatCurrency(p.revenue, profile.useBengaliDigits)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#68776F]">
                            {formatCurrency(p.cost, profile.useBengaliDigits)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#16834A]">
                            +{formatCurrency(itemProfit, profile.useBengaliDigits)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sales List */}
      {activeReportTab === "sales" && (
        <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#68776F] border-b">
                <tr>
                  <th className="py-3 px-4 font-semibold">রসিদ নং</th>
                  <th className="py-3 px-4 font-semibold">তারিখ</th>
                  <th className="py-3 px-4 font-semibold">ক্রেতা</th>
                  <th className="py-3 px-4 font-semibold">আইটেম সংখ্যা</th>
                  <th className="py-3 px-4 font-semibold">মোট প্রদেয়</th>
                  <th className="py-3 px-4 font-semibold">পরিশোধ</th>
                  <th className="py-3 px-4 font-semibold">বাকি</th>
                  <th className="py-3 px-4 font-semibold">মাধ্যম</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodSales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-[#116149]">{s.receiptNo}</td>
                    <td className="py-3 px-4 text-[#68776F]">
                      {formatBengaliDate(s.date, true, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4 font-medium">{s.customerName || "সাধারণ ক্রেতা"}</td>
                    <td className="py-3 px-4">{toBengaliNumber(s.items.length)}টি</td>
                    <td className="py-3 px-4 font-bold">
                      {formatCurrency(s.grandTotal, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#16834A]">
                      {formatCurrency(s.paidAmount, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-red-600">
                      {s.dueAmount > 0
                        ? formatCurrency(s.dueAmount, profile.useBengaliDigits)
                        : "০"}
                    </td>
                    <td className="py-3 px-4 text-[#68776F]">{s.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Expenses List */}
      {activeReportTab === "expenses" && (
        <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#68776F] border-b">
                <tr>
                  <th className="py-3 px-4 font-semibold">তারিখ</th>
                  <th className="py-3 px-4 font-semibold">খরচের বিবরণ</th>
                  <th className="py-3 px-4 font-semibold">খাত</th>
                  <th className="py-3 px-4 font-semibold">টাকার পরিমাণ</th>
                  <th className="py-3 px-4 font-semibold">পরিশোধের মাধ্যম</th>
                  <th className="py-3 px-4 font-semibold">নোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {periodExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-[#68776F]">
                      {formatBengaliDate(e.date, false, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#172B24]">{e.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#D64545]">
                      {formatCurrency(e.amount, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4 text-[#68776F]">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-[#68776F]">{e.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Inventory Valuation */}
      {activeReportTab === "inventory" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
              <span className="text-xs font-semibold text-[#68776F] block">
                মজুদ পণ্যের ক্রয়মূল্যভিত্তিক সম্পদ
              </span>
              <h3 className="text-2xl font-bold text-[#116149] mt-2">
                {formatCurrency(inventoryCostValue, profile.useBengaliDigits)}
              </h3>
              <p className="text-[11px] text-[#68776F] mt-1">দোকানের মোট কেনা মালের বিনিয়োগ মূল্য</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
              <span className="text-xs font-semibold text-[#68776F] block">
                মজুদ পণ্যের সম্ভাব্য বিক্রয়মূল্য
              </span>
              <h3 className="text-2xl font-bold text-[#16A574] mt-2">
                {formatCurrency(inventoryRetailValue, profile.useBengaliDigits)}
              </h3>
              <p className="text-[11px] text-[#68776F] mt-1">বর্তমান স্টক বিক্রির মাধ্যমে সম্ভাব্য আদায়</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FC] text-[#68776F] border-b">
                  <tr>
                    <th className="py-3 px-4 font-semibold">পণ্য ও কোড</th>
                    <th className="py-3 px-4 font-semibold">বিভাগ</th>
                    <th className="py-3 px-4 font-semibold text-center">বর্তমান স্টক</th>
                    <th className="py-3 px-4 font-semibold text-right">একক ক্রয় দর</th>
                    <th className="py-3 px-4 font-semibold text-right">একক বিক্রয় দর</th>
                    <th className="py-3 px-4 font-semibold text-right">মোট ক্রয় সম্পদ</th>
                    <th className="py-3 px-4 font-semibold text-right">মোট বিক্রয় মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-[#172B24]">{p.name}</td>
                      <td className="py-3 px-4 text-[#68776F]">{p.category}</td>
                      <td className="py-3 px-4 text-center font-bold">
                        {toBengaliNumber(p.stock)} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatCurrency(p.costPrice, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatCurrency(p.sellingPrice, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#116149]">
                        {formatCurrency(p.stock * p.costPrice, profile.useBengaliDigits)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#172B24]">
                        {formatCurrency(p.stock * p.sellingPrice, profile.useBengaliDigits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
