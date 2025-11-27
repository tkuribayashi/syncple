'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'ホーム', icon: '🏠' },
    { href: '/calendar', label: 'カレンダー', icon: '📅' },
    { href: '/messages', label: 'メッセージ', icon: '💬' },
    { href: '/settings', label: '設定', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              pathname === item.href
                ? 'text-pink-500 font-medium'
                : 'text-gray-600'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
