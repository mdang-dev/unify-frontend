export default function GroupDetailLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-zinc-950">
      {/* Main Project Sidebar (already fixed by MainLayout) */}
      <div className="hidden flex-none lg:block" />
      {/* Main Content (scrollable) */}
      <main className="h-screen min-w-0 flex-1 overflow-y-auto pb-10">{children}</main>
    </div>
  );
}
