import React, { useState, useRef } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import { BusinessCategory } from "../../types";
import {
  Settings as SettingsIcon,
  Store,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileJson,
  User,
  LogOut,
} from "lucide-react";

const BUSINESS_CATEGORIES: BusinessCategory[] = [
  "মুদি দোকান",
  "কাপড়ের দোকান",
  "কসমেটিকস",
  "ইলেকট্রনিকস",
  "অনলাইন ব্যবসা",
  "ফেসবুকভিত্তিক ব্যবসা",
  "হোম বিজনেস",
  "ফার্মেসি ও ঔষধ",
  "অন্যান্য",
];

export const Settings: React.FC = () => {
  const {
    profile,
    updateProfile,
    resetToDemoData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
  } = useBusiness();
  const { user, openLogoutConfirm } = useAuth();

  const [formName, setFormName] = useState(profile.businessName);
  const [formType, setFormType] = useState<BusinessCategory>(profile.businessType);
  const [formOwner, setFormOwner] = useState(profile.ownerName);
  const [formPhone, setFormPhone] = useState(profile.phone);
  const [formAddress, setFormAddress] = useState(profile.address);
  const [formTagline, setFormTagline] = useState(profile.tagline);
  const [formFooter, setFormFooter] = useState(profile.receiptFooter);
  const [formThreshold, setFormThreshold] = useState(profile.lowStockDefaultThreshold || 5);
  const [formBengaliDigits, setFormBengaliDigits] = useState(profile.useBengaliDigits);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      businessName: formName.trim(),
      businessType: formType,
      ownerName: formOwner.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      tagline: formTagline.trim(),
      receiptFooter: formFooter.trim(),
      lowStockDefaultThreshold: Number(formThreshold),
      useBengaliDigits: formBengaliDigits,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `আমার_ব্যবসা_ব্যাকআপ_${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataJSON(content);
        if (success) {
          alert("সফলভাবে ব্যাকআপ পুনরুদ্ধার করা হয়েছে!");
        } else {
          alert("ব্যাকআপ ফাইলটি সঠিক নয়। অনুগ্রহ করে সঠিক JSON ফাইল নির্বাচন করুন।");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[#16A574]" />
          দোকানের প্রোফাইল ও সেটিংস
        </h1>
        <p className="text-xs text-[#68776F] mt-0.5">
          ব্যবসার সাধারণ তথ্য, রসিদ সেটিংস এবং ডেটা ব্যাকআপ ও রিসেট পরিচালনা
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#116149] animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A574]" />
          প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-6 space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E4EAE6]">
          <Store className="w-5 h-5 text-[#116149]" />
          <h2 className="font-bold text-base text-[#172B24]">ব্যবসার মৌলিক প্রোফাইল</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1 text-[#172B24]">
                দোকান বা ব্যবসার নাম *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172B24]">
                ব্যবসার ধরন / ক্যাটাগরি
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as BusinessCategory)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
              >
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1 text-[#172B24]">
                স্বত্বাধিকারী / মালিকের নাম
              </label>
              <input
                type="text"
                value={formOwner}
                onChange={(e) => setFormOwner(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172B24]">
                মোবাইল নম্বর
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-[#172B24]">
              দোকানের সম্পূর্ণ ঠিকানা
            </label>
            <input
              type="text"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1 text-[#172B24]">
                ট্যাগলাইন বা স্লোগান (রসিদে প্রদর্শিত)
              </label>
              <input
                type="text"
                value={formTagline}
                onChange={(e) => setFormTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[#172B24]">
                রসিদের নিচের ধন্যবাদ বার্তা
              </label>
              <input
                type="text"
                value={formFooter}
                onChange={(e) => setFormFooter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9FC] border border-[#E4EAE6] rounded-xl focus:border-[#16A574] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="pt-4 border-t border-[#E4EAE6] space-y-3">
            <h3 className="font-bold text-sm text-[#172B24]">পছন্দ ও প্রদর্শন সেটিংস</h3>

            <div className="flex items-center justify-between p-3.5 bg-[#F7F9FC] rounded-xl border border-[#E4EAE6]">
              <div>
                <span className="font-semibold text-[#172B24] block">
                  বাংলা সংখ্যায় হিসাব প্রদর্শন (যেমন: ৳ ১২,৫০০)
                </span>
                <span className="text-[11px] text-[#68776F]">
                  নিষ্ক্রিয় থাকলে ইংরেজি সংখ্যায় (৳ 12,500) প্রদর্শিত হবে
                </span>
              </div>
              <input
                type="checkbox"
                checked={formBengaliDigits}
                onChange={(e) => setFormBengaliDigits(e.target.checked)}
                className="w-5 h-5 accent-[#116149] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F7F9FC] rounded-xl border border-[#E4EAE6]">
              <div>
                <span className="font-semibold text-[#172B24] block">
                  ডিফল্ট কম স্টক সতর্কতা সীমা
                </span>
                <span className="text-[11px] text-[#68776F]">
                  কোনো পণ্যের মজুদ এই সংখ্যার নিচে নামলে সতর্কতা দেখাবে
                </span>
              </div>
              <input
                type="number"
                min="1"
                value={formThreshold}
                onChange={(e) => setFormThreshold(Number(e.target.value))}
                className="w-20 px-2 py-1 text-center bg-white border border-[#E4EAE6] rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl font-bold shadow-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              সেটিংস সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>

      {/* Backup and Restore Section */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E4EAE6]">
          <FileJson className="w-5 h-5 text-[#3976D8]" />
          <h2 className="font-bold text-base text-[#172B24]">
            ডেটা ব্যাকআপ ও রিস্টোর (JSON)
          </h2>
        </div>

        <p className="text-xs text-[#68776F] leading-relaxed">
          আপনার ব্যবসার সমস্ত পণ্য, কাস্টমার, বিক্রয় এবং খরচের পূর্ণাঙ্গ ফাইল ব্যাকআপ সংরক্ষণ করে
          রাখতে পারেন। পরবর্তীতে যেকোনো সময় তা ফিরিয়ে আনা সম্ভব।
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 bg-[#F0FAF5] hover:bg-emerald-100 text-[#116149] border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            সম্পূর্ণ ব্যাকআপ ডাউনলোড করুন
          </button>

          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleRestoreBackup}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-[#172B24] border border-[#E4EAE6] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-[#3976D8]" />
            ব্যাকআপ ফাইল রিস্টোর করুন
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-semibold text-[#116149] animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16A574]" />
          {actionNotice}
        </div>
      )}

      {/* User Account & Logout Section */}
      <div className="bg-white rounded-2xl border border-[#E4EAE6] shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E4EAE6]">
          <User className="w-5 h-5 text-[#116149]" />
          <h2 className="font-bold text-base text-[#172B24]">ব্যবহারকারী অ্যাকাউন্ট</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#F7F9FC] rounded-2xl border border-[#E4EAE6]">
          <div className="space-y-1">
            <p className="font-bold text-sm text-[#172B24]">{user?.name || "ব্যবহারকারী"}</p>
            <p className="text-xs text-[#68776F]">{user?.email || "ইমেইল নেই"}</p>
            <span className="inline-block text-[10px] font-semibold text-[#116149] bg-emerald-100 px-2 py-0.5 rounded-md mt-1">
              সক্রিয় সেশন
            </span>
          </div>

          <button
            type="button"
            onClick={openLogoutConfirm}
            className="self-start sm:self-auto px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            লগআউট করুন
          </button>
        </div>
      </div>

      {/* Demo Reset / Factory Clear Section */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-red-100">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="font-bold text-base text-[#172B24]">ডেটা রিসেট ও সতর্কতা</h2>
        </div>

        <p className="text-xs text-[#68776F] leading-relaxed">
          প্রয়োজন অনুযায়ী প্রেজেন্টেশনের জন্য আদর্শ নমুনা তথ্য লোড করতে পারেন, অথবা নতুন ব্যবসার
          জন্য সমস্ত রেকর্ড মুছে পরিষ্কার শুরু করতে পারেন।
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowDemoConfirm(true)}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            নমুনা তথ্য লোড করুন (Demo Data)
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            সব তথ্য মুছে পরিষ্কার শুরু করুন
          </button>
        </div>
      </div>

      {/* Demo Load Confirmation Modal */}
      {showDemoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#172B24]">নমুনা তথ্য লোড নিশ্চিতকরণ</h3>
              <p className="text-xs text-[#68776F]">
                মুদি ও ডিপার্টমেন্টাল স্টোরের নমুনা পণ্য ও বিক্রির হিসাব লোড করা হবে। আপনি কি এগিয়ে যেতে চান?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDemoConfirm(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#172B24] rounded-xl text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDemoConfirm(false);
                  resetToDemoData();
                  setActionNotice("নমুনা তথ্য সফলভাবে লোড করা হয়েছে!");
                  setTimeout(() => setActionNotice(null), 3000);
                }}
                className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95"
              >
                হ্যাঁ, লোড করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#172B24]">সব তথ্য মুছে ফেলা</h3>
              <p className="text-xs text-[#68776F]">
                সমস্ত পণ্য, বিক্রয়, খরচ ও কাস্টমার তালিকা মুছে একদম নতুন ফাঁকা হিসাব শুরু করা হবে।
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#172B24] rounded-xl text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  clearAllData();
                  setActionNotice("সমস্ত তথ্য সফলভাবে মুছে পরিষ্কার করা হয়েছে!");
                  setTimeout(() => setActionNotice(null), 3000);
                }}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
