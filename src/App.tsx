import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BusinessProvider, useBusiness } from "./context/BusinessContext";
import { Sidebar } from "./components/layout/Sidebar";
import { Navbar } from "./components/layout/Navbar";
import { Dashboard } from "./components/pages/Dashboard";
import { PosSale } from "./components/pages/PosSale";
import { SalesHistory } from "./components/pages/SalesHistory";
import { Inventory } from "./components/pages/Inventory";
import { Expenses } from "./components/pages/Expenses";
import { DuesLedger } from "./components/pages/DuesLedger";
import { Customers } from "./components/pages/Customers";
import { Suppliers } from "./components/pages/Suppliers";
import { ReceiptsHub } from "./components/pages/ReceiptsHub";
import { Reports } from "./components/pages/Reports";
import { AiAssistant } from "./components/pages/AiAssistant";
import { Settings } from "./components/pages/Settings";
import { Onboarding } from "./components/pages/Onboarding";
import { LoginPage } from "./components/pages/LoginPage";
import { CustomerStorefront } from "./components/pages/CustomerStorefront";
import { CatalogManager } from "./components/pages/CatalogManager";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BadgePercent,
  Bot,
  LogOut,
  Globe,
} from "lucide-react";

const MainAppContent: React.FC = () => {
  const { isAuthenticated, user, isLogoutConfirmOpen, closeLogoutConfirm, logout } = useAuth();
  const { profile, activeTab, setActiveTab } = useBusiness();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. If not authenticated, require email & password login page first
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 2. If user is Customer, show Customer Storefront directly (no admin UI)
  if (user?.role === "customer") {
    return <CustomerStorefront />;
  }

  // 3. If Admin user hasn't completed business setup, show Onboarding
  if (!profile.isOnboarded || activeTab === "setup") {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172B24] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Navbar onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "pos" && <PosSale />}
          {activeTab === "sales_history" && <SalesHistory />}
          {activeTab === "inventory" && <Inventory />}
          {activeTab === "catalog_manager" && <CatalogManager />}
          {activeTab === "expenses" && <Expenses />}
          {activeTab === "dues" && <DuesLedger />}
          {activeTab === "customers" && <Customers />}
          {activeTab === "suppliers" && <Suppliers />}
          {activeTab === "receipts" && <ReceiptsHub />}
          {activeTab === "reports" && <Reports />}
          {activeTab === "ai_assistant" && <AiAssistant />}
          {activeTab === "settings" && <Settings />}
        </main>

        {/* Mobile Quick Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E4EAE6] flex items-center justify-around py-2 lg:hidden px-2 shadow-lg">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === "dashboard" ? "text-[#116149]" : "text-[#68776F]"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            ড্যাশবোর্ড
          </button>

          <button
            onClick={() => setActiveTab("pos")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === "pos" ? "text-[#116149]" : "text-[#68776F]"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            বিক্রি (POS)
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === "inventory" ? "text-[#116149]" : "text-[#68776F]"
            }`}
          >
            <Package className="w-5 h-5" />
            স্টক
          </button>

          <button
            onClick={() => setActiveTab("dues")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === "dues" ? "text-[#116149]" : "text-[#68776F]"
            }`}
          >
            <BadgePercent className="w-5 h-5" />
            বাকি খাতা
          </button>

          <button
            onClick={() => setActiveTab("ai_assistant")}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-semibold transition-colors ${
              activeTab === "ai_assistant" ? "text-[#116149]" : "text-[#68776F]"
            }`}
          >
            <Bot className="w-5 h-5" />
            AI সহকারী
          </button>
        </nav>
      </div>

      {/* Global Root Logout Confirmation Modal - 100% visible outside stacking contexts */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E4EAE6] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#172B24]">
                লগআউট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-[#68776F] leading-relaxed">
                আপনি কি নিশ্চিত যে আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={closeLogoutConfirm}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-[#172B24] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  closeLogoutConfirm();
                  setIsMobileSidebarOpen(false);
                  logout();
                }}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                হ্যাঁ, লগআউট
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <MainAppContent />
      </BusinessProvider>
    </AuthProvider>
  );
}
