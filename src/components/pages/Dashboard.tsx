import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import {
  formatCurrency,
  formatBengaliDate,
  toBengaliNumber,
  getBengaliGreeting,
} from "../../utils/bengali";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  PiggyBank,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Package,
  Calendar,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ReceiptModal } from "../common/ReceiptModal";
import { Sale } from "../../types";

export const Dashboard: React.FC = () => {
  const {
    profile,
    todaySales,
    todayExpenses,
    todayProfit,
    totalDue,
    sales,
    expenses,
    products,
    lowStockItems,
    setActiveTab,
  } = useBusiness();

  const [chartPeriod, setChartPeriod] = useState<"7days" | "30days" | "month">("7days");
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const greeting = getBengaliGreeting();
  const todayFormatted = formatBengaliDate(new Date(), false, profile.useBengaliDigits);

  // Calculate yesterday's sales for comparison
  const yesterdaySales = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    return sales
      .filter((s) => !s.isVoided && s.date.startsWith(yesterdayStr))
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales]);

  const salesTrend = useMemo(() => {
    if (yesterdaySales === 0) return null;
    const diff = todaySales - yesterdaySales;
    const percent = Math.round((diff / yesterdaySales) * 100);
    return {
      isPositive: diff >= 0,
      text: `${Math.abs(percent)}% ${diff >= 0 ? "বৃদ্ধি" : "কম"}`,
    };
  }, [todaySales, yesterdaySales]);

  // Aggregated Sales vs Expenses for the selected period
  const chartData = useMemo(() => {
    const daysCount = chartPeriod === "7days" ? 7 : chartPeriod === "30days" ? 30 : 30;
    const points: { dateLabel: string; sales: number; expenses: number }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split("T")[0];

      // Format label
      const dayNum = profile.useBengaliDigits ? toBengaliNumber(d.getDate()) : d.getDate();
      const monthShort = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"][d.getMonth()];
      const dateLabel = `${dayNum} ${monthShort}`;

      const daySales = sales
        .filter((s) => !s.isVoided && s.date.startsWith(isoDate))
        .reduce((sum, s) => sum + s.grandTotal, 0);

      const dayExpenses = expenses
        .filter((e) => e.date.startsWith(isoDate))
        .reduce((sum, e) => sum + e.amount, 0);

      points.push({ dateLabel, sales: daySales, expenses: dayExpenses });
    }

    return points;
  }, [chartPeriod, sales, expenses, profile.useBengaliDigits]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map((d) => Math.max(d.sales, d.expenses)), 1000);
    return max * 1.15; // with headroom
  }, [chartData]);

  // Top selling products calculated from real transactions
  const topProducts = useMemo(() => {
    const productSalesMap: Record<string, { name: string; quantity: number; revenue: number; unit: string }> = {};

    for (const sale of sales) {
      if (sale.isVoided) continue;
      for (const item of sale.items) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
            unit: item.unit,
          };
        }
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.total;
      }
    }

    return Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [sales]);

  // Recent 5 sales
  const recentSales = useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E4EAE6] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0FAF5] text-[#116149] text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#16A574]" />
            {todayFormatted}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B24]">
            {greeting},{" "}
            <span className="text-[#116149]">
              {profile.ownerName || profile.businessName}!
            </span>
          </h1>
          <p className="text-sm text-[#68776F] mt-1">
            চলুন, আজকের ব্যবসার হিসাব ও অগ্রগতির চিত্র এক নজরে দেখে নিই।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab("pos")}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + নতুন বিক্রি (POS)
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Receipt className="w-4 h-4 text-[#D98A12]" />
            + খরচ যোগ করুন
          </button>
        </div>
      </div>

      {/* 2. Low Stock Immediate Alert Banner if items are critical */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                স্টক সতর্কতা: {toBengaliNumber(lowStockItems.length)}টি পণ্যের স্টক শেষ হওয়ার পথে!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {lowStockItems
                  .slice(0, 3)
                  .map((p) => `${p.name} (${toBengaliNumber(p.stock)} ${p.unit})`)
                  .join(", ")}
                {lowStockItems.length > 3 ? " এবং অন্যান্য..." : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("inventory")}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-2xs"
          >
            স্টক আপডেট করুন →
          </button>
        </div>
      )}

      {/* 3. Four Core Business Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: আজকের বিক্রি */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4EAE6] shadow-xs hover:border-[#16A574]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68776F]">আজকের মোট বিক্রি</span>
            <span className="w-9 h-9 rounded-xl bg-emerald-50 text-[#116149] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#172B24]">
              {formatCurrency(todaySales, profile.useBengaliDigits)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {salesTrend ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold ${
                    salesTrend.isPositive ? "text-[#16834A]" : "text-[#D64545]"
                  }`}
                >
                  {salesTrend.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {salesTrend.text} (গতকালের তুলনায়)
                </span>
              ) : (
                <span className="text-[#68776F]">
                  গতকালের বিক্রি: {formatCurrency(yesterdaySales, profile.useBengaliDigits)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: আজকের খরচ */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4EAE6] shadow-xs hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68776F]">আজকের খরচ</span>
            <span className="w-9 h-9 rounded-xl bg-amber-50 text-[#D98A12] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#172B24]">
              {formatCurrency(todayExpenses, profile.useBengaliDigits)}
            </h3>
            <p className="text-xs text-[#68776F] mt-2 flex items-center gap-1">
              <span>দৈনিক খরচ রেকর্ড</span>
              <button
                onClick={() => setActiveTab("expenses")}
                className="text-[#3976D8] hover:underline font-medium ml-auto"
              >
                বিস্তারিত →
              </button>
            </p>
          </div>
        </div>

        {/* Card 3: আজকের আনুমানিক লাভ */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4EAE6] shadow-xs hover:border-[#16A574]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68776F]">
              আজকের আনুমানিক লাভ
            </span>
            <span className="w-9 h-9 rounded-xl bg-[#F0FAF5] text-[#16834A] flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#16834A]">
              {formatCurrency(todayProfit, profile.useBengaliDigits)}
            </h3>
            <p className="text-[11px] text-[#68776F] mt-2 leading-tight">
              বিক্রি - পণ্যের ক্রয়মূল্য - দৈনিক খরচ
            </p>
          </div>
        </div>

        {/* Card 4: মোট পাওনা (বকেয়া) */}
        <div className="bg-white rounded-2xl p-5 border border-[#E4EAE6] shadow-xs hover:border-red-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68776F]">
              কাস্টমারদের মোট বাকি (পাওনা)
            </span>
            <span className="w-9 h-9 rounded-xl bg-red-50 text-[#D64545] flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-[#D64545]">
              {formatCurrency(totalDue, profile.useBengaliDigits)}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-[#68776F]">বাকি আদায় করুন</span>
              <button
                onClick={() => setActiveTab("dues")}
                className="font-semibold text-[#116149] hover:underline flex items-center"
              >
                আদায় খাতা →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Expenses Chart (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E4EAE6] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#172B24]">
                বিক্রি ও খরচের চিত্র
              </h3>
              <p className="text-xs text-[#68776F] mt-0.5">
                দৈনিক লেনদেনের তুলনামূলক গ্রাফ
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex bg-[#F7F9FC] p-1 rounded-xl border border-[#E4EAE6] text-xs">
              <button
                onClick={() => setChartPeriod("7days")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartPeriod === "7days"
                    ? "bg-white text-[#116149] shadow-xs font-bold"
                    : "text-[#68776F] hover:text-[#172B24]"
                }`}
              >
                গত ৭ দিন
              </button>
              <button
                onClick={() => setChartPeriod("30days")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  chartPeriod === "30days"
                    ? "bg-white text-[#116149] shadow-xs font-bold"
                    : "text-[#68776F] hover:text-[#172B24]"
                }`}
              >
                গত ৩০ দিন
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization / Empty State */}
          {sales.length === 0 && expenses.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-b border-gray-200 bg-[#F7F9FC]/60 rounded-xl">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FAF5] text-[#116149] flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-[#16A574]" />
              </div>
              <h4 className="font-bold text-sm text-[#172B24]">দৈনিক লেনদেনের গ্রাফ চার্ট</h4>
              <p className="text-xs text-[#68776F] max-w-sm mt-1 leading-relaxed">
                এখানে আপনার ব্যবসার দৈনিক বিক্রি ও খরচের তুলনামূলক গ্রাফ প্রদর্শিত হবে। প্রথম বিক্রি সম্পন্ন করতে অথবা খরচের হিসাব রাখতে নিচের বোতামগুলো ব্যবহার করুন।
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setActiveTab("inventory")}
                  className="px-3.5 py-2 bg-white border border-[#E4EAE6] hover:bg-gray-50 text-[#172B24] rounded-xl text-xs font-semibold shadow-2xs"
                >
                  + পণ্য যোগ করুন
                </button>
                <button
                  onClick={() => setActiveTab("pos")}
                  className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  + নতুন বিক্রি শুরু করুন
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2 sm:gap-4 pt-4 border-b border-gray-200">
              {chartData.map((d, index) => {
                const salesHeight = Math.min(100, Math.round((d.sales / maxChartValue) * 100));
                const expHeight = Math.min(100, Math.round((d.expenses / maxChartValue) * 100));

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#172B24] text-white text-[10px] rounded-lg py-1 px-2 whitespace-nowrap z-20 pointer-events-none shadow-md">
                      <div>বিক্রি: {formatCurrency(d.sales, profile.useBengaliDigits)}</div>
                      <div>খরচ: {formatCurrency(d.expenses, profile.useBengaliDigits)}</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Sales Bar (Green) */}
                      <div
                        style={{ height: `${Math.max(4, salesHeight)}%` }}
                        className="w-1/2 max-w-[14px] bg-[#16A574] rounded-t-md transition-all duration-300 group-hover:bg-[#116149]"
                      />
                      {/* Expense Bar (Amber/Red) */}
                      <div
                        style={{ height: `${Math.max(4, expHeight)}%` }}
                        className="w-1/2 max-w-[14px] bg-[#D98A12] rounded-t-md transition-all duration-300 group-hover:bg-amber-600"
                      />
                    </div>

                    <span className="text-[10px] text-[#68776F] mt-2 truncate w-full text-center">
                      {d.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#16A574]" />
              <span className="text-[#172B24]">বিক্রি</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D98A12]" />
              <span className="text-[#172B24]">খরচ</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products Performance (1 column) */}
        <div className="bg-white rounded-2xl p-6 border border-[#E4EAE6] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#172B24]">
                  সবচেয়ে বেশি বিক্রি হওয়া পণ্য
                </h3>
                <p className="text-xs text-[#68776F] mt-0.5">সেরা ৫টি পণ্য</p>
              </div>
              <button
                onClick={() => setActiveTab("reports")}
                className="text-xs font-semibold text-[#116149] hover:underline"
              >
                সব দেখুন
              </button>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#68776F]">
                এখনও কোনো বিক্রয় তথ্য নেই
              </div>
            ) : (
              <div className="space-y-3.5">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#172B24] truncate pr-2">
                        {toBengaliNumber(idx + 1)}. {p.name}
                      </span>
                      <span className="text-[#116149] font-bold whitespace-nowrap">
                        {toBengaliNumber(p.quantity)} {p.unit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#16A574] h-full rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (p.quantity / (topProducts[0]?.quantity || 1)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E4EAE6] flex items-center justify-between">
            <span className="text-xs text-[#68776F]">মোট সক্রিয় পণ্য:</span>
            <span className="text-xs font-bold text-[#172B24]">
              {toBengaliNumber(products.filter((p) => p.isActive).length)}টি
            </span>
          </div>
        </div>
      </div>

      {/* 5. Quick Actions Grid */}
      <div>
        <h3 className="text-base font-bold text-[#172B24] mb-3">
          দ্রুত করণীয় কাজসমূহ
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab("pos")}
            className="p-4 bg-white rounded-2xl border border-[#E4EAE6] hover:border-[#16A574] hover:shadow-sm text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#116149] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#172B24]">নতুন বিক্রি</h4>
            <p className="text-[11px] text-[#68776F] mt-0.5">কাউন্টারে বিক্রি করুন</p>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className="p-4 bg-white rounded-2xl border border-[#E4EAE6] hover:border-[#16A574] hover:shadow-sm text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3976D8] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#172B24]">পণ্য যোগ করুন</h4>
            <p className="text-[11px] text-[#68776F] mt-0.5">নতুন স্টক এন্ট্রি</p>
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className="p-4 bg-white rounded-2xl border border-[#E4EAE6] hover:border-[#16A574] hover:shadow-sm text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D98A12] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#172B24]">খরচ যোগ করুন</h4>
            <p className="text-[11px] text-[#68776F] mt-0.5">দোকানের ব্যয় লিখুন</p>
          </button>

          <button
            onClick={() => setActiveTab("dues")}
            className="p-4 bg-white rounded-2xl border border-[#E4EAE6] hover:border-[#16A574] hover:shadow-sm text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#D64545] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#172B24]">বাকি আদায়</h4>
            <p className="text-[11px] text-[#68776F] mt-0.5">পাওনা টাকা জমা</p>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className="p-4 bg-white rounded-2xl border border-[#E4EAE6] hover:border-[#16A574] hover:shadow-sm text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#172B24]">রিপোর্ট দেখুন</h4>
            <p className="text-[11px] text-[#68776F] mt-0.5">মাসিক লাভ-ক্ষতি</p>
          </button>

          <button
            onClick={() => setActiveTab("ai_assistant")}
            className="p-4 bg-linear-to-br from-emerald-500 to-teal-700 text-white rounded-2xl shadow-xs hover:shadow-md text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">AI পরামর্শ নিন</h4>
            <p className="text-[11px] text-white/80 mt-0.5">ব্যবসার বুদ্ধিমান গাইড</p>
          </button>
        </div>
      </div>

      {/* 6. Recent Sales Activity */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E4EAE6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#172B24]">
              সর্বশেষ বিক্রয়সমূহ
            </h3>
            <p className="text-xs text-[#68776F] mt-0.5">
              সাম্প্রতিক সম্পন্ন হওয়া লেনদেনের তালিকা
            </p>
          </div>
          <button
            onClick={() => setActiveTab("sales_history")}
            className="text-xs font-semibold text-[#116149] hover:underline flex items-center gap-1"
          >
            সম্পূর্ণ ইতিহাস →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#68776F] border-b border-[#E4EAE6]">
              <tr>
                <th className="py-3 px-4 font-semibold">রসিদ নং</th>
                <th className="py-3 px-4 font-semibold">ক্রেতার নাম</th>
                <th className="py-3 px-4 font-semibold">তারিখ</th>
                <th className="py-3 px-4 font-semibold">পণ্য সংখ্যা</th>
                <th className="py-3 px-4 font-semibold">মোট মূল্য</th>
                <th className="py-3 px-4 font-semibold">পরিশোধের অবস্থা</th>
                <th className="py-3 px-4 font-semibold text-right">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#68776F]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-semibold text-sm text-[#172B24]">এখনও কোনো বিক্রির রেকর্ড নেই</p>
                      <p className="text-xs text-[#68776F]">দোকানের নতুন বিক্রি হিসাব করতে নিচের বোতামে চাপুন।</p>
                      <button
                        onClick={() => setActiveTab("pos")}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        প্রথম বিক্রি শুরু করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#116149]">
                      {sale.receiptNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#172B24]">
                      {sale.customerName || "সাধারণ ক্রেতা"}
                    </td>
                    <td className="py-3 px-4 text-[#68776F]">
                      {formatBengaliDate(sale.date, true, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4 text-[#172B24]">
                      {toBengaliNumber(sale.items.length)}টি আইটেম
                    </td>
                    <td className="py-3 px-4 font-bold text-[#172B24]">
                      {formatCurrency(sale.grandTotal, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3 px-4">
                      {sale.paymentStatus === "পরিশোধিত" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F0FAF5] text-[#16834A]">
                          <CheckCircle2 className="w-3 h-3" />
                          পরিশোধিত
                        </span>
                      ) : sale.paymentStatus === "আংশিক" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800">
                          <Clock className="w-3 h-3" />
                          আংশিক (বাকি ৳{sale.dueAmount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          বাকি (৳{sale.dueAmount})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        className="p-1.5 text-[#116149] hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1 font-medium"
                        title="রসিদ দেখুন"
                      >
                        <FileText className="w-4 h-4" />
                        রসিদ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Receipt Modal */}
      <ReceiptModal
        sale={selectedSaleForReceipt}
        profile={profile}
        isOpen={Boolean(selectedSaleForReceipt)}
        onClose={() => setSelectedSaleForReceipt(null)}
      />
    </div>
  );
};
