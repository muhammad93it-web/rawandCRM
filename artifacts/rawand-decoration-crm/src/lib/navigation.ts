export type NavIconName =
  | "Home" | "ViewDashboard" | "CityNext2" | "PlayerSettings" | "AccountManagement"
  | "Settings" | "ChangeEntitlements" | "Repo" | "ShoppingCart" | "ActivateOrders"
  | "Packages" | "Financial" | "RecycleBin" | "Admin" | "Group" | "MapPin"
  | "ProductList" | "PageCheckedin" | "PageCheckedOut" | "ReportDocument"
  | "Add" | "Chart" | "WorkforceManagement" | "FullHistory" | "Money"
  | "List" | "DeliveryTruck" | "Compare" | "Bank";

export interface NavItem {
  path: string;
  title: string;
  icon: NavIconName;
  parent?: string;
  section: string;
  keywords: string[];
}

const item = (path: string, title: string, icon: NavIconName, section: string, parent?: string): NavItem => ({
  path, title, icon, section, parent, keywords: [title, path.replaceAll("/", " ")],
});

export const SECTIONS = [
  item("/home", "پەڕەی سەرەکی", "Home", "home"),
  item("/dashboard", "داشبۆرد", "ViewDashboard", "dashboard"),
  item("/Workplaces", "شوێنکار", "CityNext2", "org"),
  item("/usermanagement", "بەڕێوەبردنی بەکارهێنەر", "PlayerSettings", "org"),
  item("/accountinfo", "زانیارییەکانی خاوەن حساب", "AccountManagement", "accounts"),
  item("/generalconfigurations", "ڕێکخستنە گشتییەکان", "Settings", "config"),
  item("/backup-administration", "Backup و Telegram", "Settings", "config"),
  item("/accounting", "خەرجی و داهات", "ChangeEntitlements", "accounting"),
  item("/storehouse", "کاڵاکان", "Repo", "items"),
  item("/purchases", "کڕین", "ShoppingCart", "purchases"),
  item("/sales", "فرۆشتن", "ActivateOrders", "sales"),
  item("/comparestore", "جەردکردنی مەخزەن", "Packages", "items"),
  item("/reports", "ڕاپۆرتەکان", "Financial", "reports"),
  item("/deletedlogs", "زانیاریە سڕاوەکان", "RecycleBin", "deleted"),
] as const;

export const HOME_GROUPS = [
  { title: "گشتی", links: [
    item("/dashboard", "داشبۆرد", "ViewDashboard", "dashboard"),
    item("/usermanagement", "بەڕێوەبردنی بەکارهێنەر", "PlayerSettings", "org"),
    item("/users", "بەکارهێنەرەکان", "Admin", "org", "/usermanagement"),
    item("/workplaces", "شوێنکارەکان", "MapPin", "org", "/usermanagement"),
    item("/employeelist", "کارمەندەکان", "Group", "org", "/usermanagement"),
  ]},
  { title: "CRM", links: [
    item("/storehouse", "کاڵاکان", "Repo", "items"),
    item("/purchases", "کڕین", "ShoppingCart", "purchases"),
    item("/sales", "فرۆشتن", "ActivateOrders", "sales"),
    item("/accountinfo", "زانیارییەکانی خاوەن حساب", "AccountManagement", "accounts"),
    item("/accounting", "خەرجی و داهات", "ChangeEntitlements", "accounting"),
    item("/income", "داهاتەکان", "PageCheckedin", "accounting", "/accounting"),
    item("/expense", "خەرجیەکان", "PageCheckedOut", "accounting", "/accounting"),
    item("/items", "کاڵاکان", "ProductList", "items", "/storehouse"),
    item("/profitandlossdashboard", "قازانج و زیانەکان", "ReportDocument", "accounting"),
    item("/AddDebt", "قەرزەکان", "ReportDocument", "accounts"),
    item("/reports", "ڕاپۆرتەکان", "Financial", "reports"),
    item("/deletedlogs", "زانیاریە سڕاوەکان", "RecycleBin", "deleted"),
    item("/generalconfigurations", "ڕێکخستنە گشتییەکان", "Settings", "config"),
    item("/backup-administration", "Backup و Telegram", "Settings", "config"),
  ]},
] as const;

