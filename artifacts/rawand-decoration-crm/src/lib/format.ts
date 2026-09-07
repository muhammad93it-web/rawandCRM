const number = (maximumFractionDigits: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits, minimumFractionDigits: 0 });
export function formatMoney(value: number | string | null | undefined, options: { currency: "IQD" | "USD" }) {
  const amount = Number(value ?? 0);
  return `${number(options.currency === "IQD" ? 0 : 2).format(Number.isFinite(amount) ? amount : 0)} ${options.currency === "USD" ? "$" : "IQD"}`;
}
export function formatQty(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return number(3).format(Number.isFinite(amount) ? amount : 0);
}
const validDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
export function formatDate(value: string | Date | null | undefined) {
  const date = validDate(value);
  return date ? `${String(date.getDate()).padStart(2,"0")}-${String(date.getMonth()+1).padStart(2,"0")}-${date.getFullYear()}` : "";
}
export function formatTime(value: string | Date | null | undefined) {
  const date = validDate(value);
  return date ? date.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "";
}
export function formatDateTime(value: string | Date | null | undefined) {
  return [formatDate(value), formatTime(value)].filter(Boolean).join(" ");
}