import React, { useState, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { Expense, ExpenseCategory } from "../../types";
import { formatCurrency, formatBengaliDate, toBengaliNumber } from "../../utils/bengali";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Edit2,
  Trash2,
  PieChart,
  Wallet,
  X,
  CreditCard,
  Banknote,
} from "lucide-react";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "দোকান ভাড়া",
  "বিদ্যুৎ ও ইউটিলিটি",
  "পরিবহন",
  "কর্মচারীর বেতন",
  "পণ্য পরিবহন ও সরাসরি খরচ",
  "প্যাকেজিং",
  "মার্কেটিং ও বিজ্ঞাপন",
  "আপ্যায়ন ও বিবিধ",
  "অন্যান্য",
];

export const Expenses: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, profile } = useBusiness();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সব");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("অন্যান্য");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formMethod, setFormMethod] = useState<"নগদ" | "বিকাশ" | "ব্যাংক" | "অন্যান্য">("নগদ");
  const [formNotes, setFormNotes] = useState("");

  // Monthly & Daily Aggregations
  const todayStr = new Date().toISOString().split("T")[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const todayTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const monthTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(thisMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, thisMonthStr]);

  // Category breakdown for visualization
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      if (exp.date.startsWith(thisMonthStr)) {
        map[exp.category] = (map[exp.category] || 0) + exp.amount;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses, thisMonthStr]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat = selectedCategory === "সব" || e.category === selectedCategory;
      const matchDate = !dateFilter || e.date === dateFilter;

      return matchSearch && matchCat && matchDate;
    });
  }, [expenses, searchQuery, selectedCategory, dateFilter]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormTitle("");
    setFormCategory("আপ্যায়ন ও বিবিধ");
    setFormAmount(0);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormMethod("নগদ");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormTitle(exp.title);
    setFormCategory(exp.category);
    setFormAmount(exp.amount);
    setFormDate(exp.date);
    setFormMethod(exp.paymentMethod);
    setFormNotes(exp.notes || "");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || Number(formAmount) <= 0) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        title: formTitle.trim(),
        category: formCategory,
        amount: Number(formAmount),
        date: formDate,
        paymentMethod: formMethod,
        notes: formNotes.trim() || undefined,
      });
    } else {
      addExpense({
        title: formTitle.trim(),
        category: formCategory,
        amount: Number(formAmount),
        date: formDate,
        paymentMethod: formMethod,
        notes: formNotes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ["বিবরণ,খরচের খাত,টাকার পরিমাণ,তারিখ,পরিশোধের মাধ্যম,নোট"];
    const rows = filteredExpenses.map((e) =>
      [
        `"${e.title}"`,
        `"${e.category}"`,
        e.amount,
        e.date,
        e.paymentMethod,
        `"${e.notes || ""}"`,
      ].join(",")
    );

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `খরচের_হিসাব_${new Date().toISOString().split("T")[0]}.csv`);
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
            <Receipt className="w-6 h-6 text-[#D98A12]" />
            দৈনিক ও মাসিক খরচের হিসাব
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            দোকান পরিচালনা, কর্মচারী, ইউটিলিটি ও অন্যান্য ব্যয়ের নির্ভুল ট্র্যাকিং
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
            onClick={openAddModal}
            className="px-4 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            নতুন খরচ যোগ
          </button>
        </div>
      </div>

      {/* Summary Cards and Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Expense */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68776F]">আজকের মোট খরচ</span>
            <span className="p-2 rounded-xl bg-amber-50 text-[#D98A12]">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#172B24] mt-2">
            {formatCurrency(todayTotal, profile.useBengaliDigits)}
          </h3>
          <p className="text-[11px] text-[#68776F] mt-1">
            আজ রেকর্ড করা খুচরা ও সরাসরি ব্যয়
          </p>
        </div>

        {/* This Month's Expense */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#68776F]">চলতি মাসের মোট খরচ</span>
            <span className="p-2 rounded-xl bg-red-50 text-[#D64545]">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-[#D64545] mt-2">
            {formatCurrency(monthTotal, profile.useBengaliDigits)}
          </h3>
          <p className="text-[11px] text-[#68776F] mt-1">ভাড়া, বেতন ও চলতি মাসের বিলসমূহ</p>
        </div>

        {/* Top Expense Categories Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4EAE6] shadow-xs">
          <span className="text-xs font-semibold text-[#68776F] block mb-2">
            চলতি মাসের প্রধান ব্যয়ের খাত
          </span>
          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-[#68776F] py-2">এখনও কোনো খরচ রেকর্ড হয়নি</p>
          ) : (
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {categoryBreakdown.slice(0, 3).map(([cat, amt]) => {
                const pct = monthTotal > 0 ? Math.round((amt / monthTotal) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs">
                    <span className="text-[#172B24] truncate">{cat}</span>
                    <span className="font-bold text-[#D98A12] whitespace-nowrap">
                      {formatCurrency(amt, profile.useBengaliDigits)} ({toBengaliNumber(pct)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4EAE6] shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="খরচের বিবরণ বা নোট দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-[#16A574]"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:outline-hidden"
          >
            <option value="সব">সব খাত</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs font-medium focus:outline-hidden"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
              title="তারিখ ফিল্টার মুছুন"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] text-[#68776F] border-b border-[#E4EAE6]">
              <tr>
                <th className="py-3 px-4 font-semibold">তারিখ</th>
                <th className="py-3 px-4 font-semibold">খরচের বিবরণ</th>
                <th className="py-3 px-4 font-semibold">খাত / বিভাগ</th>
                <th className="py-3 px-4 font-semibold">টাকার পরিমাণ</th>
                <th className="py-3 px-4 font-semibold">পরিশোধের মাধ্যম</th>
                <th className="py-3 px-4 font-semibold">নোট / রেফারেন্স</th>
                <th className="py-3 px-4 font-semibold text-right">পদক্ষেপ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#68776F]">
                    কোনো খরচের হিসাব পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-[#68776F] whitespace-nowrap">
                      {formatBengaliDate(exp.date, false, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#172B24]">{exp.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-[#172B24]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#D64545] text-sm">
                      {formatCurrency(exp.amount, profile.useBengaliDigits)}
                    </td>
                    <td className="py-3.5 px-4 text-[#68776F]">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-[#68776F] max-w-xs truncate">
                      {exp.notes || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 text-gray-500 hover:text-[#116149] hover:bg-gray-100 rounded-lg transition-colors"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`আপনি কি "${exp.title}" খরচটি মুছে ফেলতে চান?`)) {
                              deleteExpense(exp.id);
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#172B24]">
                {editingExpense ? "খরচ সম্পাদনা" : "নতুন খরচ যোগ করুন"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">খরচের বিবরণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: দোকানের চলতি মাসের বিদ্যুৎ বিল"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">খরচের খাত *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount || ""}
                    placeholder="০"
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-[#D64545] text-sm focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">পরিশোধের মাধ্যম</label>
                  <select
                    value={formMethod}
                    onChange={(e) =>
                      setFormMethod(e.target.value as "নগদ" | "বিকাশ" | "ব্যাংক" | "অন্যান্য")
                    }
                    className="w-full px-3 py-2 border rounded-xl focus:border-[#16A574] focus:outline-hidden"
                  >
                    <option value="নগদ">নগদ</option>
                    <option value="বিকাশ">বিকাশ/নগদ</option>
                    <option value="ব্যাংক">ব্যাংক</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">নোট / বিস্তারিত তথ্য (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  placeholder="যেমন: ভাউচার নং / চেকের বিবরণ"
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
    </div>
  );
};