const routes: Array<[string, string, NavIconName, string, string?]> = [
  ["/login","چوونەژوورەوە","Home","shell"],["/ProfileUser","زانیاری بەکارهێنەر","Admin","shell"],["/changepassword","گۆڕینی وشەی نهێنی","Settings","shell"],
  ["/workplaces","شوێنکارەکان","CityNext2","org","/usermanagement"],["/workplace/:id","شوێنکار","CityNext2","org","/workplaces"],["/users","بەکارهێنەرەکان","Admin","org","/usermanagement"],["/user/:id","بەکارهێنەر","Admin","org","/users"],["/groups","گروپەکان","Group","org","/usermanagement"],["/employeelist","کارمەندەکان","Group","org","/usermanagement"],["/addemployee/:id","زیادکردنی کارمەند","Add","org","/employeelist"],["/drivers","شۆفێرەکان","DeliveryTruck","org","/usermanagement"],
  ["/Storeconfig","ڕێکخستنی کۆگا","Settings","config","/storehouse"],["/accountconfiguration","ڕێکخستنی پۆڵێنەکان","Settings","config","/accountinfo"],["/accountingconfigurations","ڕیکخستنەکانی خەرجی و داهات","Settings","config","/accounting"],["/purchaseissueconfig","ڕێکخستنی کڕین","Settings","config","/purchases"],
  ["/backup-administration","Backup و Telegram","Settings","config","/generalconfigurations"],
  ["/accounts","خاوەن حسابەکان","WorkforceManagement","accounts","/accountinfo"],["/account/:id","خاوەن حساب","AccountManagement","accounts","/accountinfo"],["/reportaccounts","ڕاپۆرتی خاوەن حساب","Chart","accounts","/accountinfo"],["/accountolddebitsell","قەرزی کۆنی فرۆشتن","Money","accounts","/accountinfo"],["/accountolddebitpurchase","قەرزی کۆنی کڕین","Money","accounts","/accountinfo"],["/AddDebt","قەرزەکان","ReportDocument","accounts","/accountinfo"],
  ["/items","کاڵاکان","ProductList","items","/storehouse"],["/item/:id","کاڵا","ProductList","items","/storehouse"],["/services","خزمەتگوزاریەکان","List","items","/storehouse"],["/serviceitem/:id","خزمەتگوزاری","List","items","/storehouse"],["/transferitem/:id","گواستنەوەی کاڵا","Compare","items","/storehouse"],["/transferitemlist","گواستنەوەی کاڵا","Compare","items","/storehouse"],["/storeregister/:id","زیادکردنی جەردی مەخزەن","Add","items","/comparestore"],["/storeregistrylist","جەردی مەخزەن","Packages","items","/comparestore"],["/reportcheckinventory","ڕاپۆرتی جەردی مەخزەن","Chart","items","/comparestore"],["/reportstockbalancesheet","ڕاپۆرتی باڵانسی مەخزەن","Chart","items","/storehouse"],
  ["/addsale/:id/:kind","زیادکردنی پسووڵەی فرۆشتن","Add","sales","/sales"],["/salelist","پسووڵەکانی فرۆشتن","List","sales","/sales"],["/saletalaflist","پسووڵەکانی تەلەف","List","sales","/sales"],["/selloffer","ئۆفەری فرۆشتن","List","sales","/sales"],["/addselloffer/:id","زیادکردنی ئۆفەری فرۆشتن","Add","sales","/sales"],["/sellinvoiceclusting/:id","پسووڵەی پارە وەرگرتن","Money","sales","/sales"],
  ["/addpurchase/:id/:kind","زیادکردنی پسووڵەی کڕین","Add","purchases","/purchases"],["/purchaseinvoices","پسووڵەکانی کڕین","List","purchases","/purchases"],["/purchaseorders","داواکاری کڕین","List","purchases","/purchases"],["/addpurchaseorder/:id","زیادکردنی داواکاری کڕین","Add","purchases","/purchases"],["/addpurchasepayment/:id","پارەدانەکانی کڕین","Money","purchases","/purchases"],
  ["/income","داهاتەکان","PageCheckedin","accounting","/accounting"],["/expense","خەرجیەکان","PageCheckedOut","accounting","/accounting"],["/profitsAndLosses","قازانج و زیانەکان","ReportDocument","accounting","/accounting"],["/profitAndLossesbalance","باڵانسی قازانج و زیان","ReportDocument","accounting","/accounting"],["/addProfitAndLoss/:id","زیادکردنی قازانج و زیان","Add","accounting","/accounting"],["/addProfitAndLossbalance/:id","زیادکردنی باڵانس","Add","accounting","/accounting"],["/boxtransactionreport","ڕاپۆرتی مامەڵەی سندوق","Bank","accounting","/accounting"],
];

