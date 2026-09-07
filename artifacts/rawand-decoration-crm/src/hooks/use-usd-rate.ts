import { useListCurrencies } from "@workspace/api-client-react";

const rateFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

/**
 * The IQD-per-USD rate configured in the currencies settings (code "USD").
 * `label` is null until a USD currency has been saved, so screens show an
 * empty value instead of an invented rate.
 */
export function useUsdRate() {
  const { data: currencies = [], isLoading } = useListCurrencies();
  const usd = currencies.find(
    (currency) => currency.code.trim().toUpperCase() === "USD" && currency.status === "active",
  );
  return {
    rate: usd?.rate ?? null,
    label: usd ? rateFormatter.format(usd.rate) : null,
    isLoading,
  };
}
