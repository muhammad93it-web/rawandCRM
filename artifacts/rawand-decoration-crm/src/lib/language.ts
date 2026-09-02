type Language = "ku" | "en" | "ar";

const translations: Record<string, Record<Exclude<Language, "ku">, string>> = {
  "پەڕەی سەرەکی": { en: "Home", ar: "الرئيسية" },
  "گشتی": { en: "General", ar: "عام" },
  "بەڕێوەبردنی بەکارهێنەر": { en: "User management", ar: "إدارة المستخدمين" },
  "بەکارهێنەرەکان": { en: "Users", ar: "المستخدمون" },
  "شوێنکارەکان": { en: "Workplaces", ar: "أماكن العمل" },
  "کارمەندەکان": { en: "Employees", ar: "الموظفون" },
  "ڕۆڵەکان و دەسەڵاتەکان": { en: "Roles and permissions", ar: "الأدوار والصلاحيات" },
  "کاڵاکان": { en: "Items", ar: "الأصناف" },
  "کڕین": { en: "Purchases", ar: "المشتريات" },
  "فرۆشتن": { en: "Sales", ar: "المبيعات" },
  "کڕینەکان": { en: "Purchases", ar: "المشتريات" },
  "زانیارییەکانی خاوەن حساب": { en: "Account holders", ar: "أصحاب الحسابات" },
  "خەرجی و داهات": { en: "Income and expenses", ar: "الدخل والمصروفات" },
  "داهاتەکان": { en: "Income", ar: "الإيرادات" },
  "خەرجییەکان": { en: "Expenses", ar: "المصروفات" },
  "کۆگا": { en: "Storehouse", ar: "المخزن" },
  "قازانج و زیانەکان": { en: "Profit and loss", ar: "الأرباح والخسائر" },
  "قەرزەکان": { en: "Debts", ar: "الديون" },
  "ڕاپۆرتەکان": { en: "Reports", ar: "التقارير" },
  "زانیارییە سڕاوەکان": { en: "Deleted records", ar: "السجلات المحذوفة" },
  "ڕێکخستنە گشتییەکان": { en: "General settings", ar: "الإعدادات العامة" },
  "گەڕان": { en: "Search", ar: "بحث" },
  "گۆڕینی وشەی نهێنی": { en: "Change password", ar: "تغيير كلمة المرور" },
  "چوونە دەرەوە": { en: "Sign out", ar: "تسجيل الخروج" },
  "داخستن": { en: "Lock", ar: "قفل" },
  "دڵخوازکردن": { en: "Favorites", ar: "المفضلة" },
  "گۆڕینی زمان": { en: "Change language", ar: "تغيير اللغة" },
  "کوردی": { en: "Kurdish", ar: "الكردية" },
  "گۆڕینی قەبارەی فۆنت": { en: "Font size", ar: "حجم الخط" },
  "دەرکەوتن": { en: "Appearance", ar: "المظهر" },
  "باری ڕووناک": { en: "Light mode", ar: "الوضع الفاتح" },
  "باری تاریک": { en: "Dark mode", ar: "الوضع الداكن" },
  "دەربارەی": { en: "About", ar: "حول التطبيق" },
  "بەشدارکردن": { en: "Subscription", ar: "الاشتراك" },
  "وەشان": { en: "Version", ar: "الإصدار" },
  "نوێکردنەوە": { en: "Refresh", ar: "تحديث" },
  "زیادکردن": { en: "Add", ar: "إضافة" },
  "پاشەکەوتکردن": { en: "Save", ar: "حفظ" },
  "هیچ زانیارییەک بەردەست نییە": { en: "No information available", ar: "لا توجد معلومات متاحة" },
  "لە بارکردندایە...": { en: "Loading...", ar: "جار التحميل..." },
  "بەستەرەکە نەدۆزرایەوە": { en: "Page not found", ar: "الصفحة غير موجودة" },
};

const originalText = new WeakMap<Text, string>();

function translateTextNode(node: Text, language: Language) {
  const raw = originalText.get(node) ?? node.nodeValue?.trim() ?? "";
  if (!raw) return;
  originalText.set(node, raw);
  const translated = language === "ku" ? raw : translations[raw]?.[language] ?? raw;
  const value = node.nodeValue ?? "";
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const nextValue = `${leading}${translated}${trailing}`;
  if (value !== nextValue) node.nodeValue = nextValue;
}

export function applyLanguage(language: Language) {
  document.documentElement.lang = language === "en" ? "en" : language === "ar" ? "ar" : "ku";
  document.documentElement.dataset.language = language;
  document.body.classList.toggle("ltr-language", language === "en");
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !parent.closest("script, style, [data-no-translate]")) {
      translateTextNode(node as Text, language);
    }
    node = walker.nextNode();
  }
}

export function watchLanguage(language: Language) {
  applyLanguage(language);
  const observer = new MutationObserver(() => applyLanguage(language));
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}