const reportPaths = `storereports reportitemexpose reportminqty reportstockbystorename reportstockperstore reportstockandpurchase reportitemsTransfer reportexpenses reportexpensebytype reportincome reportpurchaseaccountstatement reportsaleaccountstatement reportpurchasesaleaccountstatement reportaccountlastactivity reportdebts ReportpurchaseDebts ReportsellDebts reportdebtslateamount reportdebtslatetime reportdailysale reportsaleitemshistory reportsaleitemsreturn reportsellbytotaltypes reportsaleinvoices reportsaleitemshistorysummed ReportEmployeePerSell ReportMostSaleItemByUser ReportSellInvoicePerUser ReportDamageItems reportpurchaseitemshistory reportpurchaseinvoices reportpurchaseitemshistorysummed ReportemployeePerInvoice reportpurchasesellitemsummarize reportprofit reportprofitsummary reportcashboxbalance`.split(" ");
const deletedPaths = `deletedexpenses deletedincomes deletedpurchaseinvoices deletedpurchaseitems deletedsaleinvoices deletedsaleitems`.split(" ");

export const NAV_ITEMS: NavItem[] = [
  ...SECTIONS,
  ...routes.map(([path,title,icon,section,parent]) => item(path,title,icon,section,parent)),
  ...reportPaths.map(path => item(`/${path}`, path, "Chart", "reports", "/reports")),
  ...deletedPaths.map(path => item(`/${path}`, path, "FullHistory", "deleted", "/deletedlogs")),
];

const normalize = (path: string) => (path.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
const matches = (pattern: string, path: string) => {
  const expression = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:([A-Za-z]+)/g, "[^/]+");
  return new RegExp(`^${expression}$`, "i").test(path);
};

export function findNavItem(path: string) {
  const current = normalize(path);
  return NAV_ITEMS.find(nav => matches(nav.path, current));
}

export function breadcrumbFor(path: string): NavItem[] {
  const current = findNavItem(path) ?? item(path, path, "Home", "shell");
  const chain: NavItem[] = [];
  const seen = new Set<string>();
  let cursor: NavItem | undefined = current;
  while (cursor && !seen.has(cursor.path.toLowerCase())) {
    chain.unshift(cursor);
    seen.add(cursor.path.toLowerCase());
    cursor = cursor.parent ? findNavItem(cursor.parent) : undefined;
  }
  if (!chain.some(entry => entry.path.toLowerCase() === "/home")) chain.unshift(SECTIONS[0]);
  if (chain.length > 1) {
    const sectionTitle = current.section === "home" || current.section === "dashboard" || current.section === "org" ? "گشتی" : "CRM";
    chain.splice(1, 0, { ...SECTIONS[0], title: sectionTitle, section: current.section });
  }
  return chain;
}

export function searchNav(text: string) {
  const query = text.trim().toLocaleLowerCase();
  if (!query) return [];
  return NAV_ITEMS.filter(nav => [nav.title, ...nav.keywords].some(value => value.toLocaleLowerCase().includes(query))).slice(0, 12);
}

export const INDEX_LINKS = {
  usermanagement: [
    item("/users","بەکارهێنەرەکان","Admin","org"), item("/groups","گروپەکان","Group","org"),
    item("/employeelist","کارمەندەکان","Group","org"), item("/drivers","شۆفێرەکان","DeliveryTruck","org"),
  ],
  accountinfo: [
    item("/account/0","زیادکردنی خاوەن حساب","Add","accounts"), item("/accounts","خاوەن حسابەکان","WorkforceManagement","accounts"),
    item("/accountconfiguration","ڕێکخستنی پۆڵێنەکان","Settings","config"), item("/reportaccounts","ڕاپۆرتی خاوەن حساب","Chart","accounts"),
  ],
  accounting: [item("/expense","خەرجیەکان","PageCheckedOut","accounting"),item("/income","داهاتەکان","PageCheckedin","accounting"),item("/accountingconfigurations","ڕیکخستنەکانی خەرجی و داهات","Settings","config")],
  comparestore: [item("/storeregister/0","زیادکردنی جەردی مەخزەن","Add","items"),item("/storeregistrylist","جەردی مەخزەن","Packages","items"),item("/reportcheckinventory","ڕاپۆرتی جەردی مەخزەن","Chart","items")],
  deletedlogs: deletedPaths.map(path => findNavItem(`/${path}`)!),
};