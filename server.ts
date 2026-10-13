import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "5mb" }));

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err);
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", aiConfigured: Boolean(aiClient) });
});

// AI Business Assistant endpoint
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { message, businessContext, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "বার্তা বা প্রশ্ন প্রদান করা আবশ্যক।" });
    }

    // Build context summary without personal customer details
    const contextText = businessContext ? `
[বর্তমান ব্যবসার তথ্য ও পরিসংখ্যান]
- ব্যবসার নাম: ${businessContext.businessName || "আমার ব্যবসা"}
- ব্যবসার ধরন: ${businessContext.businessType || "সাধারণ ব্যবসা"}
- মুদ্রা: ${businessContext.currency || "৳ (টাকা)"}
- আজকের মোট বিক্রি: ${businessContext.todaySales || 0} ৳
- আজকের খরচ: ${businessContext.todayExpenses || 0} ৳
- আজকের আনুমানিক লাভ: ${businessContext.todayProfit || 0} ৳
- চলতি মাসের মোট বিক্রি: ${businessContext.monthSales || 0} ৳
- চলতি মাসের মোট খরচ: ${businessContext.monthExpenses || 0} ৳
- চলতি মাসের আনুমানিক লাভ: ${businessContext.monthProfit || 0} ৳
- সর্বমোট বকেয়া পাওনা: ${businessContext.totalDue || 0} ৳
- স্টক শেষ/কমে এসেছে এমন পণ্য: ${businessContext.lowStockCount || 0}টি (${businessContext.lowStockItems?.join(", ") || "কোনটি নয়"})
- সর্বাধিক বিক্রীত পণ্যসমূহ: ${businessContext.topProducts?.join(", ") || "এখনও পর্যাপ্ত তথ্য নেই"}
- প্রধান খরচের খাত: ${businessContext.topExpenseCategories?.join(", ") || "তথ্য নেই"}
- মোট সক্রিয় পণ্যের সংখ্যা: ${businessContext.totalProductsCount || 0}
` : "ব্যবসায়িক তথ্য সংযুক্ত নেই।";

    // If Gemini client is active, call gemini-3.8-flash (with retry)
    if (aiClient) {
      const systemInstruction = `
আপনি 'আমার ব্যবসা AI'-এর একজন বিশেষজ্ঞ, আন্তরিক ও বাস্তববাদী বাংলাদেশি ব্যবসায়িক পরামর্শক (Senior Business Advisor)।
আপনি বাংলাদেশের ছোট ও মাঝারি দোকানদার ও উদ্যোক্তাদের (মুদি দোকান, কাপড়ের দোকান, কসমেটিকস, ইলেকট্রনিক্স, ফেসবুক ও অনলাইন শপ ইত্যাদি) ব্যবসায়িক পরামর্শ দেন।

আপনার দায়িত্ব ও নির্দেশনা:
১. সর্বদা সম্পূর্ণ শুদ্ধ, প্রাঞ্জল ও সম্মানসূচক বাংলায় উত্তর দিন।
২. উত্তর অবশ্যই সরাসরি ব্যবসার প্রদত্ত বাস্তব তথ্যের ওপর ভিত্তি করে দিন। কাল্পনিক কোনো বিক্রয় বা লাভের সংখ্যা বানিয়ে বলবেন না।
৩. যদি কোনো নির্দিষ্ট তথ্য না থাকে, তবে বিনয়ের সাথে জানান যে হিসাবের সঠিক তথ্যের জন্য আগে বিক্রি বা খরচ রেকর্ড করা দরকার।
৪. পরামর্শগুলো বাস্তবসম্মত, কার্যকর এবং সহজ বুলেট পয়েন্ট আকারে সাজিয়ে দিন যাতে একজন সাধারণ ব্যবসায়ী খুব সহজে বুঝতে পারেন।
৫. আর্থিক হিসাব ব্যাখ্যা করার সময় স্পষ্ট করে বলুন: লাভ = বিক্রি - পণ্যের ক্রয়মূল্য - অন্যান্য খরচ।
৬. কোনো সংবেদনশীল ব্যক্তিগত তথ্য বা অবাস্তব প্রতিশ্রুতি দেবেন না।
`;

      const prompt = `
${contextText}

[ব্যবহারকারীর প্রশ্ন/বার্তা]:
${message}
`;

      let reply: string | null = null;
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        reply = response.text || null;
      } catch (primaryErr: any) {
        console.warn("Primary model spike, attempting gemini-flash-latest...", primaryErr?.message);
        try {
          const fallbackModelRes = await aiClient.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          reply = fallbackModelRes.text || null;
        } catch (secondaryErr) {
          console.warn("Secondary model failed as well, falling back to smart local intelligence");
        }
      }

      if (reply) {
        return res.json({
          reply,
          isLiveAI: true,
        });
      }
    }

    // Graceful fallback when GEMINI_API_KEY is not configured
    const fallbackResponse = generateSmartBusinessInsight(message, businessContext);
    return res.json({
      reply: fallbackResponse,
      isLiveAI: false,
      notice: "ডেমো মোড: বাস্তব এআই ব্যবহারের জন্য সিস্টেমে GEMINI_API_KEY যুক্ত থাকতে হবে। তবে সিস্টেম আপনার বর্তমান তথ্যের ভিত্তিতে এই বাস্তবমুখী বিশ্লেষণ প্রদান করছে।",
    });
  } catch (error: any) {
    console.error("Gemini assistant error:", error);
    // Even if Gemini throws, provide useful advice based on shop data
    const fallbackResponse = generateSmartBusinessInsight(req.body.message, req.body.businessContext);
    return res.json({
      reply: fallbackResponse,
      isLiveAI: false,
      errorNotice: "এআই সংযোগে সাময়িক বিলম্ব হওয়ায় স্বয়ংক্রিয় ব্যবসায়িক বিশ্লেষণ প্রদর্শিত হলো।",
    });
  }
});

