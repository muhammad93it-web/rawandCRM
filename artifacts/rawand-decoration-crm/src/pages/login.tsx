import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { useListUsers, useSessionLogin } from "@workspace/api-client-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const login = useSessionLogin();
  const usersQuery = useListUsers();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dir-rtl" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-[#0f4c81] p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Rawand Decoration CRM</h1>
          <p className="text-blue-100 text-sm mt-1">چوونە ژوورەوە بۆ سیستم</p>
        </div>
        
        <div className="p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">ناوی بەکارهێنەر</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={usersQuery.isLoading || login.isPending}
                  className="block w-full appearance-none pr-10 pl-3 py-2.5 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent text-sm disabled:bg-gray-100"
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
              <label className="text-sm font-medium text-gray-700 block">وشەی نهێنی</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={login.isPending}
                  className="block w-full pr-10 pl-24 py-2.5 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent text-sm disabled:bg-gray-100"
                  placeholder="وشەی نهێنی بنووسە"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 left-0 flex items-center gap-1 pl-3 text-xs text-gray-400 hover:text-[#0f4c81]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span>{showPassword ? "شاردنەوە" : "پیشاندان"}</span>
                </button>
              </div>
            </div>

            {(errorMessage || usersQuery.isError) && (
              <p role="alert" className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-right text-xs text-red-700">
                {errorMessage || "لیستی بەکارهێنەرەکان بار نەکرا؛ تکایە پەڕەکە نوێبکەرەوە"}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending || usersQuery.isLoading || !username || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#0f4c81] text-white py-2.5 rounded-md hover:bg-blue-800 transition-colors font-medium text-sm mt-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {login.isPending ? "لە چوونەژوورەوەدایە..." : "چوونە ژوورەوە"}
              <ArrowLeft className="h-4 w-4" />
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">پەرەپێدراوە لەلایەن Muhammad IT 07501263713 SaleBox KRD</p>
        </div>
      </div>
    </div>
  );
}
