import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { BrandMark, BrandLogo } from "../common/BrandLogo";
import { UserRole } from "../../types";
import {
  Lock,
  Mail,
  User,
  Store,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, register, loginAsRole } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (!result.success) {
          setErrorMessage(result.error || "লগইন ব্যর্থ হয়েছে।");
        }
      } else {
        const result = await register(
          name,
          email,
          password,
          role === "admin" ? businessName : undefined,
          role,
          phone
        );
        if (!result.success) {
          setErrorMessage(result.error || "নিবন্ধন ব্যর্থ হয়েছে।");
        }
      }
    } catch {
      setErrorMessage("একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoCreds = (type: "admin" | "customer") => {
    if (type === "admin") {
      setEmail("saikatailearning26000424@gmail.com");
      setPassword("password123");
      setRole("admin");
    } else {
      setEmail("customer@example.com");
      setPassword("123456");
      setRole("customer");
    }
    setMode("login");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F0FAF5] via-[#F7F9FC] to-[#E9F3EE] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-[#E4EAE6] overflow-hidden grid grid-cols-1 md:grid-cols-12 my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Left Side: Brand Presentation (5 cols on md) */}
        <div className="md:col-span-5 bg-linear-to-br from-[#116149] to-[#16A574] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-4 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              স্মার্ট ব্যবসায়িক প্ল্যাটফর্ম ও কাস্টমার শপ
            </div>

            <div className="flex items-center gap-3.5">
              <BrandMark size="lg" variant="white" animated={true} />
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none text-white">
                  আমার ব্যবসা <span className="text-xs font-black px-1.5 py-0.5 rounded-md bg-white/20 text-white border border-white/30 align-middle">AI</span>
                </h1>
                <span className="text-xs font-bold tracking-wider text-emerald-50 block mt-1.5 drop-shadow-xs font-['Outfit',sans-serif]">
                  Made by Saikat
                </span>
              </div>
            </div>

            <p className="text-xs text-white/90 mt-4 leading-relaxed font-normal">
              “দোকানদারের পূর্ণ নিয়ন্ত্রণ ও হিসাব, এবং কাস্টমারের জন্য সহজ অনলাইন কেনাকাটা।”
            </p>

            {/* Core Pillars */}
            <div className="space-y-3 mt-8 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </span>
                <span>👑 অ্যাডমিন মোড: সম্পূর্ণ হিসাব, স্টক ও ক্যাটালগ নিয়ন্ত্রণ</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                </span>
                <span>🛍️ কাস্টমার মোড: পণ্য দেখা, দাম জানা ও অনলাইন অর্ডার</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-white" />
                </span>
                <span>🌸 বাংলাদেশি পেমেন্ট: বিকাশ, নগদ, রকেট ও ক্যাশ অন ডেলিভারি</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 text-[11px] text-emerald-100 flex items-center justify-between">
            <span>সম্পূর্ণ বাংলায় নির্মিত।</span>
            <span className="font-semibold text-white">Made by Saikat</span>
          </div>
        </div>

        {/* Right Side: Login & Registration Form (7 cols on md) */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            {/* Mobile Header Brand Logo */}
            <div className="md:hidden flex justify-center mb-6">
              <BrandLogo size="md" />
            </div>

            {/* One-Click Quick Access as Customer Banner */}
            <div className="mb-5 p-3 rounded-2xl bg-[#F0FAF5] border border-emerald-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-[#116149] block">
                  🛍️ সরাসরি কেনাকাটা করতে চান?
                </span>
                <span className="text-[11px] text-[#68776F]">
                  কাস্টমার হিসেবে দোকানের পণ্য ও দাম দেখতে এক ক্লিকে প্রবেশ করুন
                </span>
              </div>
              <button
                type="button"
                onClick={() => loginAsRole("customer")}
                className="px-3 py-2 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold whitespace-nowrap shadow-xs transition-all active:scale-95"
              >
                কাস্টমার ভিউ →
              </button>
            </div>

            {/* Mode Switch Tabs (Login vs Register) */}
            <div className="flex bg-[#F7F9FC] p-1 rounded-2xl border border-[#E4EAE6] text-xs font-semibold mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  mode === "login"
                    ? "bg-white text-[#116149] shadow-xs font-bold"
                    : "text-[#68776F] hover:text-[#172B24]"
                }`}
              >
                লগইন করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  mode === "register"
                    ? "bg-white text-[#116149] shadow-xs font-bold"
                    : "text-[#68776F] hover:text-[#172B24]"
                }`}
              >
                নতুন অ্যাকাউন্ট খুলুন
              </button>
            </div>

            {/* Role Switcher Pill */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-[#68776F] uppercase block mb-1.5">
                {mode === "login" ? "অ্যাকাউন্টের ধরন:" : "নিবন্ধন করতে চান:"}
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    role === "admin"
                      ? "border-[#116149] bg-emerald-50 text-[#116149] ring-1 ring-[#116149] shadow-2xs"
                      : "border-[#E4EAE6] bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>👑 দোকানদার / অ্যাডমিন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                    role === "customer"
                      ? "border-[#116149] bg-emerald-50 text-[#116149] ring-1 ring-[#116149] shadow-2xs"
                      : "border-[#E4EAE6] bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span>🛍️ ক্রেতা / কাস্টমার</span>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#172B24]">
                {mode === "login"
                  ? role === "admin"
                    ? "👑 অ্যাডমিন ড্যাশবোর্ডে প্রবেশ"
                    : "🛍️ কাস্টমার অ্যাকাউন্টে প্রবেশ"
                  : role === "admin"
                  ? "নতুন দোকানদার অ্যাকাউন্ট তৈরি"
                  : "নতুন কাস্টমার অ্যাকাউন্ট তৈরি"}
              </h2>
              <p className="text-xs text-[#68776F] mt-1">
                {role === "admin"
                  ? "দোকানের বিক্রি, স্টক, খরচ, বাকি খাতা ও ক্যাটালগ নিয়ন্ত্রণ করতে লগইন করুন"
                  : "দোকানের পণ্য সামগ্রী দেখতে, মূল্য জানতে ও অর্ডার করতে লগইন করুন"}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
              {mode === "register" && (
                <>
                  <div>
                    <label className="font-semibold block mb-1 text-[#172B24]">
                      আপনার পূর্ণ নাম *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="যেমন: সাইকত আহমেদ"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  {role === "admin" && (
                    <div>
                      <label className="font-semibold block mb-1 text-[#172B24]">
                        দোকানের নাম *
                      </label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="যেমন: আমার ব্যবসা স্টোর"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold block mb-1 text-[#172B24]">
                      মোবাইল নম্বর (ঐচ্ছিক)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="০১৭xxxxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="font-semibold block mb-1 text-[#172B24]">
                  ইমেইল ঠিকানা *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172B24]">
                  পাসওয়ার্ড *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#68776F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full mt-2 py-3 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                  isSubmitting ? "opacity-75 cursor-wait" : ""
                }`}
              >
                {mode === "login"
                  ? role === "admin"
                    ? "অ্যাডমিন হিসেবে লগইন করুন"
                    : "কাস্টমার হিসেবে লগইন করুন"
                  : "অ্যাকাউন্ট তৈরি ও শুরু করুন"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-4 border-t border-[#E4EAE6] space-y-2">
            <span className="text-[11px] font-semibold text-[#68776F] block">
              পরীক্ষার জন্য তাৎক্ষণিক ডেমো অ্যাকাউন্ট:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemoCreds("admin")}
                className="px-2.5 py-1.5 bg-[#F0FAF5] hover:bg-emerald-100 text-[#116149] border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                👑 অ্যাডমিন: saikatailearning26000424@gmail.com
              </button>
              <button
                type="button"
                onClick={() => handleFillDemoCreds("customer")}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
              >
                🛍️ কাস্টমার: customer@example.com (123456)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
