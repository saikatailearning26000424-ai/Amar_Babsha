import React, { useState } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import { BrandMark } from "../common/BrandLogo";
import { ActiveTab } from "../../types";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  Receipt,
  Users,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Bot,
  Settings,
  AlertTriangle,
  BadgePercent,
  Sparkles,
  LogOut,
  Globe,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, lowStockItems, totalDue, profile, orders } = useBusiness();
  const { user, openLogoutConfirm, switchRole } = useAuth();

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === "অপেক্ষমান").length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
  }[] = [
    { id: "dashboard", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
    { id: "pos", label: "নতুন বিক্রি", icon: ShoppingCart, badge: "POS", badgeColor: "bg-[#16A574] text-white" },
    { id: "sales_history", label: "বিক্রির ইতিহাস", icon: History },
    {
      id: "inventory",
      label: "পণ্য ও স্টক",
      icon: Package,
      badge: lowStockItems.length > 0 ? lowStockItems.length : null,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      id: "catalog_manager",
      label: "ক্যাটালগ ও অনলাইন অর্ডার",
      icon: Globe,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: "bg-emerald-600 text-white font-bold",
    },
    { id: "expenses", label: "খরচের হিসাব", icon: Receipt },
    {
      id: "dues",
      label: "বাকি ও পাওনা",
      icon: BadgePercent,
      badge: totalDue > 0 ? "বকেয়া" : null,
      badgeColor: "bg-red-100 text-red-700",
    },
    { id: "customers", label: "কাস্টমার", icon: Users },
    { id: "suppliers", label: "সরবরাহকারী", icon: Truck },
    { id: "receipts", label: "চালান ও রসিদ", icon: FileSpreadsheet },
    { id: "reports", label: "ব্যবসার রিপোর্ট", icon: BarChart3 },
    {
      id: "ai_assistant",
      label: "AI ব্যবসা সহকারী",
      icon: Bot,
      badge: "AI",
      badgeColor: "bg-purple-600 text-white animate-pulse",
    },
    { id: "settings", label: "সেটিংস", icon: Settings },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-[#E4EAE6] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4EAE6] bg-linear-to-b from-[#F0FAF5] to-white">
          <div className="flex items-center gap-3">
            <BrandMark size="md" animated={true} />
            <div className="overflow-hidden min-w-0">
              <h1 className="font-extrabold text-base text-[#116149] leading-tight flex items-center gap-1.5 truncate">
                আমার ব্যবসা <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#116149] border border-emerald-200">AI</span>
              </h1>
              <span className="text-[11px] font-bold tracking-wider text-[#116149] block mt-0.5 truncate font-['Outfit',sans-serif]">
                Made by Saikat
              </span>
            </div>
          </div>
        </div>

        {/* Quick New Sale Action Button */}
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={() => handleNavClick("pos")}
            className="w-full py-2.5 px-3 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            + নতুন বিক্রি (POS)
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#F0FAF5] text-[#116149] font-semibold shadow-2xs border-l-4 border-[#16A574]"
                    : "text-[#68776F] hover:bg-gray-50 hover:text-[#172B24]"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#16A574]" : "text-[#68776F]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      item.badgeColor || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Quick Banner at bottom of sidebar */}
        <div className="p-3 m-3 rounded-xl bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-100/70">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#16A574]" />
            <span className="text-xs font-semibold text-[#116149]">AI স্মার্ট পরামর্শ</span>
          </div>
          <p className="text-[11px] text-[#68776F] leading-relaxed mb-2">
            আপনার দোকান ও বিক্রির হিসাব নিয়ে যেকোনো প্রশ্ন করুন।
          </p>
          <button
            onClick={() => handleNavClick("ai_assistant")}
            className="w-full py-1.5 px-2 bg-white hover:bg-emerald-50 text-[#116149] border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
          >
            পরামর্শ নিন →
          </button>
        </div>

        {/* Customer Storefront Preview Link */}
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              onCloseMobile();
              switchRole("customer");
            }}
            className="w-full py-2 px-3 bg-[#F0FAF5] hover:bg-emerald-100 text-[#116149] border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            🛍️ কাস্টমার স্টোর ভিউ
          </button>
        </div>

        {/* User / Shop Footer with Logout */}
        <div className="p-3 border-t border-[#E4EAE6] bg-[#F7F9FC] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate min-w-0">
              <p className="text-xs font-semibold text-[#172B24] truncate">
                {user?.name || profile.ownerName || "ব্যবহারকারী"}
              </p>
              <p className="text-[10px] text-[#68776F] truncate">{user?.email || profile.businessType}</p>
            </div>
            <button
              onClick={() => {
                onCloseMobile();
                openLogoutConfirm();
              }}
              className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              title="লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
