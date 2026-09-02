import { Building2, User, KeyRound, ArrowLeft } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dir-rtl" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-[#0f4c81] p-6 text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Rawand Decoration CRM</h1>
          <p className="text-blue-100 text-sm mt-1">چوونە ژوورەوە بۆ سیستم</p>
        </div>
        
        <div className="p-8">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">ناوی بەکارهێنەر</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  className="block w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent text-sm"
                  placeholder="ناوی بەکارهێنەر بنووسە"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">وشەی نهێنی</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="block w-full pr-10 pl-3 py-2.5 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0f4c81] focus:border-transparent text-sm"
                  placeholder="وشەی نهێنی بنووسە"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#0f4c81] text-white py-2.5 rounded-md hover:bg-blue-800 transition-colors font-medium text-sm mt-4"
            >
              چوونە ژوورەوە
              <ArrowLeft className="h-4 w-4" />
            </button>
          </form>
        </div>
        
        <div className="bg-gray-50 border-t border-gray-100 px-8 py-4 text-center">
          <p className="text-xs text-gray-500">پەرەپێدراوە لەلایەن Informatic Company</p>
        </div>
      </div>
    </div>
  );
}
