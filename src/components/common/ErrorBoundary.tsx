import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Storage clear error:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9FC] text-[#172B24] flex items-center justify-center p-4 font-['Hind_Siliguri',sans-serif]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-red-200 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#172B24]">
                একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে
              </h2>
              <p className="text-xs text-[#68776F] mt-1">
                অ্যাপ্লিকেশনটি লোড করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে পেজটি রিলোড করুন।
              </p>
            </div>

            {this.state.error && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] font-mono text-gray-700 text-left max-h-32 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#116149] hover:bg-[#0d4f3b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                পুনরায় লোড করুন
              </button>

              <button
                onClick={this.handleResetData}
                className="py-2.5 px-4 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-[#68776F] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="ব্রাউজার ক্যাশ ও লোকাল ডেটা রিসেট করে রিলোড করুন"
              >
                <Trash2 className="w-4 h-4" />
                ডেটা রিসেট
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
