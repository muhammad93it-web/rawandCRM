import { useEffect, useState, type ReactNode } from "react";
import {
  getGetBackupStatusQueryKey,
  getListBackupJobsQueryKey,
  useCreateBackupNow,
  useGetBackupStatus,
  useListBackupJobs,
  useUpdateBackupSettings,
  useVerifyBackup,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, DatabaseBackup, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const labels: Record<string, string> = {
  queued: "لە ڕیزدایە", running: "لە جێبەجێکردندایە", completed: "تەواوبوو", failed: "شکستی هێنا",
  manual: "دەستی", scheduled: "خشتەکراو", pre_restore: "پێش گەڕاندنەوە",
};

export default function BackupAdministration() {
  const client = useQueryClient();
  const status = useGetBackupStatus();
  const jobs = useListBackupJobs({ query: { queryKey: getListBackupJobsQueryKey(), refetchInterval: 5000 } });
  const create = useCreateBackupNow();
  const save = useUpdateBackupSettings();
  const verify = useVerifyBackup();
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [localTime, setLocalTime] = useState("02:00");
  const [retentionCount, setRetentionCount] = useState(14);
  const [day, setDay] = useState(1);
  const [customCron, setCustomCron] = useState("0 2 * * *");

  useEffect(() => {
    if (!status.data) return;
    setEnabled(status.data.schedule.enabled);
    setFrequency(status.data.schedule.frequency);
    setLocalTime(status.data.schedule.localTime);
    setRetentionCount(status.data.schedule.retentionCount);
    setDay(status.data.schedule.dayOfWeek ?? status.data.schedule.dayOfMonth ?? 1);
    setCustomCron(status.data.schedule.customCron ?? "0 2 * * *");
  }, [status.data]);

  const refresh = () => {
    void client.invalidateQueries({ queryKey: getGetBackupStatusQueryKey() });
    void client.invalidateQueries({ queryKey: getListBackupJobsQueryKey() });
  };

  if (status.isLoading) return <div className="p-8 text-center">چاوەڕێ بکە...</div>;
  if (status.isError || !status.data) return <div className="p-8 text-center text-red-600">نەتوانرا زانیارییەکانی backup بهێنرێن.</div>;

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-5 p-4 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0f4c81]/20 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[#0f4c81]"><DatabaseBackup /> Backup و Telegram</h1>
          <p className="mt-1 text-sm text-gray-500">پاراستنی داتابەیس بە شێوەی کۆمپریس و AES-256-GCM</p>
        </div>
        <button
          disabled={create.isPending || !status.data.encryptionConfigured}
          onClick={() => create.mutate(undefined, {
            onSuccess: () => { toast.success("Backup خراوەتە ڕیزەوە"); refresh(); },
            onError: () => toast.error("دروستکردنی backup سەرکەوتوو نەبوو"),
          })}
          className="rounded bg-[#0f4c81] px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? "چاوەڕێ بکە..." : "ئێستا Backup وەربگرە"}
        </button>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <StatusCard icon={<ShieldCheck />} title="پاراستن" ok={status.data.encryptionConfigured}
          text={status.data.encryptionConfigured ? "کلیلی نهێنی ئامادەیە" : "BACKUP_ENCRYPTION_KEY ڕێکنەخراوە"} />
        <StatusCard icon={<Send />} title="Telegram" ok={status.data.telegramConfigured}
          text={status.data.telegramConfigured ? "Bot و chat ڕێکخراون" : "Telegram ڕێکنەخراوە (ئارەزوومەندانەیە)"} />
        <StatusCard icon={<CheckCircle2 />} title="کاتی ناوخۆیی" ok text="Asia/Baghdad" />
      </section>

      <section className="rounded border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-[#0f4c81]">خشتەی Backup</h2>
        <div className="grid items-end gap-4 md:grid-cols-5">
          <label className="text-sm">چالاک
            <input className="mr-3" type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          </label>
          <label className="text-sm">دووبارەبوونەوە
            <select className="mt-1 w-full rounded border p-2" value={frequency} onChange={(event) => setFrequency(event.target.value as typeof frequency)}>
              <option value="daily">ڕۆژانە</option><option value="weekly">هەفتانە</option>
              <option value="monthly">مانگانە</option><option value="custom">تایبەت (cron)</option>
            </select>
          </label>
          <label className="text-sm">کات
            <input className="mt-1 w-full rounded border p-2" type="time" value={localTime} onChange={(event) => setLocalTime(event.target.value)} />
          </label>
          {frequency === "custom" ? (
            <label className="text-sm">Cron
              <input className="mt-1 w-full rounded border p-2 text-left" dir="ltr" value={customCron} onChange={(event) => setCustomCron(event.target.value)} />
            </label>
          ) : frequency !== "daily" ? (
            <label className="text-sm">{frequency === "weekly" ? "ڕۆژی هەفتە (0-6)" : "ڕۆژی مانگ"}
              <input className="mt-1 w-full rounded border p-2" type="number" value={day} onChange={(event) => setDay(Number(event.target.value))} />
            </label>
          ) : <div />}
          <label className="text-sm">ژمارەی پاراستن
            <input className="mt-1 w-full rounded border p-2" min={1} max={365} type="number" value={retentionCount} onChange={(event) => setRetentionCount(Number(event.target.value))} />
          </label>
        </div>
        <button className="mt-4 rounded bg-[#00a6df] px-5 py-2 text-sm font-bold text-white" disabled={save.isPending}
          onClick={() => save.mutate({ data: {
            enabled, frequency, localTime, retentionCount,
            dayOfWeek: frequency === "weekly" ? day : null,
            dayOfMonth: frequency === "monthly" ? day : null,
            customCron: frequency === "custom" ? customCron : null,
          } }, { onSuccess: () => { toast.success("خشتەکە پاشەکەوت کرا"); refresh(); }, onError: () => toast.error("خشتەکە پاشەکەوت نەکرا") })}>
          پاشەکەوتکردن
        </button>
      </section>

      <section className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4"><h2 className="font-bold text-[#0f4c81]">مێژووی Backup</h2><RefreshCw className="h-4 w-4 text-gray-400" /></div>
        <div className="overflow-x-auto"><table className="w-full text-right text-sm"><thead className="bg-gray-50 text-gray-500"><tr>
          <th className="p-3">ژمارە</th><th className="p-3">جۆر</th><th className="p-3">دۆخ</th><th className="p-3">کات</th><th className="p-3">Telegram</th><th className="p-3">پشکنین</th>
        </tr></thead><tbody>{(jobs.data ?? []).map((job) => <tr key={job.id} className="border-t">
          <td className="p-3">#{job.id}</td><td className="p-3">{labels[job.kind]}</td>
          <td className={`p-3 font-bold ${job.status === "failed" ? "text-red-600" : job.status === "completed" ? "text-green-600" : "text-amber-600"}`}>{labels[job.status]}{job.error ? <small className="block max-w-xs font-normal">{job.error}</small> : null}</td>
          <td className="p-3" dir="ltr">{new Date(job.createdAt).toLocaleString("ku", { timeZone: "Asia/Baghdad" })}</td>
          <td className="p-3">{job.telegramAttempts?.at(-1)?.status ?? "—"}</td>
          <td className="p-3"><button disabled={job.status !== "completed" || verify.isPending} className="text-[#0f4c81] disabled:text-gray-300"
            onClick={() => verify.mutate({ id: job.id }, { onSuccess: () => toast.success("Checksum و encryption دروستن"), onError: () => toast.error("پشکنین سەرکەوتوو نەبوو") })}>پشکنین</button></td>
        </tr>)}</tbody></table></div>
      </section>
    </main>
  );
}

function StatusCard({ icon, title, text, ok }: { icon: ReactNode; title: string; text: string; ok: boolean }) {
  return <div className="flex gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm"><span className={ok ? "text-green-600" : "text-amber-600"}>{icon}</span><div><b className="text-sm">{title}</b><p className="mt-1 text-xs text-gray-500">{text}</p></div></div>;
}