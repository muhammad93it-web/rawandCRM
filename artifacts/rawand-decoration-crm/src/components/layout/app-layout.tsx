import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f3f4f6] text-foreground font-sans overflow-hidden dir-rtl" dir="rtl">
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-[10px] bg-[#f3f4f6]">
            <div className="bg-white min-h-[calc(100vh-42px)] rounded-b-md shadow-sm p-5 mb-4">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
