import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCurrencyRate, useListCurrencyRates, useListCurrencies, getListCurrencyRatesQueryKey, getGetLatestCurrencyRateQueryKey, getListCurrenciesQueryKey } from "@workspace/api-client-react";
import { AccentButton, CrmDialog, DataTable, DateField, DangerIconButton, NumberField, OutlineButton, SelectField } from "@/components/crm";
import { toast } from "sonner";

const rateFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });

export function CurrencyDialog({open, onOpenChange}: {open: boolean; onOpenChange: (open: boolean) => void}) {
  const currencies = useListCurrencies();
  const rates = useListCurrencyRates();
  const create = useCreateCurrencyRate();
  const client = useQueryClient();
  const [currencyId, setCurrencyId] = useState("");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (currencies.data && !currencyId) {
      const dolar = currencies.data.find((currency) =>
        currency.name.toLocaleLowerCase("en-US") === "dolar"
        || currency.code.toLocaleUpperCase("en-US") === "USD"
      );
      if (dolar) {
        setCurrencyId(String(dolar.id));
      }
    }
  }, [currencies.data, currencyId]);

  const clear = () => setRate("");

  const submit = () => {
    create.mutate(
      { data: { currencyId: Number(currencyId), rate: Number(rate), rateDate: date } },
      {
        onSuccess: () => {
          clear();
          client.invalidateQueries({ queryKey: getListCurrencyRatesQueryKey() });
          client.invalidateQueries({ queryKey: getGetLatestCurrencyRateQueryKey() });
          client.invalidateQueries({ queryKey: getListCurrenciesQueryKey() });
          toast.success("نرخی دراو تۆمارکرا");
        },
        onError: () => {
          toast.error("هەڵەیەک ڕوویدا لە تۆمارکردنی نرخی دراو");
        }
      }
    );
  };

  return (
    <CrmDialog open={open} onOpenChange={onOpenChange} title="نرخی دراو" className="currency-dialog" footer={<OutlineButton onClick={() => onOpenChange(false)}>داخستن</OutlineButton>}>
      <div className="currency-form">
        <SelectField label="جۆری دراو" required value={currencyId} onChange={(event) => setCurrencyId(event.target.value)}>
          <option value="">جۆری دراو</option>
          {currencies.data?.map((currency) => <option key={currency.id} value={currency.id}>{currency.name}</option>)}
        </SelectField>
        <NumberField label="نرخ" required value={rate} onChange={(event) => setRate(event.target.value)} />
        <DateField label="بەروار" value={date} onChange={(event) => setDate(event.target.value)} />
        <AccentButton icon="Add" disabled={!currencyId || !rate || create.isPending} onClick={submit} />
        <DangerIconButton icon="ChromeClose" onClick={clear} />
      </div>
      <DataTable
        rows={rates.data ?? []}
        loading={rates.isLoading}
        columns={[
          { key: "currencyName", header: "ناو", sortable: true },
          { key: "rate", header: "نرخ", sortable: true, align: "number", render: (row) => rateFormatter.format(row.rate) },
          { key: "recordedByName", header: "تۆمارکراوە لە لایەن", sortable: true },
          { key: "rateDate", header: "بەروار", sortable: true, render: (row) => row.rateDate.slice(0, 10) }
        ]}
      />
    </CrmDialog>
  );
}
