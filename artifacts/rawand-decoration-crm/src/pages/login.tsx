import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { useSessionLogin } from "@workspace/api-client-react";
import loginReferenceImage from "@assets/image_1788765100387.png";

type LoginUser = {
  id: number;
  username: string;
  displayName: string;
  status: "active" | "inactive";
};

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useSessionLogin();
  const usersQuery = useQuery<LoginUser[]>({
    queryKey: ["/api/session/users"],
    queryFn: async () => {
      const response = await fetch("/api/session/users", { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("نەتوانرا لیستی بەکارهێنەرەکان بار بکرێت");
      }
      return response.json() as Promise<LoginUser[]>;
    },
  });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const activeUsers = (usersQuery.data ?? []).filter((user) => user.status === "active");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!username || !password) {
      setErrorMessage("تکایە ناوی بەکارهێنەر و وشەی نهێنی پڕبکەرەوە");
      return;
    }

    login.mutate(
      { data: { username, password } },
      {
        onSuccess: () => setLocation("/"),
        onError: (error) => {
          setErrorMessage(error instanceof Error ? error.message : "ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە");
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9] px-4 py-6 sm:px-8 sm:py-10" dir="ltr">
      <div className="mx-auto flex min-h-[620px] w-full max-w-[1080px] overflow-hidden rounded-[5px] border border-[#e2e6ea] bg-white shadow-[0_10px_35px_rgba(30,55,75,0.12)] lg:min-h-[680px] lg:flex-row">
        <section className="flex w-full flex-col justify-center bg-white px-7 py-10 sm:px-12 lg:w-[43%] lg:px-14" dir="rtl">
          <div className="mx-auto w-full max-w-[330px]">
            <div className="mb-8 text-center">
              <div className="mb-3 flex items-center justify-center gap-1.5" dir="ltr" aria-label="M4IT">
                <span className="text-[31px] font-semibold tracking-[-1.5px] text-[#20252b]">M4IT</span>
                <span className="relative inline-flex h-8 w-8 -skew-x-12 items-center justify-center overflow-hidden rounded-[4px] bg-gradient-to-br from-[#19b7c8] via-[#6d6bdc] to-[#f14f93] text-[16px] font-black text-white shadow-sm">
                  <span className="skew-x-12">M</span>
                </span>
              </div>
              <h1 className="text-[20px] font-bold text-[#20252b]">چوونەژوورەوە</h1>
              <p className="mt-1 text-[12px] text-[#4e555d]">ناوی بەکارهێنەر و وشەی نهێنی بنووسە بۆ دەستپێکردن</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#454b52]">ناوی بەکارهێنەر</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <User className="h-4 w-4 text-[#89939c]" />
                  </div>
                  <select
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={usersQuery.isLoading || login.isPending}
                    className="block h-10 w-full appearance-none rounded-[3px] border border-[#cfd6dc] bg-white pr-10 pl-3 text-[12px] text-[#29313a] outline-none transition focus:border-[#1684c5] focus:ring-1 focus:ring-[#1684c5] disabled:bg-[#f3f5f6]"
                  >
                    <option value="">
                      {usersQuery.isLoading ? "لە بارکردندایە..." : "ناوی بەکارهێنەر هەڵبژێرە"}
                    </option>
                    {activeUsers.map((user) => (
                      <option key={user.id} value={user.username}>
                        {user.displayName} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-[#454b52]">وشەی نهێنی</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <KeyRound className="h-4 w-4 text-[#89939c]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={login.isPending}
                    className="block h-10 w-full rounded-[3px] border border-[#cfd6dc] pr-10 pl-24 text-[12px] text-[#29313a] outline-none transition placeholder:text-[#9aa3aa] focus:border-[#1684c5] focus:ring-1 focus:ring-[#1684c5] disabled:bg-[#f3f5f6]"
                    placeholder="وشەی نهێنی بنووسە"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 left-0 flex items-center gap-1 pl-3 text-[11px] text-[#89939c] transition hover:text-[#1684c5]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span>{showPassword ? "شاردنەوە" : "پیشاندان"}</span>
                  </button>
                </div>
              </div>

              {(errorMessage || usersQuery.isError) && (
                <p role="alert" className="rounded-[3px] border border-red-100 bg-red-50 px-3 py-2 text-right text-[11px] text-red-700">
                  {errorMessage || "لیستی بەکارهێنەرەکان بار نەکرا؛ تکایە پەڕەکە نوێبکەرەوە"}
                </p>
              )}

              <button
                type="submit"
                disabled={login.isPending || usersQuery.isLoading || !username || !password}
                className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-[3px] bg-[#0879c1] text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#0669a9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {login.isPending ? "لە چوونەژوورەوەدایە..." : "چوونە ژوورەوە"}
                <ArrowLeft className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-8 border-t border-[#eef1f3] pt-4 text-center">
              <p className="text-[11px] text-[#7a828a]">پەرەپێدراوە لەلایەن Muhammad IT 07501263713 SaleBox KRD</p>
            </div>
          </div>
        </section>

        <aside className="relative hidden min-h-[300px] overflow-hidden bg-[#edf1f3] lg:block lg:w-[57%]" aria-label="M4IT workspace">
          <img
            src={loginReferenceImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/10" />
        </aside>
      </div>
    </div>
  );
}
