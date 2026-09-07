import { useEffect, useState, type ReactNode } from "react";
import {
  getGetBackupStatusQueryKey,
  getListBackupJobsQueryKey,
  useCreateBackupNow,
  useGetBackupStatus,
  useListBackupJobs,
  useUpdateBackupSettings,
  useVerifyBackup,
  useSendLatestBackupToTelegram,
  useSendTelegramCrmReport,
  usePrepareBackupRestore,
  downloadCompletedBackup,
  type BackupSettingsInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  DatabaseBackup,
  RefreshCw,
  Send,
  ShieldCheck,
  Clock,
  X,
  Plus,
  AlertTriangle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as Dialog from "@radix-ui/react-dialog";

const labels: Record<string, string> = {
  queued: "لە ڕیزدایە",
  running: "لە جێبەجێکردندایە",
  completed: "تەواوبوو",
  failed: "شکستی هێنا",
  manual: "دەستی",
  scheduled: "خشتەکراو",
  pre_restore: "پێش گەڕاندنەوە",
};

export default function BackupAdministration() {
  const client = useQueryClient();
  const status = useGetBackupStatus();
  const jobs = useListBackupJobs({
    query: { queryKey: getListBackupJobsQueryKey(), refetchInterval: 5000 },
  });
  
  const create = useCreateBackupNow();
  const save = useUpdateBackupSettings();
  const verify = useVerifyBackup();
  const sendLatest = useSendLatestBackupToTelegram();
  const sendReport = useSendTelegramCrmReport();
  const prepareRestore = usePrepareBackupRestore();

  const [settings, setSettings] = useState<BackupSettingsInput | null>(null);
  const [restoreJobId, setRestoreJobId] = useState<number | null>(null);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  useEffect(() => {
    if (status.data) {
      setSettings({
        enabled: status.data.schedule.enabled,
        frequency: status.data.schedule.frequency,
        localTime: status.data.schedule.localTime,
        dayOfWeek: status.data.schedule.dayOfWeek ?? null,
        dayOfMonth: status.data.schedule.dayOfMonth ?? null,
        customCron: status.data.schedule.customCron ?? null,
        retentionCount: status.data.schedule.retentionCount,
        telegramChatId: status.data.schedule.telegramChatId ?? "",
        telegramBotToken: "",
        telegramDailyReportEnabled: status.data.schedule.telegramDailyReportEnabled,
        telegramDailyReportTimes: status.data.schedule.telegramDailyReportTimes || [],
        telegramMonthlyReportEnabled: status.data.schedule.telegramMonthlyReportEnabled,
        telegramAttachBackup: status.data.schedule.telegramAttachBackup,
        telegramBackupSendTimes: status.data.schedule.telegramBackupSendTimes || [],
      });
    }
  }, [status.data]);

  const refresh = () => {
    void client.invalidateQueries({ queryKey: getGetBackupStatusQueryKey() });
    void client.invalidateQueries({ queryKey: getListBackupJobsQueryKey() });
  };

  const saveSettings = () => {
    if (!settings) return;
    const payload = { ...settings };
    if (!payload.telegramBotToken) {
      delete payload.telegramBotToken;
    }
    save.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast.success("ڕێکخستنەکان بە سەرکەوتوویی پاشەکەوت کران");
          refresh();
        },
        onError: () => toast.error("هەڵەیەک ڕوویدا لە پاشەکەوتکردندا"),
      }
    );
  };

  const handleDownload = async (id: number) => {
    try {
      if (typeof downloadCompletedBackup === "function") {
        const res = await downloadCompletedBackup(id);
        if (res instanceof Blob) {
          const url = window.URL.createObjectURL(res);
          const a = document.createElement("a");
          a.href = url;
          a.download = `rawand-backup-${id}.sql.gz.aes`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          return;
        }
      }
    } catch {
      toast.error("هەڵەیەک ڕوویدا لە داگرتن");
    }
  };

  if (status.isLoading) return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">چاوەڕێ بکە...</div>;
  if (status.isError || !status.data) return <div className="flex min-h-[50vh] items-center justify-center text-red-600">نەتوانرا زانیارییەکانی باکئەپ بهێنرێن.</div>;

  return (
    <main dir="rtl" className="mx-auto max-w-6xl space-y-6 p-4 md:p-8 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--crm-border)] pb-5 dark:border-[#2a303c]">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--crm-link)] dark:text-blue-400">
             <DatabaseBackup className="h-7 w-7" /> باکئەپ و تێلێگرام
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            پاراستنی داتابەیس بە شێوەی کۆمپریس و AES-256-GCM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={!settings || save.isPending}
            onClick={saveSettings}
            className="flex items-center gap-2 rounded-md bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {save.isPending ? "چاوەڕێ بکە..." : "پاشەکەوتکردن"}
          </button>
          <button
            disabled={create.isPending || !status.data.encryptionConfigured}
            onClick={() =>
              create.mutate(undefined, {
                onSuccess: () => {
                  toast.success("باکئەپ دەستی پێکرد");
                  refresh();
                },
                onError: () => toast.error("هەڵەیەک ڕوویدا لە دروستکردنی باکئەپ"),
              })
            }
            className="rounded-md bg-[var(--crm-link)] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending ? "چاوەڕێ بکە..." : "ئێستا باکئەپ وەربگرە"}
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard
          icon={<ShieldCheck className="h-6 w-6" />}
          title="پاراستن (Encryption)"
          ok={status.data.encryptionConfigured}
          text={status.data.encryptionConfigured ? "کلیلی نهێنی ئامادەیە" : "کلیل ڕێکنەخراوە"}
        />
        <StatusCard
          icon={<Send className="h-6 w-6" />}
          title="تێلێگرام (Telegram)"
          ok={status.data.telegramConfigured}
          text={status.data.telegramConfigured ? "Bot و چات ڕێکخراون" : "تێلێگرام ڕێکنەخراوە"}
        />
        <StatusCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="کاتی ناوخۆیی (Timezone)"
          ok
          text={status.data.timezone || "Asia/Baghdad"}
        />
      </section>

      {settings && (
        <section className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-6 shadow-sm dark:border-[#2a303c] dark:bg-[#151a21]">
          <div className="mb-6 flex items-center justify-between border-b border-[var(--crm-border)] pb-4 dark:border-[#2a303c]">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[var(--crm-link)]" />
              <h2 className="text-lg font-bold">خشتەی باکئەپ</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">چالاکردن</label>
              <Switch
                checked={settings.enabled}
                onChange={(v) => setSettings({ ...settings, enabled: v })}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">دووبارەبوونەوە</label>
              <select
                className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2 focus:border-[var(--crm-link)] focus:ring-1 focus:ring-[var(--crm-link)] dark:border-[#2a303c] dark:bg-[#0d1117]"
                value={settings.frequency}
                onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
              >
                <option value="daily">ڕۆژانە</option>
                <option value="weekly">هەفتانە</option>
                <option value="monthly">مانگانە</option>
                <option value="custom">تایبەت (cron)</option>
              </select>
            </div>

            {settings.frequency !== "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">کات (کاتی ناوخۆیی)</label>
                <input
                  type="time"
                  className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2 focus:border-[var(--crm-link)] focus:ring-1 focus:ring-[var(--crm-link)] dark:border-[#2a303c] dark:bg-[#0d1117]"
                  value={settings.localTime}
                  onChange={(e) => setSettings({ ...settings, localTime: e.target.value })}
                />
              </div>
            )}

            {settings.frequency === "weekly" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">ڕۆژی هەفتە</label>
                <select
                  className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2 focus:border-[var(--crm-link)] focus:ring-1 focus:ring-[var(--crm-link)] dark:border-[#2a303c] dark:bg-[#0d1117]"
                  value={settings.dayOfWeek || 0}
                  onChange={(e) => setSettings({ ...settings, dayOfWeek: Number(e.target.value) })}
                >
                  <option value="0">یەکشەممە</option>
                  <option value="1">دووشەممە</option>
                  <option value="2">سێشەممە</option>
                  <option value="3">چوارشەممە</option>
                  <option value="4">پێنجشەممە</option>
                  <option value="5">هەینی</option>
                  <option value="6">شەممە</option>
                </select>
              </div>
            )}

            {settings.frequency === "monthly" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">ڕۆژی مانگ</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2 focus:border-[var(--crm-link)] focus:ring-1 focus:ring-[var(--crm-link)] dark:border-[#2a303c] dark:bg-[#0d1117]"
                  value={settings.dayOfMonth || 1}
                  onChange={(e) => setSettings({ ...settings, dayOfMonth: Number(e.target.value) })}
                />
              </div>
            )}

            {settings.frequency === "custom" && (
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-medium">Cron Expression</label>
                <input
                  type="text"
                  dir="ltr"
                  className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2 focus:border-[var(--crm-link)] focus:ring-1 focus:ring-[var(--crm-link)] dark:border-[#2a303c] dark:bg-[#0d1117]"
                  value={settings.customCron || ""}
                  onChange={(e) => setSettings({ ...settings, customCron: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">ژمارەی پاراستن (مێژوو)</label>
              <input
                type="number"
                min="1"
                max="365"
                className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2 focus:border-[var(--crm-link)] focus:ring-1 focus:ring-[var(--crm-link)] dark:border-[#2a303c] dark:bg-[#0d1117]"
                value={settings.retentionCount}
                onChange={(e) => setSettings({ ...settings, retentionCount: Number(e.target.value) })}
              />
            </div>
          </div>
        </section>
      )}

      {settings && (
        <section className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-6 shadow-sm dark:border-[#2a303c] dark:bg-[#111419]">
          <div className="mb-6 flex items-center gap-3 border-b border-[var(--crm-border)] pb-4 dark:border-[#2a303c]">
            <Send className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">تێلێگرام — ناردنی ڕاپۆرت</h2>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">بۆت تۆکین (Bot Token)</label>
              <input
                type="password"
                dir="ltr"
                autoComplete="new-password"
                className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2.5 text-left text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#2a303c] dark:bg-[#0d1117] dark:text-gray-200"
                placeholder="123456:ABCdef..."
                value={settings.telegramBotToken || ""}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
              />
              {status.data.telegramConfigured && !settings.telegramBotToken && (
                <p className="mt-1 text-xs font-medium text-green-600 dark:text-green-400">
                  ✓ پێشتر تۆکین پاشەکەوت کراوە (شاراوەیە)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">چات ئایدی یان کەناڵ</label>
              <input
                type="text"
                dir="ltr"
                className="w-full rounded-md border border-[var(--crm-border)] bg-transparent p-2.5 text-left text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#2a303c] dark:bg-[#0d1117] dark:text-gray-200"
                placeholder="-100123456789"
                value={settings.telegramChatId || ""}
                onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <ToggleRow
              label="ڕاپۆرتی ڕۆژانەی ئۆتۆماتیکی"
              description="هەموو ڕۆژ لە کاتەکانی دیاریکراودا دەنێرێت"
              checked={settings.telegramDailyReportEnabled}
              onChange={(v) => setSettings({ ...settings, telegramDailyReportEnabled: v })}
            >
              {settings.telegramDailyReportEnabled && (
                <TimeListManager
                  times={settings.telegramDailyReportTimes}
                  onChange={(t) => setSettings({ ...settings, telegramDailyReportTimes: t })}
                  label="کاتەکانی ناردن (کاتی عێراق) — دەتوانی چەند کاتێک زیاد بکەی"
                  addButtonText="زیادکردنی کاتی نوێ +"
                />
              )}
            </ToggleRow>

            <ToggleRow
              label="ڕاپۆرتی مانگانەی ئۆتۆماتیکی"
              description="لە ڕۆژی کۆتایی هەر مانگێک کاتژمێر ١١:٣٠ ی شەو ڕاپۆرتی هەمان مانگ، و دواتر لە ڕۆژی ١ی مانگی نوێ ڕاپۆرتی مانگی پێشوو خۆی دەنێرێت"
              checked={settings.telegramMonthlyReportEnabled}
              onChange={(v) => setSettings({ ...settings, telegramMonthlyReportEnabled: v })}
            />

            <ToggleRow
              label="باکئەپ لەگەڵ ڕاپۆرتی ڕۆژانە"
              description="هەر کاتێک ڕاپۆرتی ڕۆژانە بنێرێت بۆ تێلێگرام، فایلی پاشکەوتی داتابەیسیشی پێوە بەستراوە دەنێرێت"
              checked={settings.telegramAttachBackup}
              onChange={(v) => setSettings({ ...settings, telegramAttachBackup: v })}
            />

            <ToggleRow
              label="کاتە جیاوازەکانی باکئەپ بۆ تێلێگرام"
              description="دەتوانی چەند کاتێک بە دڵی خۆت دابنێی بۆ ناردنی فایلی پاشکەوت — جیا لە ڕاپۆرتی ڕۆژانە"
              checked={settings.telegramBackupSendTimes.length > 0}
              onChange={(v) => setSettings({ ...settings, telegramBackupSendTimes: v ? ["20:00"] : [] })}
              hasBottomBorder={false}
            >
              {settings.telegramBackupSendTimes.length > 0 && (
                <TimeListManager
                  times={settings.telegramBackupSendTimes}
                  onChange={(t) => setSettings({ ...settings, telegramBackupSendTimes: t })}
                  label="کاتەکانی ناردنی باکئەپ (کاتی عێراق)"
                  addButtonText="زیادکردنی کاتی نوێ بۆ باکئەپ +"
                />
              )}
            </ToggleRow>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--crm-border)] pt-6 dark:border-[#2a303c]">
             <div />
             <button
               onClick={() =>
                 sendLatest.mutate(undefined, {
                    onSuccess: () => toast.success("باکئەپ نێردرا بۆ تێلێگرام"),
                    onError: () => toast.error("ناردنی باکئەپ بۆ تێلێگرام سەرکەوتوو نەبوو"),
                 })
               }
               disabled={sendLatest.isPending || !status.data.telegramConfigured}
               className="flex items-center gap-2 rounded-md border border-[var(--crm-border)] bg-transparent px-5 py-2 text-sm font-medium transition-colors hover:bg-[var(--crm-tile)] disabled:opacity-50 dark:border-[#2a303c] dark:text-gray-200 dark:hover:bg-[#1f2632]"
             >
               <Send className="h-4 w-4" />
                <span>ئێستا باکئەپ بنێرە بە تێلێگرام</span>
             </button>
          </div>

          <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
            <div>
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                ناردنی ڕاپۆرتی ماوەی دیاریکراو
              </h3>
              <p className="mt-1 text-xs leading-6 text-gray-500 dark:text-gray-400">
                بەرواری دەستپێک و کۆتایی دیاری بکە بۆ ناردنی کورتەی فرۆشتن، کڕین، داهات و خەرجی بۆ هەمان بۆتی تێلێگرام.
              </p>
            </div>
            <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <label className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                لە بەرواری
                <input
                  type="date"
                  dir="ltr"
                  value={reportFrom}
                  onChange={(event) => setReportFrom(event.target.value)}
                  className="block h-10 w-full rounded-md border border-[var(--crm-border)] bg-transparent px-3 font-mono text-sm text-[var(--crm-text)] outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-[#2a303c] dark:bg-[#0d1117]"
                />
              </label>
              <label className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                تا بەرواری
                <input
                  type="date"
                  dir="ltr"
                  value={reportTo}
                  onChange={(event) => setReportTo(event.target.value)}
                  className="block h-10 w-full rounded-md border border-[var(--crm-border)] bg-transparent px-3 font-mono text-sm text-[var(--crm-text)] outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:border-[#2a303c] dark:bg-[#0d1117]"
                />
              </label>
              <button
                type="button"
                disabled={
                  sendReport.isPending
                  || !status.data.telegramConfigured
                  || !reportFrom
                  || !reportTo
                  || reportFrom > reportTo
                }
                onClick={() => sendReport.mutate(
                  {
                    data: {
                      from: reportFrom,
                      to: reportTo,
                      attachBackup: settings.telegramAttachBackup,
                    },
                  },
                  {
                    onSuccess: () => toast.success("ڕاپۆرتەکە نێردرا بۆ تێلێگرام"),
                    onError: () => toast.error("ناردنی ڕاپۆرتەکە سەرکەوتوو نەبوو"),
                  },
                )}
                className="flex h-10 items-center justify-center gap-2 rounded-md border border-amber-500/40 px-5 text-sm font-bold text-amber-700 transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-400"
              >
                <Send className="h-4 w-4" />
                {sendReport.isPending ? "ناردن..." : "بنێرە"}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm dark:border-[#2a303c] dark:bg-[#151a21]">
        <div className="flex items-center justify-between border-b border-[var(--crm-border)] bg-gray-50/50 p-5 dark:border-[#2a303c] dark:bg-[#111419]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <DatabaseBackup className="h-5 w-5 text-[var(--crm-link)]" /> مێژووی باکئەپ
          </h2>
          <button
            onClick={refresh}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
            title="نوێکردنەوە"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="border-b border-[var(--crm-border)] bg-gray-50/30 text-gray-600 dark:border-[#2a303c] dark:bg-[#111419] dark:text-gray-400">
              <tr>
                <th className="p-4 font-semibold">ژمارە</th>
                <th className="p-4 font-semibold">جۆر</th>
                <th className="p-4 font-semibold">دۆخ</th>
                <th className="p-4 font-semibold">کات</th>
                <th className="p-4 font-semibold">تێلێگرام</th>
                <th className="p-4 font-semibold text-left">کردارەکان</th>
              </tr>
            </thead>
            <tbody>
              {(jobs.data || []).map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-[var(--crm-border)] last:border-0 hover:bg-gray-50/30 dark:border-[#2a303c] dark:hover:bg-[#1a212a]"
                >
                  <td className="p-4 font-mono text-gray-900 dark:text-gray-200">#{job.id}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">{labels[job.kind] || job.kind}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        job.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : job.status === "failed"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {labels[job.status] || job.status}
                    </span>
                    {job.error && <p className="mt-1 max-w-[200px] text-xs text-red-500">{job.error}</p>}
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300" dir="ltr">
                    {new Date(job.createdAt).toLocaleString("ku-IQ", {
                      timeZone: "Asia/Baghdad",
                    })}
                  </td>
                  <td className="p-4 text-xs text-gray-500 dark:text-gray-400">
                    {job.telegramAttempts?.at(-1)?.status ?? "—"}
                  </td>
                  <td className="p-4 text-left">
                    {job.status === "completed" && (
                      <div className="flex items-center justify-end gap-3 font-medium">
                        <button
                          onClick={() =>
                            verify.mutate(
                              { id: job.id },
                              {
                                onSuccess: () => toast.success("پشکنین سەرکەوتوو بوو، داتاکە سەلامەتە"),
                                onError: () => toast.error("هەڵەیەک ڕوویدا لە پشکنین"),
                              }
                            )
                          }
                          disabled={verify.isPending}
                          className="text-[var(--crm-link)] hover:underline disabled:opacity-50"
                        >
                          پشکنین
                        </button>
                        <button
                          onClick={() => handleDownload(job.id)}
                          className="text-[var(--crm-link)] hover:underline disabled:opacity-50"
                        >
                          داگرتن
                        </button>
                        <button
                          onClick={() => setRestoreJobId(job.id)}
                          className="text-red-600 hover:underline"
                        >
                          گەڕاندنەوە...
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(!jobs.data || jobs.data.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    هیچ باکئەپێک نەدۆزرایەوە.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Restore Preparation Dialog */}
      <Dialog.Root open={!!restoreJobId} onOpenChange={(o) => !o && setRestoreJobId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            dir="rtl"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[var(--crm-surface)] p-6 shadow-xl dark:border dark:border-[#2a303c] dark:bg-[#151a21]"
          >
            <Dialog.Title className="flex items-center gap-2 text-xl font-bold text-red-600">
              <AlertTriangle className="h-6 w-6" />
              ئامادەکاری بۆ گەڕاندنەوەی داتابەیس
            </Dialog.Title>
            <div className="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-bold text-red-500">ئاگاداربە: هێشتا هیچ داتایەک نەگەڕێندراوەتەوە.</p>
              <p>ئەم هەنگاوە تەنها ئامادەکارییە و دڵنیایی دەدات لە سەلامەتی داتاکانت:</p>
              <ul className="list-disc space-y-1.5 pr-5">
                <li>باکئەپی ژمارە #{restoreJobId} بەکاردێت وەک سەرچاوەی گەڕاندنەوە.</li>
                <li>باکئەپێکی نوێی زۆرەملێ دروست دەکرێت بۆ پاراستنی داتای ئێستات.</li>
                <li>دوای تەواوبوونی ئەم ئامادەکارییە، پێویستە پرۆسەی گەڕاندنەوە لەلایەن ئەدمینەوە تەواو بکرێت.</li>
              </ul>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setRestoreJobId(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                پاشگەزبوونەوە
              </button>
              <button
                onClick={() => {
                  if (!restoreJobId) return;
                  prepareRestore.mutate(
                    { id: restoreJobId },
                    {
                      onSuccess: () => {
                        toast.success("ئامادەکاری دەستی پێکرد");
                        setRestoreJobId(null);
                        refresh();
                      },
                      onError: () => toast.error("هەڵەیەک ڕوویدا لە ئامادەکاری گەڕاندنەوەدا"),
                    }
                  );
                }}
                disabled={prepareRestore.isPending}
                className="rounded-md bg-red-600 px-5 py-2 text-sm font-bold text-white transition-opacity hover:bg-red-700 disabled:opacity-50"
              >
                {prepareRestore.isPending ? "چاوەڕێ بکە..." : "بەڵێ، ئامادە بکە"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </main>
  );
}

function StatusCard({
  icon,
  title,
  text,
  ok,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  ok: boolean;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] p-5 shadow-sm dark:border-[#2a303c] dark:bg-[#151a21]">
      <span className={`rounded-full p-2 ${ok ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`}>
        {icon}
      </span>
      <div>
        <b className="text-sm text-gray-900 dark:text-gray-100">{title}</b>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{text}</p>
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--crm-link)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-700"
      dir="rtl"
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:-translate-x-5 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitive.Root>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  children,
  hasBottomBorder = true,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  children?: ReactNode;
  hasBottomBorder?: boolean;
}) {
  return (
    <div className={`py-5 ${hasBottomBorder ? "border-b border-[var(--crm-border)] dark:border-[#2a303c]" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{label}</h3>
          {description && <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <div className="pt-1">
          <Switch checked={checked} onChange={onChange} />
        </div>
      </div>
      {children}
    </div>
  );
}

function TimeListManager({
  times,
  onChange,
  label,
  addButtonText,
}: {
  times: string[];
  onChange: (t: string[]) => void;
  label: string;
  addButtonText: string;
}) {
  const addTime = () => {
    if (times.length < 12) onChange([...times, "20:00"]);
  };
  const removeTime = (idx: number) => {
    onChange(times.filter((_, i) => i !== idx));
  };
  const updateTime = (idx: number, val: string) => {
    const newTimes = [...times];
    newTimes[idx] = val;
    onChange(newTimes);
  };

  return (
    <div className="mt-4 rounded-lg border border-[var(--crm-border)] bg-gray-50 p-4 dark:border-[#2a303c] dark:bg-[#0d1117]">
      <p className="mb-4 flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
        <Clock className="h-4 w-4" /> {label}
      </p>
      <div className="flex flex-wrap gap-3">
        {times.map((t, idx) => (
          <div
            key={idx}
            className="flex items-center rounded-md border border-[var(--crm-border)] bg-white pr-2 shadow-sm transition-colors focus-within:border-blue-500 dark:border-[#2a303c] dark:bg-[#151a21]"
          >
            <input
              type="time"
              value={t}
              onChange={(e) => updateTime(idx, e.target.value)}
              className="bg-transparent py-1.5 pl-2 pr-1 text-sm font-mono outline-none dark:text-gray-200"
              dir="ltr"
            />
            <button
              onClick={() => removeTime(idx)}
              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
              title="سڕینەوە"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {times.length < 12 && (
          <button
            onClick={addTime}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            <Plus className="h-4 w-4" /> {addButtonText}
          </button>
        )}
      </div>
    </div>
  );
}
