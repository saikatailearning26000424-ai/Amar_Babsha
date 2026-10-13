import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthUser, UserRole } from "../types";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    businessName?: string,
    role?: UserRole,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  isLogoutConfirmOpen: boolean;
  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
}

const AUTH_USER_KEY = "amar_business_ai_current_user";
const REGISTERED_USERS_KEY = "amar_business_ai_registered_users";
const AUTH_FORCE_LOGIN_VERSION = "v8_role_based_auth_admin_customer";

// Migration to ensure clean role setup
try {
  if (
    typeof window !== "undefined" &&
    localStorage.getItem("amar_business_ai_auth_version") !== AUTH_FORCE_LOGIN_VERSION
  ) {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.setItem("amar_business_ai_auth_version", AUTH_FORCE_LOGIN_VERSION);
  }
} catch (e) {
  console.warn("Auth version migration warning:", e);
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  businessName?: string;
  role: UserRole;
}

// Initial pre-registered accounts for immediate access
const initialAccounts: StoredAccount[] = [
  {
    id: "usr-1",
    name: "সাইকত আহমেদ",
    email: "saikatailearning26000424@gmail.com",
    password: "password123",
    businessName: "আমার ব্যবসা",
    role: "admin",
  },
  {
    id: "usr-2",
    name: "দোকান অ্যাডমিন",
    email: "admin@amarbusiness.ai",
    password: "123456",
    businessName: "আমার ব্যবসা",
    role: "admin",
  },
  {
    id: "usr-cust-1",
    name: "তানভীর হাসান (কাস্টমার)",
    email: "customer@example.com",
    password: "123456",
    phone: "01712-345678",
    role: "customer",
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.role) {
          parsed.role = parsed.email?.includes("customer") ? "customer" : "admin";
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Ensure initial registered accounts exist in storage
  useEffect(() => {
    try {
      const existing = localStorage.getItem(REGISTERED_USERS_KEY);
      if (!existing) {
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initialAccounts));
      } else {
        const parsed: StoredAccount[] = JSON.parse(existing);
        const hasCustomer = parsed.some((acc) => acc.role === "customer");
        if (!hasCustomer) {
          parsed.push(initialAccounts[2]);
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Storage warning in AuthProvider", e);
    }
  }, []);

  const getRegisteredAccounts = (): StoredAccount[] => {
    try {
      const data = localStorage.getItem(REGISTERED_USERS_KEY);
      return data ? JSON.parse(data) : initialAccounts;
    } catch {
      return initialAccounts;
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const accounts = getRegisteredAccounts();

    // Check matching account
    const matched = accounts.find(
      (acc) => acc.email.toLowerCase() === trimmedEmail && acc.password === password
    );

    if (matched) {
      const authUser: AuthUser = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        phone: matched.phone,
        businessName: matched.businessName,
        role: matched.role || (matched.email.includes("customer") ? "customer" : "admin"),
      };
      setUser(authUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      return { success: true };
    }

    // Allow flexible login if it's the owner's primary email with any password >= 4 chars
    if (trimmedEmail === "saikatailearning26000424@gmail.com" && password.length >= 4) {
      const authUser: AuthUser = {
        id: "usr-1",
        name: "সাইকত আহমেদ",
        email: trimmedEmail,
        businessName: "আমার ব্যবসা",
        role: "admin",
      };
      setUser(authUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      return { success: true };
    }

    return {
      success: false,
      error: "ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।",
    };
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    businessName?: string,
    role: UserRole = "customer",
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      return { success: false, error: "দয়া করে আপনার নাম লিখুন।" };
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return { success: false, error: "দয়া করে একটি সঠিক ইমেইল ঠিকানা দিন।" };
    }
    if (password.length < 4) {
      return { success: false, error: "পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।" };
    }

    const accounts = getRegisteredAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
    if (existing) {
      return { success: false, error: "এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা আছে। লগইন করুন।" };
    }

    const newAccount: StoredAccount = {
      id: `usr-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      password,
      phone: phone?.trim(),
      businessName: role === "admin" ? businessName?.trim() || "আমার ব্যবসা" : undefined,
      role,
    };

    const updatedAccounts = [...accounts, newAccount];
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updatedAccounts));

    const authUser: AuthUser = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      phone: newAccount.phone,
      businessName: newAccount.businessName,
      role: newAccount.role,
    };

    setUser(authUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));

    return { success: true };
  };

  // Quick One-click Role Switchers & Demos
  const loginAsRole = (role: UserRole) => {
    if (role === "admin") {
      const adminUser: AuthUser = {
        id: "usr-1",
        name: "সাইকত আহমেদ",
        email: "saikatailearning26000424@gmail.com",
        businessName: "আমার ব্যবসা",
        role: "admin",
      };
      setUser(adminUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(adminUser));
    } else {
      const custUser: AuthUser = {
        id: `usr-cust-${Date.now()}`,
        name: "সম্মানিত কাস্টমার",
        email: "customer@example.com",
        phone: "01712-345678",
        role: "customer",
      };
      setUser(custUser);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(custUser));
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated: AuthUser = {
      ...user,
      role: newRole,
    };
    setUser(updated);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  };

  const logout = () => {
    setIsLogoutConfirmOpen(false);
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch (e) {
      console.warn("Storage error during logout:", e);
    }
  };

  const openLogoutConfirm = () => {
    setIsLogoutConfirmOpen(true);
  };

  const closeLogoutConfirm = () => {
    setIsLogoutConfirmOpen(false);
  };

  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin,
        isCustomer,
        login,
        register,
        loginAsRole,
        switchRole,
        logout,
        isLogoutConfirmOpen,
        openLogoutConfirm,
        closeLogoutConfirm,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
