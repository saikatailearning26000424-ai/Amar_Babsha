import React, { useState } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import { BrandMark } from "../common/BrandLogo";
import { formatBengaliDate, getBengaliGreeting } from "../../utils/bengali";
import {
  Menu,
  Bell,
  ShoppingCart,
  Plus,
  Check,
  Package,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  LogOut,
  User,
  ExternalLink,
} from "lucide-react";
import { ActiveTab } from "../../types";

interface NavbarProps {
  onToggleMobileSidebar: () => void;
}

const tabTitles: Record<ActiveTab, string> = {
  setup: "ব্যবসা সেটআপ ও স্বাগতম",
  dashboard: "ব্যবসায়িক ড্যাশবোর্ড",
  pos: "নতুন বিক্রির হিসাব (POS কাউন্টার)",
  sales_history: "বিক্রির ইতিহাস ও রেকর্ড",
  inventory: "পণ্য ও স্টক ব্যবস্থাপনা",
  catalog_manager: "কাস্টমার ক্যাটালগ ও অনলাইন অর্ডার",
  expenses: "দৈনিক ও মাসিক খরচের হিসাব",
  dues: "কাস্টমার বাকি ও পাওনা খাতা",
  customers: "কাস্টমার তালিকা ও লেজার",
  suppliers: "সরবরাহকারী ও পাইকারি বিক্রেতা",
  receipts: "চালান, মেমো ও রসিদ কেন্দ্র",
  reports: "ব্যবসায়িক রিপোর্ট ও লাভ-ক্ষতি বিশ্লেষণ",
  ai_assistant: "AI ব্যবসা সহকারী ও পরামর্শক",
  settings: "দোকানের প্রোফাইল ও সেটিংস",
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const {
    activeTab,
    setActiveTab,
    profile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useBusiness();
  const { user, openLogoutConfirm, switchRole } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const todayFormatted = formatBengaliDate(new Date(), false, profile.useBengaliDigits);
  const greeting = getBengaliGreeting();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E4EAE6] px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-[#68776F] hover:text-[#172B24] rounded-xl hover:bg-gray-100 lg:hidden"
          aria-label="মেনু খুলুন"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden shrink-0">
          <BrandMark size="xs" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg lg:text-xl font-bold text-[#172B24] tracking-tight">
              {tabTitles[activeTab] || "ড্যাশবোর্ড"}
            </h2>
          </div>
          <p className="text-xs text-[#68776F] hidden sm:block">
            {greeting}, <span className="font-semibold text-[#116149]">{profile.ownerName || profile.businessName}</span> • {todayFormatted}
          </p>
        </div>
      </div>

      {/* Right: Actions, Notifications & Quick Sale */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Date on Desktop */}
        <div className="hidden md:flex items-center text-xs font-medium text-[#116149] bg-[#F0FAF5] px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-[#16A574] inline-block mr-2 animate-pulse" />
          {todayFormatted}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-[#68776F] hover:text-[#172B24] hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="নোটিফিকেশন"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E4EAE6] py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-[#E4EAE6]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#172B24]">
                    নোটিফিকেশন ও সতর্কতা
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} নতুন
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-[#116149] hover:underline font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    সব পঠিত
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#68776F]">
                    কোনো নতুন নোটিফিকেশন নেই
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.actionUrl) {
                          setActiveTab(notif.actionUrl as ActiveTab);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${
                        !notif.isRead ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.type === "low_stock" ? (
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                        ) : notif.type === "due_reminder" ? (
                          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#116149] flex items-center justify-center">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-[#172B24] truncate">
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#68776F] mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Customer Storefront Preview Button */}
        <button
          onClick={() => switchRole("customer")}
          className="flex items-center gap-1.5 py-2 px-3 bg-[#F0FAF5] hover:bg-emerald-100 text-[#116149] border border-emerald-200 rounded-xl text-xs font-bold transition-all active:scale-95"
          title="কাস্টমাররা আপনার দোকান কীভাবে দেখে তা সরাসরি পরিদর্শন করুন"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden md:inline">কাস্টমার স্টোর</span>
        </button>

        {/* Quick Sale button (POS) */}
        {activeTab !== "pos" && (
          <button
            onClick={() => setActiveTab("pos")}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">নতুন</span> বিক্রি
          </button>
        )}

        {/* Logout Button */}
        <button
          onClick={openLogoutConfirm}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl transition-all active:scale-95 cursor-pointer shadow-2xs"
          title="লগআউট করুন"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </div>
    </header>
  );
};
