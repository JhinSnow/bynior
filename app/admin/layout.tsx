'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ScanLine, Award, Film, LogOut, Shield } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ข้าม layout navigation ถ้าอยู่ในหน้า login หรือหน้า credits fullscreen theater
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-black font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                ระบบจัดการ Byenior Portal
              </h1>
              <p className="text-[11px] text-slate-400">
                {session?.user?.fullName || 'เจ้าหน้าที่ดำเนินงาน'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct button to launch End Credit Screen */}
            <Link
              href="/admin/credits"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Film className="w-4 h-4" />
              <span>เปิดจอ End Credit</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
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
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
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
      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-900">
        Byenior Event Management Portal • SamoSci Security
      </footer>
    </div>
  );
}
