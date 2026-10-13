import React, { useState } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { BrandMark } from "../common/BrandLogo";
import { BusinessCategory } from "../../types";
import {
  Store,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  CheckCircle,
  HelpCircle,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

const BUSINESS_CATEGORIES: { name: BusinessCategory; desc: string }[] = [
  { name: "মুদি দোকান", desc: "নিত্যপ্রয়োজনীয় খাদ্যসামগ্রী ও ডিপার্টমেন্টাল স্টোর" },
  { name: "কাপড়ের দোকান", desc: "পোশাক, থান কাপড়, শাড়ি ও তৈরি পোশাকের ব্যবসা" },
  { name: "কসমেটিকস", desc: "সৌন্দর্যবর্ধক সামগ্রী ও প্রসাধন সামগ্রীর শপ" },
  { name: "ইলেকট্রনিকস", desc: "বৈদ্যুতিক পণ্য, লাইট, বাল্ব ও গ্যাজেট" },
  { name: "অনলাইন ব্যবসা", desc: "ওয়েবসাইট ও ই-কমার্স প্ল্যাটফর্মভিত্তিক বিক্রয়" },
  { name: "ফেসবুকভিত্তিক ব্যবসা", desc: "এফ-কমার্স পেইজের মাধ্যমে অর্ডার ও ডেলিভারি" },
  { name: "হোম বিজনেস", desc: "বাসা থেকে পরিচালিত হস্তশিল্প, বেকিং ও ক্যাটারিং" },
  { name: "ফার্মেসি ও ঔষধ", desc: "ঔষধ ও স্বাস্থ্যসেবা সামগ্রীর দোকান" },
  { name: "অন্যান্য", desc: "যেকোনো ধরণের খুচরা বা পাইকারি ব্যবসা প্রতিষ্ঠান" },
];

import { useAuth } from "../../context/AuthContext";

export const Onboarding: React.FC = () => {
  const { profile, updateProfile, resetToDemoData, setActiveTab } = useBusiness();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);

  const [businessName, setBusinessName] = useState(
    profile.businessName || user?.businessName || ""
  );
  const [businessType, setBusinessType] = useState<BusinessCategory>(
    profile.businessType || "মুদি দোকান"
  );
  const [ownerName, setOwnerName] = useState(profile.ownerName || user?.name || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleCompleteSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) return;

    updateProfile({
      businessName: businessName.trim(),
      businessType,
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      startDate,
      isOnboarded: true,
    });

    setActiveTab("dashboard");
  };

  const handleStartWithDemo = () => {
    resetToDemoData();
    setActiveTab("dashboard");
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F0FAF5] via-[#F7F9FC] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#E4EAE6] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="p-8 bg-linear-to-r from-[#116149] to-[#16A574] text-white text-center relative overflow-hidden">
          <div className="flex justify-center mb-3">
            <BrandMark size="lg" variant="white" animated={true} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            সহজ • দ্রুত • নির্ভুল
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            আপনার ব্যবসাকে আরও স্মার্ট করে তুলুন
          </h1>
          <p className="text-sm text-white/90 mt-1.5 max-w-md mx-auto">
            “আপনার ব্যবসা, আপনার নিয়ন্ত্রণ—আরও সহজ, আরও স্মার্ট।”
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <div
              className={`h-2 rounded-full transition-all ${
                step === 1 ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                step === 2 ? "w-8 bg-white" : "w-2 bg-white/40"
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#172B24]">
                  ধাপ ১: আপনার ব্যবসার ধরন নির্বাচন করুন
                </h2>
                <p className="text-xs text-[#68776F] mt-0.5">
                  আপনার দোকানের সাথে সবচেয়ে মানানসই ক্যাটাগরিটি বেছে নিন
                </p>
              </div>

              {/* Category Radio Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {BUSINESS_CATEGORIES.map((cat) => {
                  const isSelected = businessType === cat.name;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setBusinessType(cat.name)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? "bg-[#F0FAF5] border-[#16A574] ring-2 ring-[#16A574]/30 shadow-xs"
                          : "bg-white border-[#E4EAE6] hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#116149] text-white"
                            : "bg-gray-100 text-[#68776F]"
                        }`}
                      >
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-[#172B24] truncate">
                          {cat.name}
                        </h4>
                        <p className="text-[11px] text-[#68776F] line-clamp-1 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E4EAE6] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleStartWithDemo}
                  className="text-xs font-semibold text-[#116149] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  নমুনা তথ্য দিয়ে ডেমো দেখুন
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  পরবর্তী ধাপ
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCompleteSetup} className="space-y-4 text-xs">
              <div>
                <h2 className="text-lg font-bold text-[#172B24]">
                  ধাপ ২: প্রতিষ্ঠানের প্রাথমিক তথ্য
                </h2>
                <p className="text-xs text-[#68776F] mt-0.5">
                  রসিদ ও মেমোতে প্রদর্শনের জন্য তথ্যগুলো পূরণ করুন (ঐচ্ছিক ক্ষেত্রগুলো পরে পরিবর্তন করা যাবে)
                </p>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172B24]">
                  ব্যবসার নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: বিসমিল্লাহ জেনারেল স্টোর"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-sm font-medium focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-[#172B24]">
                    মালিকের নাম (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="আপনার নাম"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[#172B24]">
                    মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="tel"
                    placeholder="০১৭১১-XXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[#172B24]">
                  দোকান / ব্যবসার ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: দোকান নং ১২, নিউ মার্কেট, ঢাকা"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs focus:border-[#16A574] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-[#172B24]">
                    ডিফল্ট মুদ্রা
                  </label>
                  <div className="px-3.5 py-2 bg-gray-100 rounded-xl font-bold text-[#116149]">
                    বাংলাদেশি টাকা (৳)
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-[#172B24]">
                    হিসাব শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl text-xs focus:border-[#16A574] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4EAE6] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border rounded-xl text-[#68776F] font-semibold hover:bg-gray-50"
                >
                  পূর্ববর্তী ধাপ
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <CheckCircle className="w-4 h-4 text-[#16A574]" />
                  ব্যবসা শুরু করুন
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
