/**
 * Bengali Numeral and Formatting Utilities
 */

const englishToBengaliMap: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
  ".": ".",
  ",": ",",
};

const bengaliToEnglishMap: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/**
 * Converts English digits in a string or number to Bengali digits
 */
export function toBengaliNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === "") return "০";
  const str = typeof val === "number" ? val.toLocaleString("en-IN") : String(val);
  return str
    .split("")
    .map((char) => englishToBengaliMap[char] ?? char)
    .join("");
}

/**
 * Converts Bengali digits string back to English number
 */
export function parseBengaliNumber(val: string): number {
  if (!val) return 0;
  const enStr = val
    .split("")
    .map((char) => bengaliToEnglishMap[char] ?? char)
    .join("")
    .replace(/[^0-9.-]/g, "");
  const num = parseFloat(enStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a currency amount with the Taka sign
 */
export function formatCurrency(
  amount: number | undefined | null,
  useBengaliDigits: boolean = true
): string {
  const num = Number(amount) || 0;
  if (useBengaliDigits) {
    return `৳ ${toBengaliNumber(num)}`;
  }
  return `৳ ${num.toLocaleString("en-IN")}`;
}

export const formatBengaliNumber = toBengaliNumber;
export const formatBengaliCurrency = formatCurrency;

const bengaliMonths = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const bengaliDays = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

/**
 * Formats standard ISO date or Date object into human-friendly Bengali string
 */
export function formatBengaliDate(
  dateInput: string | Date | undefined,
  includeTime: boolean = false,
  useBengaliDigits: boolean = true
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const day = d.getDate();
  const month = bengaliMonths[d.getMonth()];
  const year = d.getFullYear();

  const formattedDay = useBengaliDigits ? toBengaliNumber(day) : day;
  const formattedYear = useBengaliDigits ? toBengaliNumber(year) : year;

  let result = `${formattedDay} ${month}, ${formattedYear}`;

  if (includeTime) {
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "বিকাল/রাত" : "সকাল";
    const displayHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    const timeStr = `${displayHours}:${formattedMinutes}`;
    const bengaliTime = useBengaliDigits ? toBengaliNumber(timeStr) : timeStr;
    result += ` (${ampm} ${bengaliTime})`;
  }

  return result;
}

/**
 * Returns today's greeting based on the current hour
 */
export function getBengaliGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "শুভ সকাল";
  if (hour >= 12 && hour < 16) return "শুভ দুপুর";
  if (hour >= 16 && hour < 19) return "শুভ বিকাল";
  return "শুভ সন্ধ্যা";
}

/**
 * Formats a short date (DD/MM/YYYY)
 */
export function formatShortDate(dateStr: string, useBengaliDigits: boolean = true): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const formatted = `${day}/${month}/${year}`;
  return useBengaliDigits ? toBengaliNumber(formatted) : formatted;
}
