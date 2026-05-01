'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* モバイル用ヘッダー */}
        <header className="md:hidden flex items-center h-12 px-4 border-b border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="メニューを開く"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="ml-3 font-medium text-sm">AI Chat</span>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