// Helper for smart rule-based Bengali business response
function generateSmartBusinessInsight(userQuery: string = "", ctx: any = {}): string {
  const query = userQuery.toLowerCase();
  const sales = Number(ctx.monthSales) || Number(ctx.todaySales) || 0;
  const expenses = Number(ctx.monthExpenses) || Number(ctx.todayExpenses) || 0;
  const profit = Number(ctx.monthProfit) || Number(ctx.todayProfit) || 0;
  const due = Number(ctx.totalDue) || 0;
  const lowStock = ctx.lowStockItems || [];
  const topProducts = ctx.topProducts || [];

  if (query.includes("লাভ") || query.includes("মুনাফা") || query.includes("profit")) {
    return `📊 **আপনার লাভের হিসাব বিশ্লেষণ:**\n\n` +
      `• **আজকের আনুমানিক লাভ:** ৳ ${ctx.todayProfit?.toLocaleString() || 0}\n` +
      `• **চলতি মাসের মোট লাভ:** ৳ ${profit.toLocaleString()}\n` +
      `• **চলতি মাসের মোট বিক্রি:** ৳ ${sales.toLocaleString()}\n` +
      `• **চলতি মাসের মোট খরচ:** ৳ ${expenses.toLocaleString()}\n\n` +
      `💡 **পরামর্শ:** লাভ বাড়ানোর জন্য যেসব পণ্যে মুনাফার মার্জিন বেশি (যেমন উচ্চ মূল্যের আইটেম) সেগুলোর বিক্রয় বাড়ানোর দিকে নজর দিন। এছাড়া অনাকাঙ্ক্ষিত খরচ নিয়ন্ত্রণ করুন।`;
  }

  if (query.includes("স্টক") || query.includes("পণ্য") || query.includes("inventory")) {
    if (lowStock.length > 0) {
      return `⚠️ **স্টক সতর্কতা ও আপডেট:**\n\n` +
        `আপনার মোট **${lowStock.length}টি পণ্যের** স্টক দ্রুত ফুরিয়ে আসছে:\n` +
        lowStock.map((item: string) => `• 🔻 ${item}`).join("\n") +
        `\n\n📦 **পরামর্শ:** দ্রুত সরবরাহকারী বা পাইকারি বাজারে যোগাযোগ করে পণ্যগুলো পুনরায় রি-স্টক করুন, যেন কাস্টমার ফেরত না যায়!`;
    }
    return `✅ **স্টক অবস্থা সন্তোষজনক:**\n\nআপনার স্টকে থাকা পণ্যগুলোর পরিমাণ বর্তমানে পর্যাপ্ত রয়েছে। নিয়মিত বিক্রির সাথে মিলিয়ে সর্বনিম্ন স্টক সীমা মনিটর করুন।`;
  }

  if (query.includes("বেশি বিক্রি") || query.includes("সেরা পণ্য") || query.includes("top")) {
    if (topProducts.length > 0) {
      return `🔥 **সবচেয়ে বেশি বিক্রি হওয়া পণ্যসমূহ:**\n\n` +
        topProducts.map((p: string, i: number) => `${i + 1}. ⭐ ${p}`).join("\n") +
        `\n\n📈 **পরামর্শ:** এই পণ্যগুলো আপনার দোকানের মূল চালিকাশক্তি। দোকানে এদের দৃশ্যমান স্থানে রাখুন এবং কোনো অবস্থাতেই এদের স্টক শেষ হতে দেবেন না।`;
    }
    return `ℹ️ **বিক্রির তথ্য:** আপনার এখনো পর্যাপ্ত বিক্রয় রেকর্ড হয়নি। বিক্রির হিসাব নিয়মিত যোগ করলে এখানে সর্বাধিক জনপ্রিয় পণ্যের তালিকা তৈরি হবে।`;
  }

  if (query.includes("খরচ") || query.includes("expense")) {
    return `💸 **আপনার খরচের চিত্র:**\n\n` +
      `• **চলতি মাসের মোট খরচ:** ৳ ${expenses.toLocaleString()}\n` +
      `• **আজকের খরচ:** ৳ ${ctx.todayExpenses?.toLocaleString() || 0}\n` +
      (ctx.topExpenseCategories?.length ? `• **প্রধান খাতসমূহ:** ${ctx.topExpenseCategories.join(", ")}\n\n` : "\n") +
      `✂️ **খরচ কমানোর উপায়:**\n` +
      `১. বিদ্যুৎ ও ইউটিলিটি ব্যবহারে অপচয় রোধ করুন।\n` +
      `২. পণ্য ক্রয়ের সময় সরাসরি বড় পাইকারি বাজার থেকে নগদ ছাড়ে ক্রয়ের চেষ্টা করুন।\n` +
      `৩. প্রতিদিনের ছোট ছোট খুচরা খরচের ভাউচারও নির্ভুলভাবে অ্যাপে লিখে রাখুন।`;
  }

  if (query.includes("বাকি") || query.includes("পাওনা") || query.includes("due")) {
    return `📝 **বাকি ও পাওনার হিসাব:**\n\n` +
      `• **কাস্টমারদের কাছে মোট পাওনা:** ৳ ${due.toLocaleString()}\n\n` +
      `🎯 **বাকি আদায়ের করণীয় কৌশল:**\n` +
      `১. যাদের বকেয়া অনেক দিনের, তাদের সাপ্তাহিক মিষ্টি শুভেচ্ছা ও তাগাদা এসএমএস পাঠান।\n` +
      `২. নতুন বাকির সীমা নির্ধারণ করুন (ক্রেডিট লিমিট)।\n` +
      `৩. আংশিক বা কিস্তিতে পরিশোধের সুযোগ দিলে ক্রেতাদের টাকা দেওয়া সহজ হয়।`;
  }

  if (query.includes("পরিকল্পনা") || query.includes("সপ্তাহ") || query.includes("plan")) {
    return `📋 **আসন্ন সপ্তাহের ৩-দফা ব্যবসায়িক কর্মপরিকল্পনা:**\n\n` +
      `১. **স্টক ম্যানেজমেন্ট:** যে ${lowStock.length || 0}টি পণ্যের স্টক কমে এসেছে তা আগামী ২ দিনের মধ্যে সরবরাহকারীর কাছ থেকে সংগ্রহ করুন।\n` +
      `২. **বাকি আদায় অভিযান:** মোট ৳ ${due.toLocaleString()} পাওনার অন্তত ৩০-৪০% এই সপ্তাহে আদায়ের টার্গেট নিন।\n` +
      `৩. **বিক্রয় প্রসার:** সর্বাধিক বিক্রীত আইটেমগুলোর সাথে কম বিক্রীত পণ্যের বান্ডেল অফার বা ডিসকাউন্ট প্রচারণা চালান।`;
  }

  if (query.includes("বিজ্ঞাপন") || query.includes("ফেসবুক") || query.includes("পোস্ট")) {
    const biz = ctx.businessName || "আমাদের শপে";
    return `📢 **ফেসবুক বা প্রচারণার জন্য তৈরি করা আকর্ষণীয় ক্যাপশন:**\n\n` +
      `✨ **সেরা মানের পণ্য, সেরা দামে!** ✨\n\n` +
      `আপনার বিশ্বস্ত প্রতিষ্ঠান **${biz}**-এ পেয়ে যাচ্ছেন ১০০% অরিজিনাল ও প্রিমিয়াম কোয়ালিটির পণ্য!\n\n` +
      `✅ পাইকারি ও খুচরা মূল্যের সুবর্ণ সুযোগ\n` +
      `✅ দ্রুত ও নির্ভুল সেবা\n` +
      `✅ সঠিক মাপ ও আসল পণ্যের নিশ্চয়তা\n\n` +
      `📦 আজই ইনবক্স করুন অথবা আমাদের দোকানে চলে আসুন!\n` +
      `📞 যোগাযোগ: [আপনার মোবাইল নম্বর দিন]\n` +
      `📍 ঠিকানা: [দোকানের ঠিকানা লিখুন]`;
  }

  // General fallback
  return `আসসালামু আলাইকুম! **${ctx.businessName || "আমার ব্যবসা"}**-এর বর্তমান আর্থিক অবস্থা:\n\n` +
    `• 💰 আজকের বিক্রি: ৳ ${ctx.todaySales?.toLocaleString() || 0}\n` +
    `• 📉 আজকের খরচ: ৳ ${ctx.todayExpenses?.toLocaleString() || 0}\n` +
    `• 📈 আনুমানিক লাভ: ৳ ${ctx.todayProfit?.toLocaleString() || 0}\n` +
    `• 🤝 কাস্টমার বকেয়া: ৳ ${due.toLocaleString()}\n` +
    `• 📦 কম স্টকের পণ্য: ${lowStock.length}টি\n\n` +
    `আপনি লাভ, স্টক, খরচ, বাকি আদায় বা ফেসবুক বিজ্ঞাপনের বিষয়ে যেকোনো নির্দিষ্ট প্রশ্ন করতে পারেন। আমি উত্তর দিতে প্রস্তুত!`;
}

// Development vs Production serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`[Amar Business AI] Server is running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
