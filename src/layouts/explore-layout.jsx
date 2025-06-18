export default function ExploreLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      <nav className="p-4">
        <h1 className="text-2xl font-bold">Explore</h1>
      </nav>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
