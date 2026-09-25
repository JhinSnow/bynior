'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ScanLine, Award, Film, LogOut, Shield, Clapperboard, Star } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAuthPage = pathname === '/admin/login';
  const isCreditsPage = pathname === '/admin/credits';

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          if (data.role !== 'ADMIN' && data.role !== 'STAFF') {
            router.push('/admin/login');
          } else {
            setSession(data);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, isAuthPage, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (isAuthPage || isCreditsPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    {
      name: 'สแกนคูปองอาหาร',
      href: '/admin/scanner',
      icon: ScanLine,
    },
    {
      name: 'จัดการกิจกรรม & สุ่มรางวัล',
      href: '/admin/activities',
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <header className="bg-neutral-950/95 border-b border-amber-500/20 sticky top-0 z-30 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-red-700 via-amber-600 to-amber-400 text-black font-bold shadow-md">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-widest uppercase">
                BYENIOR 2026 • ADMIN
              </h1>
              <p className="text-[11px] text-amber-400/90 font-medium">
                {session?.user?.fullName || 'ผู้ดูแลระบบและฝ่ายดำเนินงาน'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/credits"
              target="_blank"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 border border-red-500/30"
            >
              <Film className="w-4 h-4" />
              <span>เปิดจอ End Credit</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-4xl mx-auto mt-3 grid grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-neutral-900/80 text-neutral-400 hover:bg-neutral-900 hover:text-white border border-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">{children}</main>

      {/* Admin Footer */}
      <footer className="text-center text-xs text-neutral-600 py-4 border-t border-neutral-900 uppercase tracking-widest">
        Byenior 2026 • Hollywood Gala Event Management Portal
      </footer>
    </div>
  );
}
