import React, { useState, useRef, useEffect, useMemo } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { AIChatMessage } from "../../types";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Package,
  AlertTriangle,
  Receipt,
  RotateCcw,
  User,
  Lightbulb,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  { text: "এই মাসে আমার লাভ কত?", icon: TrendingUp },
  { text: "কোন পণ্যগুলো সবচেয়ে বেশি বিক্রি হচ্ছে?", icon: Package },
  { text: "কোন পণ্যের স্টক কমে এসেছে?", icon: AlertTriangle },
  { text: "আমার খরচের বড় অংশ কোথায় হচ্ছে?", icon: Receipt },
  { text: "কীভাবে ব্যবসার খরচ কমাতে পারি?", icon: Lightbulb },
  { text: "আগামী সপ্তাহের জন্য কী পরিকল্পনা করা উচিত?", icon: Sparkles },
  { text: "ফেসবুকের জন্য আকর্ষণীয় পণ্যের বিজ্ঞাপন পোস্ট লিখে দাও", icon: HelpCircle },
];

export const AiAssistant: React.FC = () => {
  const {
    profile,
    todaySales,
    todayExpenses,
    todayProfit,
    totalDue,
    products,
    sales,
    expenses,
    lowStockItems,
  } = useBusiness();

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "assistant",
      text: `আসসালামু আলাইকুম, **${profile.ownerName || "সম্মানিত ব্যবসায়ী"}**! আপনার **${profile.businessName}**-এর হিসাব-নিকাশ বিশ্লেষণ করতে, লাভ বাড়াতে এবং ব্যবসা প্রসারের সুযোগ খুঁজতে আমি সর্বদা প্রস্তুত। নিচের যেকোনো বিষয়ে প্রশ্ন করতে পারেন অথবা নিজের প্রশ্নটি লিখুন।`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Compute this month's stats for context
  const thisMonthStr = new Date().toISOString().substring(0, 7);
  const monthSales = useMemo(() => {
    return sales
      .filter((s) => !s.isVoided && s.date.startsWith(thisMonthStr))
      .reduce((sum, s) => sum + s.grandTotal, 0);
  }, [sales, thisMonthStr]);

  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(thisMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, thisMonthStr]);

  const monthProfit = useMemo(() => {
    let rev = 0;
    let cost = 0;
    for (const s of sales) {
      if (s.isVoided || !s.date.startsWith(thisMonthStr)) continue;
      rev += s.grandTotal;
      for (const item of s.items) {
        cost += (item.costPrice || 0) * item.quantity;
      }
    }
    return Math.max(0, rev - cost - monthExpenses);
  }, [sales, monthExpenses, thisMonthStr]);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sales) {
      if (s.isVoided) continue;
      for (const i of s.items) {
        map[i.productName] = (map[i.productName] || 0) + i.quantity;
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => `${name} (${qty} বিক্রি)`);
  }, [sales]);

  const topExpenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat} (৳${amt})`);
  }, [expenses]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const userPrompt = (textToSend || inputValue).trim();
    if (!userPrompt || isLoading) return;

    const userMessage: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "user",
      text: userPrompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Prepare authorized anonymous business summary for context
    const businessContext = {
      businessName: profile.businessName,
      businessType: profile.businessType,
      currency: "৳",
      todaySales,
      todayExpenses,
      todayProfit,
      monthSales,
      monthExpenses,
      monthProfit,
      totalDue,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.map((p) => `${p.name} (বাকি: ${p.stock} ${p.unit})`),
      topProducts,
      topExpenseCategories,
      totalProductsCount: products.filter((p) => p.isActive).length,
    };

    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userPrompt,
          businessContext,
        }),
      });

      const data = await response.json();

      const aiReplyMessage: AIChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "assistant",
        text: data.reply || "দুঃখিত, কোনো উত্তর প্রস্তুত করা সম্ভব হয়নি।",
        timestamp: new Date().toISOString(),
        isLiveAI: data.isLiveAI,
        notice: data.notice,
      };

      setMessages((prev) => [...prev, aiReplyMessage]);
    } catch (err) {
      console.error("AI Assistant request error:", err);
      const fallbackReply: AIChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        sender: "assistant",
        text: `দুঃখিত, সংযোগে কিছুটা সমস্যা হয়েছে। তবে আপনার দোকানের বর্তমান মোট বিক্রয় ৳ ${monthSales.toLocaleString()} এবং বকেয়া পাওনা ৳ ${totalDue.toLocaleString()}। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।`,
        timestamp: new Date().toISOString(),
        isLiveAI: false,
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "msg-welcome-reset",
        sender: "assistant",
        text: `আসসালামু আলাইকুম! আপনার **${profile.businessName}**-এর নতুন সেশন শুরু হয়েছে। কী বিষয়ে জানতে চান বলুন?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="space-y-4 pb-12 flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E4EAE6]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#16A574]" />
            AI ব্যবসা সহকারী ও পরামর্শক
          </h1>
          <p className="text-xs text-[#68776F] mt-0.5">
            আপনার দোকানের আসল হিসাবের ওপর ভিত্তি করে বুদ্ধিমান পরামর্শ ও পরিকল্পনা
          </p>
        </div>

        <button
          onClick={resetChat}
          className="px-3 py-1.5 text-xs text-[#68776F] hover:text-[#172B24] hover:bg-gray-100 border border-[#E4EAE6] rounded-xl flex items-center gap-1 transition-colors"
          title="নতুন চ্যাট শুরু করুন"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          রিসেট
        </button>
      </div>

      {/* Example Prompt Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {EXAMPLE_PROMPTS.map((prompt, index) => {
          const Icon = prompt.icon;
          return (
            <button
              key={index}
              onClick={() => handleSendMessage(prompt.text)}
              className="px-3 py-2 bg-white hover:bg-emerald-50 border border-[#E4EAE6] hover:border-[#16A574] rounded-xl text-xs font-medium text-[#172B24] whitespace-nowrap flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 shrink-0"
            >
              <Icon className="w-3.5 h-3.5 text-[#16A574]" />
              {prompt.text}
            </button>
          );
        })}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-[#116149] text-white"
                    : "bg-linear-to-br from-emerald-500 to-teal-700 text-white shadow-xs"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#116149] text-white rounded-tr-none font-medium"
                    : "bg-[#F7F9FC] text-[#172B24] border border-[#E4EAE6] rounded-tl-none space-y-2"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {!isUser && msg.notice && (
                  <div className="text-[10px] text-[#68776F] pt-2 border-t border-gray-200/80">
                    ℹ️ {msg.notice}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 bg-[#F7F9FC] border border-[#E4EAE6] rounded-2xl rounded-tl-none text-xs text-[#68776F] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A574] animate-ping" />
              আপনার দোকানের তথ্যাদি বিশ্লেষণ করা হচ্ছে...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 rounded-2xl border border-[#E4EAE6] shadow-xs flex items-center gap-2">
        <input
          type="text"
          placeholder="আপনার ব্যবসার যেকোনো বিষয়ে প্রশ্ন করুন (যেমন: লাভ বাড়াব কীভাবে?)..."
          value={inputValue}
          disabled={isLoading}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-[#172B24] placeholder:text-gray-400 focus:outline-hidden"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isLoading}
          className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition-all ${
            !inputValue.trim() || isLoading
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-[#116149] hover:bg-[#0d4f3b] text-white shadow-xs active:scale-95"
          }`}
          aria-label="বার্তা পাঠান"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
