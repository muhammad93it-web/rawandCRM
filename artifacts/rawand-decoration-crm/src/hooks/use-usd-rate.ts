import { useGetLatestCurrencyRate } from "@workspace/api-client-react";

const rateFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

/**
 * The IQD-per-USD rate configured in the currencies settings (code "USD").
 * `label` is null until a USD currency has been saved, so screens show an
 * empty value instead of an invented rate.
 */
export function useUsdRate() {
  const { data: usd, isLoading } = useGetLatestCurrencyRate();
  const rate = typeof usd?.rate === "number" ? usd.rate : null;
  return {
    rate,
    label: rate === null ? null : rateFormatter.format(rate),
    isLoading,
  };
}
