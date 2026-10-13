import React from "react";

interface BrandMarkProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "emerald" | "white" | "dark";
  animated?: boolean;
}

const sizeMap = {
  xs: "w-7 h-7",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

/**
 * Modern High-Craft SVG Brand Mark for "আমার ব্যবসা AI"
 * Fuses:
 * 1. Modern retail storefront canopy & upward growth pillars (বিক্রি ও সমৃদ্ধি)
 * 2. Modern stylized Bengali 'ব' geometric letterform
 * 3. Golden 4-point AI Star / Sparkle representing intelligent assistant (AI প্রযুক্তি)
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  size = "md",
  className = "",
  variant = "emerald",
  animated = false,
}) => {
  const sizeClasses = sizeMap[size] || sizeMap.md;

  // Background gradient & styling based on variant
  if (variant === "white") {
    return (
      <div
        className={`${sizeClasses} relative rounded-2xl bg-white shadow-lg flex items-center justify-center p-1.5 shrink-0 select-none ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="wm_greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B4D37" />
              <stop offset="50%" stopColor="#116149" />
              <stop offset="100%" stopColor="#16A574" />
            </linearGradient>
            <linearGradient id="wm_goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>
            <linearGradient id="wm_tealAccent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16A574" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>

          {/* Stylized Modern Bengali 'ব' + Store Canopy + Growth Graphic */}
          {/* Base Storefront / Counter Foundation */}
          <path
            d="M22 68C22 65.7909 23.7909 64 26 64H74C76.2091 64 78 65.7909 78 68V72C78 74.2091 76.2091 76 74 76H26C23.7909 76 22 74.2091 22 72V68Z"
            fill="url(#wm_greenGrad)"
          />

          {/* Growth Bars / Store Columns */}
          {/* Bar 1 - Left */}
          <rect x="26" y="46" width="10" height="15" rx="3" fill="url(#wm_greenGrad)" opacity="0.85" />
          {/* Bar 2 - Middle (Rising) */}
          <rect x="42" y="38" width="10" height="23" rx="3" fill="url(#wm_greenGrad)" />
          {/* Bar 3 - Right (Highest Growth Peak) */}
          <rect x="58" y="30" width="10" height="31" rx="3" fill="url(#wm_tealAccent)" />

          {/* Modern Canopy / Roof Arch with Shopfront Flair */}
          <path
            d="M20 34C20 28.4772 24.4772 24 30 24H70C75.5228 24 80 28.4772 80 34C80 34 76 38 68 38C60 38 56 34 50 34C44 34 40 38 32 38C24 38 20 34 20 34Z"
            fill="url(#wm_greenGrad)"
          />

          {/* Elegant Dynamic Ribbon Arrow curve of Bengali 'ব' */}
          <path
            d="M32 64C32 46 44 26 62 26"
            stroke="url(#wm_tealAccent)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* AI Intelligence Sparkle Star (Gold / Radiant) */}
          <g className={animated ? "animate-pulse" : ""}>
            <path
              d="M78 20C78 25.5 83.5 25.5 83.5 25.5C83.5 25.5 78 25.5 78 31C78 25.5 72.5 25.5 72.5 25.5C72.5 25.5 78 25.5 78 20Z"
              fill="url(#wm_goldGrad)"
            />
            <circle cx="78" cy="25.5" r="1.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>
    );
  }

  // Default Emerald Brand Mark (Deep Forest to Vibrant Mint with Glow)
  return (
    <div
      className={`${sizeClasses} relative rounded-2xl bg-linear-to-br from-[#0D5039] via-[#116149] to-[#16A574] shadow-md shadow-[#116149]/20 flex items-center justify-center p-1.5 shrink-0 select-none overflow-hidden border border-white/20 ${className}`}
    >
      {/* Subtle top-light glossy shine */}
      <div className="absolute inset-0 bg-linear-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bm_whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2F6EC" />
          </linearGradient>
          <linearGradient id="bm_mintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <linearGradient id="bm_goldSpark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="60%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <filter id="bm_glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Store Awning / Canopy Roof (Elegant Scallop curves) */}
        <path
          d="M18 36C18 29.5 23 24.5 29.5 24.5H70.5C77 24.5 82 29.5 82 36C82 36.5 77 40 70 40C63 40 58.5 36.5 50 36.5C41.5 36.5 37 40 30 40C23 40 18 36.5 18 36Z"
          fill="url(#bm_whiteGrad)"
          opacity="0.95"
        />

        {/* Awning stripes / accents */}
        <path
          d="M39 24.5L34 40M61 24.5L66 40"
          stroke="#116149"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.25"
        />

        {/* Rising Financial Growth Bars (স্মার্ট লাভ ও বিক্রয় প্রবৃদ্ধি) */}
        {/* Pillar 1 */}
        <rect x="25" y="52" width="11" height="18" rx="3.5" fill="url(#bm_whiteGrad)" opacity="0.85" />
        {/* Pillar 2 (Growth) */}
        <rect x="42" y="44" width="11" height="26" rx="3.5" fill="url(#bm_whiteGrad)" />
        {/* Pillar 3 (Peak with Mint Gradient) */}
        <rect x="59" y="36" width="11" height="34" rx="3.5" fill="url(#bm_mintGrad)" />

        {/* Base Counter Floor Bar */}
        <rect x="20" y="73" width="60" height="6.5" rx="3.25" fill="url(#bm_whiteGrad)" />

        {/* Modern Stylized Bengali 'ব' Ribbon / Ascending Trendline */}
        <path
          d="M26 68C26 50 40 31 63 31"
          stroke="url(#bm_mintGrad)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* AI Sparkle Star (Intelligent Spark) */}
        <g className={animated ? "animate-pulse" : ""}>
          <path
            d="M79 17C79 23 85 23 85 23C85 23 79 23 79 29C79 23 73 23 73 23C73 23 79 23 79 17Z"
            fill="url(#bm_goldSpark)"
            filter="url(#bm_glow)"
          />
          <circle cx="79" cy="23" r="2" fill="#FFFBEB" />
          {/* Secondary tiny micro-star */}
          <circle cx="69" cy="18" r="1.5" fill="#FDE68A" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  theme?: "light" | "dark" | "banner";
  className?: string;
  badgeText?: string;
}

/**
 * Complete Brand Logo with Emblem Mark and Typography
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showSubtitle = true,
  theme = "light",
  className = "",
  badgeText = "AI",
}) => {
  const isBanner = theme === "banner";

  const markVariant = isBanner ? "white" : "emerald";

  const titleSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const subtitleSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
    xl: "text-sm",
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <BrandMark size={size} variant={markVariant} />

      <div className="overflow-hidden">
        <div className="flex items-center gap-1.5 leading-tight">
          <h1
            className={`font-black tracking-tight ${titleSizes[size]} ${
              isBanner ? "text-white" : "text-[#116149]"
            }`}
          >
            আমার ব্যবসা
          </h1>
          {badgeText && (
            <span
              className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-md leading-none tracking-wide shadow-xs ${
                isBanner
                  ? "bg-white/25 text-white backdrop-blur-xs border border-white/30"
                  : "bg-emerald-100 text-[#116149] border border-emerald-200"
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showSubtitle && (
          <p
            className={`font-bold tracking-wider truncate font-['Outfit',sans-serif] ${subtitleSizes[size]} ${
              isBanner ? "text-emerald-50" : "text-[#116149]"
            }`}
          >
            Made by Saikat
          </p>
        )}
      </div>
    </div>
  );
};
