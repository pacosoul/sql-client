
export function Navbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="text-lg font-semibold text-gray-800 md:hidden">
        Prophet
      </div>
      <div className="hidden md:block text-sm text-gray-500">
        Welcome back, User
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Placeholder for search or notifications */}
          <span className="text-gray-400 text-sm">Search...</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
          U
        </div>
      </div>
    </header>
  );
}
