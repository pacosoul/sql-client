'use client';

import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-200 hidden md:block h-screen sticky top-0">
      <div className="p-6 h-full flex flex-col">
        <Link href="/dashboard" className="text-2xl font-bold mb-8 text-blue-600 block">
          Prophet
        </Link>
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="block p-3 rounded-lg hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/analytics"
                className="block p-3 rounded-lg hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className="block p-3 rounded-lg hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Settings
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/query"
                className="block p-3 rounded-lg hover:bg-gray-200 text-gray-700 font-medium transition-colors"
              >
                Query
              </Link>
            </li>
          </ul>
        </nav>
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              document.cookie = "auth=; path=/; max-age=0";
              window.location.href = '/login';
            }}
            className="w-full text-left p-3 rounded-lg hover:bg-red-50 text-red-600 font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
