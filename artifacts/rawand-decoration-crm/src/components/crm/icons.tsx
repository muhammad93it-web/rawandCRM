import type { ComponentType, SVGProps } from "react";
import * as Fluent from "@fluentui/react-icons";

export type Mdl2IconName =
  | "Home" | "ViewDashboard" | "CityNext2" | "PlayerSettings" | "AccountManagement" | "Settings"
  | "ChangeEntitlements" | "Repo" | "ShoppingCart" | "ActivateOrders" | "Packages" | "Financial"
  | "RecycleBin" | "GlobalNavButton" | "ChevronLeftMed" | "ChevronRightMed" | "AllCurrency"
  | "TagUnknown12" | "FullScreen" | "FavoriteStarFill" | "FavoriteStar" | "WifiWarning4" | "ClearNight"
  | "SignOut" | "Add" | "Sort" | "Filter" | "ReportWarning" | "ChevronRightSmall" | "ChevronLeftSmall"
  | "ChromeClose" | "DownloadDocument" | "PageHeaderEdit" | "DoubleChevronLeft8" | "DoubleChevronRight8"
  | "Info" | "Save" | "Unlock" | "PageCheckedOut" | "PageCheckedin" | "ReportDocument" | "Cancel"
  | "Admin" | "Group" | "ProductList" | "MapPin" | "ReturnKey" | "More" | "Clear" | "Search"
  | "BackToWindow" | "Edit" | "Chart" | "Delete" | "Combobox" | "Blocked" | "BulletedList"
  | "EntryView" | "WorkforceManagement" | "PageEdit" | "Upload" | "NumberField" | "CalculatorPercentage"
  | "DeliveryTruck" | "Shield" | "Car" | "View" | "Print" | "History" | "Script" | "Money"
  | "M365InvoicingLogo" | "List" | "DietPlanNotebook" | "Paste" | "ProfileSearch" | "Bank" | "Compare"
  | "EventAccepted" | "EventDeclined" | "Market" | "FullHistory" | "Undo" | "ChromeMinimize"
  | "LightningBolt" | "PasswordField" | "Lock" | "DoubleColumn" | "ClearFilter" | "GridViewMedium"
  | "BulletedList2" | "LinkedInLogo" | "ViewList";

type FluentIcon = ComponentType<SVGProps<SVGSVGElement> & { fontSize?: number | string }>;
const library = Fluent as unknown as Record<string, FluentIcon>;
const aliases: Partial<Record<Mdl2IconName, string>> = {
  ViewDashboard: "DataUsageRegular", CityNext2: "BuildingRegular", PlayerSettings: "PersonSettingsRegular",
  AccountManagement: "PeopleCommunityRegular", ChangeEntitlements: "ArrowSwapRegular", Repo: "BoxRegular",
  ActivateOrders: "DocumentBulletListRegular", Packages: "ArchiveRegular", Financial: "ChartMultipleRegular",
  RecycleBin: "DeleteRegular", GlobalNavButton: "NavigationRegular", ChevronLeftMed: "ChevronLeftRegular",
  ChevronRightMed: "ChevronRightRegular", AllCurrency: "MoneyRegular", TagUnknown12: "TagRegular",
  FullScreen: "FullScreenMaximizeRegular", FavoriteStarFill: "StarRegular", FavoriteStar: "StarRegular",
  WifiWarning4: "WifiWarningRegular", ClearNight: "WeatherMoonRegular", SignOut: "SignOutRegular",
  ReportWarning: "WarningRegular", ChromeClose: "DismissRegular", DownloadDocument: "DocumentArrowDownRegular",
  PageHeaderEdit: "DocumentEditRegular", DoubleChevronLeft8: "ChevronDoubleLeftRegular",
  DoubleChevronRight8: "ChevronDoubleRightRegular", PageCheckedOut: "DocumentArrowRightRegular",
  PageCheckedin: "DocumentArrowLeftRegular", ReportDocument: "DocumentDataRegular", Admin: "PersonRegular",
  ProductList: "BoxMultipleRegular", MapPin: "LocationRegular", ReturnKey: "ArrowEnterRegular",
  Clear: "DismissRegular", BackToWindow: "FullScreenMinimizeRegular", Chart: "DataTrendingRegular",
  Combobox: "ChevronDownRegular", Blocked: "ProhibitedRegular", EntryView: "FormRegular",
  WorkforceManagement: "PeopleRegular", NumberField: "NumberSymbolRegular",
  CalculatorPercentage: "CalculatorRegular", DeliveryTruck: "VehicleTruckRegular", View: "EyeRegular",
  Script: "DocumentTextRegular", M365InvoicingLogo: "ReceiptRegular", DietPlanNotebook: "NotebookRegular",
  Paste: "ClipboardPasteRegular", ProfileSearch: "PersonSearchRegular", Compare: "ArrowSwapRegular",
  EventAccepted: "CalendarCheckmarkRegular", EventDeclined: "CalendarCancelRegular", Market: "BuildingShopRegular",
  FullHistory: "HistoryRegular", ChromeMinimize: "SubtractRegular", LightningBolt: "FlashRegular",
  PasswordField: "PasswordRegular", DoubleColumn: "ColumnDoubleCompareRegular", ClearFilter: "FilterDismissRegular",
  GridViewMedium: "GridRegular", BulletedList2: "TextBulletListRegular", LinkedInLogo: "LinkRegular",
  ViewList: "TextBulletListRegular",
};

export function iconComponent(name: Mdl2IconName): FluentIcon {
  return library[aliases[name] ?? `${name}Regular`] ?? library.QuestionCircleRegular;
}