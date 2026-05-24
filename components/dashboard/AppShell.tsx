import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-screen bg-background">
      <Sidebar className="hidden md:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
