import { useState } from "react";
import { FileWarning, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/lib/api-error";
import {
  useCreateEmployee,
  useCreateGroup,
  useCreateUser,
  useListEmployees,
  useListGroups,
  useListUsers,
  useListWorkplaces,
} from "@workspace/api-client-react";

function Empty({ loading, colSpan }: { loading: boolean; colSpan: number }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center font-bold text-gray-800 bg-white">{loading ? "لە بارکردندایە..." : <span className="inline-flex items-center gap-2">هیچ زانیارییەک بەردەست نییە <FileWarning className="h-4 w-4 text-orange-400" /></span>}</td></tr>;
}

export function UsersList() {
  const { data = [], isLoading, refetch } = useListUsers();
  const create = useCreateUser();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const add = () => {
    if (!username.trim() || !displayName.trim() || password.length < 8) {
      toast.error("ناوی بەکارهێنەر، ناوی پیشاندان و وشەی نهێنیی ٨ پیت پێویستن");
      return;
    }
    create.mutate({ data: { username, displayName, password } }, {
      onSuccess: () => {
        setUsername("");
        setDisplayName("");
        setPassword("");
        void refetch();
        toast.success("بەکارهێنەر زیادکرا");
      },
      onError: (err) => toast.error(getApiError(err))
    });
  };
  return <OrganizationFrame title="بەکارهێنەرەکان" onRefresh={() => void refetch()} form={<><input className="crm-dense-input w-48" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ناوی بەکارهێنەر" /><input className="crm-dense-input w-48" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ناوی پیشاندان" /><input className="crm-dense-input w-48" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="وشەی نهێنی" /><button onClick={add} disabled={create.isPending} className="flex h-[28px] items-center justify-center gap-2 bg-[#0f4c81] text-white px-4 rounded-sm text-xs font-bold disabled:opacity-50 hover:bg-[#0f4c81]/90"><Plus className="h-3.5 w-3.5" /> زیادکردن</button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناوی بەکارهێنەر</th><th className="p-2">ناوی پیشاندان</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((user) => <tr key={user.id} className="border-b border-gray-100 bg-white hover:bg-gray-50"><td className="p-2">{user.username}</td><td className="p-2">{user.displayName}</td><td className="p-2">{user.status}</td></tr>) : <Empty loading={isLoading} colSpan={3} />}</tbody></table></OrganizationFrame>;
}

export function GroupsList() {
  const { data = [], isLoading, refetch } = useListGroups();
  const create = useCreateGroup();
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) { toast.error("ناوی ڕۆڵ پێویستە"); return; }
    create.mutate({ data: { name } }, { onSuccess: () => { setName(""); void refetch(); toast.success("ڕۆڵ زیادکرا"); }, onError: (err) => toast.error(getApiError(err)) });
  };
  return <OrganizationFrame title="ڕۆڵەکان و دەسەڵاتەکان" onRefresh={() => void refetch()} form={<><input className="crm-dense-input w-64" value={name} onChange={(e) => setName(e.target.value)} placeholder="ناوی ڕۆڵ" /><button onClick={add} disabled={create.isPending} className="flex h-[28px] items-center justify-center gap-2 bg-[#0f4c81] text-white px-4 rounded-sm text-xs font-bold disabled:opacity-50 hover:bg-[#0f4c81]/90"><Plus className="h-3.5 w-3.5" /> زیادکردن</button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">دەسەڵاتەکان</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((group) => <tr key={group.id} className="border-b border-gray-100 bg-white hover:bg-gray-50"><td className="p-2">{group.name}</td><td className="p-2">{group.permissions.join(", ") || "-"}</td><td className="p-2">{group.status}</td></tr>) : <Empty loading={isLoading} colSpan={3} />}</tbody></table></OrganizationFrame>;
}

export function EmployeesList() {
  const { data = [], isLoading, refetch } = useListEmployees();
  const { data: workplaces = [], isLoading: workplacesLoading } = useListWorkplaces();
  const create = useCreateEmployee();
  const [workplaceId, setWorkplaceId] = useState("");
  const [name, setName] = useState("");
  const add = () => {
    if (!workplaceId) {
      toast.error("تکایە شوێنکار هەڵبژێرە، پێشتر شوێنکارێک دروست بکە ئەگەر بوونی نییە");
      return;
    }
    if (!name.trim()) {
      toast.error("ناوی کارمەند پێویستە");
      return;
    }
    create.mutate({ data: { workplaceId: Number(workplaceId), name } }, { onSuccess: () => { setName(""); void refetch(); toast.success("کارمەند زیادکرا"); }, onError: (err) => toast.error(getApiError(err)) });
  };
  return <OrganizationFrame title="کارمەندەکان" onRefresh={() => void refetch()} form={<><select className="crm-dense-select w-48" value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)} disabled={workplacesLoading}><option value="">شوێنکار</option>{workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}</select><input className="crm-dense-input w-48" value={name} onChange={(e) => setName(e.target.value)} placeholder="ناوی کارمەند" /><button onClick={add} disabled={create.isPending} className="flex h-[28px] items-center justify-center gap-2 bg-[#0f4c81] text-white px-4 rounded-sm text-xs font-bold disabled:opacity-50 hover:bg-[#0f4c81]/90"><Plus className="h-3.5 w-3.5" /> زیادکردن</button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">شوێنکار</th><th className="p-2">پیشە</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((employee) => <tr key={employee.id} className="border-b border-gray-100 bg-white hover:bg-gray-50"><td className="p-2">{employee.name}</td><td className="p-2">{workplaces.find((workplace) => workplace.id === employee.workplaceId)?.name ?? `#${employee.workplaceId}`}</td><td className="p-2">{employee.jobTitle || "-"}</td><td className="p-2">{employee.status}</td></tr>) : <Empty loading={isLoading} colSpan={4} />}</tbody></table></OrganizationFrame>;
}

function OrganizationFrame({ title, onRefresh, form, children }: { title: string; onRefresh: () => void; form: React.ReactNode; children: React.ReactNode }) {
  return <div dir="rtl"><div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-bold text-gray-800">{title}</h1><button onClick={onRefresh} className="flex h-8 items-center gap-2 rounded bg-white border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div><div className="crm-dense-panel mb-4 flex gap-3 flex-wrap items-end border-[#deecf9]">{form}</div><div className="overflow-x-auto border border-[#deecf9] rounded-sm">{children}</div></div>;
}
