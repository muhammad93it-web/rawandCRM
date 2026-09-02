import { useState } from "react";
import { FileWarning, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
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
  return <tr><td colSpan={colSpan} className="p-8 text-center font-bold text-gray-800">{loading ? "لە بارکردندایە..." : <span className="inline-flex items-center gap-2">هیچ زانیارییەک بەردەست نییە <FileWarning className="h-4 w-4 text-orange-400" /></span>}</td></tr>;
}

export function UsersList() {
  const { data = [], isLoading, refetch } = useListUsers();
  const create = useCreateUser();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const add = () => {
    if (!username.trim() || !displayName.trim() || password.length < 8) { toast.error("ناو، ناوی پیشاندان و وشەی نهێنیی ٨ پیت پێویستن"); return; }
    create.mutate({ data: { username, displayName, password } }, { onSuccess: () => { setUsername(""); setDisplayName(""); setPassword(""); void refetch(); toast.success("بەکارهێنەر زیادکرا"); }, onError: () => toast.error("بەکارهێنەر زیاد نەکرا") });
  };
  return <OrganizationFrame title="بەکارهێنەرەکان" onRefresh={() => void refetch()} form={<><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ناوی بەکارهێنەر" /><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ناوی پیشاندان" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="وشەی نهێنی" /><button onClick={add} className="bg-[#0f4c81] text-white"><Plus className="mx-auto h-4 w-4" /></button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناوی بەکارهێنەر</th><th className="p-2">ناوی پیشاندان</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((user) => <tr key={user.id} className="border-b border-gray-100"><td className="p-2">{user.username}</td><td className="p-2">{user.displayName}</td><td className="p-2">{user.status}</td></tr>) : <Empty loading={isLoading} colSpan={3} />}</tbody></table></OrganizationFrame>;
}

export function GroupsList() {
  const { data = [], isLoading, refetch } = useListGroups();
  const create = useCreateGroup();
  const [name, setName] = useState("");
  const add = () => {
    if (!name.trim()) { toast.error("ناوی ڕۆڵ پێویستە"); return; }
    create.mutate({ data: { name } }, { onSuccess: () => { setName(""); void refetch(); toast.success("ڕۆڵ زیادکرا"); }, onError: () => toast.error("ڕۆڵ زیاد نەکرا") });
  };
  return <OrganizationFrame title="ڕۆڵەکان و دەسەڵاتەکان" onRefresh={() => void refetch()} form={<><input value={name} onChange={(e) => setName(e.target.value)} placeholder="ناوی ڕۆڵ" /><button onClick={add} className="bg-[#0f4c81] text-white"><Plus className="mx-auto h-4 w-4" /></button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">دەسەڵاتەکان</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((group) => <tr key={group.id} className="border-b border-gray-100"><td className="p-2">{group.name}</td><td className="p-2">{group.permissions.join(", ") || "-"}</td><td className="p-2">{group.status}</td></tr>) : <Empty loading={isLoading} colSpan={3} />}</tbody></table></OrganizationFrame>;
}

export function EmployeesList() {
  const { data = [], isLoading, refetch } = useListEmployees();
  const { data: workplaces = [] } = useListWorkplaces();
  const create = useCreateEmployee();
  const [workplaceId, setWorkplaceId] = useState("");
  const [name, setName] = useState("");
  const add = () => {
    if (!workplaceId || !name.trim()) { toast.error("شوێنکار و ناو پێویستن"); return; }
    create.mutate({ data: { workplaceId: Number(workplaceId), name } }, { onSuccess: () => { setName(""); void refetch(); toast.success("کارمەند زیادکرا"); }, onError: () => toast.error("کارمەند زیاد نەکرا") });
  };
  return <OrganizationFrame title="کارمەندەکان" onRefresh={() => void refetch()} form={<><select value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)}><option value="">شوێنکار</option>{workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}</select><input value={name} onChange={(e) => setName(e.target.value)} placeholder="ناوی کارمەند" /><button onClick={add} className="bg-[#0f4c81] text-white"><Plus className="mx-auto h-4 w-4" /></button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">شوێنکار</th><th className="p-2">پیشە</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((employee) => <tr key={employee.id} className="border-b border-gray-100"><td className="p-2">{employee.name}</td><td className="p-2">{workplaces.find((workplace) => workplace.id === employee.workplaceId)?.name ?? `#${employee.workplaceId}`}</td><td className="p-2">{employee.jobTitle || "-"}</td><td className="p-2">{employee.status}</td></tr>) : <Empty loading={isLoading} colSpan={4} />}</tbody></table></OrganizationFrame>;
}

function OrganizationFrame({ title, onRefresh, form, children }: { title: string; onRefresh: () => void; form: React.ReactNode; children: React.ReactNode }) {
  return <div dir="rtl"><div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-normal text-gray-800">{title}</h1><button onClick={onRefresh} className="flex h-8 items-center gap-1 border border-gray-200 px-3 text-xs"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div><div className="mb-4 flex gap-2 border border-[#0f4c81] bg-white p-3 text-xs [&_input]:h-8 [&_input]:border [&_input]:border-gray-200 [&_input]:px-2 [&_input]:text-right [&_select]:h-8 [&_select]:border [&_select]:border-gray-200 [&_select]:px-2">{form}</div><div className="overflow-x-auto border border-[#0f4c81] bg-white">{children}</div></div>;
}