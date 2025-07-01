'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white/10 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎭</span>
            <span className="text-xl font-bold text-white">Live Performance</span>
          </Link>
          
          <nav className="flex space-x-8">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              홈
            </Link>
            <Link
              href="/live"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/live') 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              라이브 방송
            </Link>
            <Link
              href="/broadcast"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/broadcast') 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              방송 시작
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
} 