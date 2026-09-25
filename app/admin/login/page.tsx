'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldAlert, ArrowLeft, ArrowRight, ShieldCheck, Film, Clapperboard, Star } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, role: 'ADMIN' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      router.push('/admin/scanner');
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 relative select-none">
      <div className="w-full max-w-md mx-auto my-auto py-8 z-10">
        <div className="bg-neutral-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-700 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
            <Lock className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-black text-center text-white mb-1 uppercase tracking-wider">
            เข้าสู่ระบบผู้ดูแลระบบ
          </h1>
          <p className="text-xs text-center text-neutral-400 mb-6">
            Admin & Event Production Control Panel
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                <span>รหัสผ่านผู้ดูแลระบบ</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านเข้าใช้งาน"
                className="w-full px-4 py-3.5 bg-neutral-900 border border-neutral-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-2xl text-white placeholder-neutral-500 text-sm font-mono"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-950 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm tracking-wider uppercase shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px] border border-amber-300"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>เข้าสู่ระบบ Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <footer className="text-center text-xs text-neutral-600 py-3 tracking-widest uppercase">
        Byenior Security System • Access Control Protected
      </footer>
    </div>
  );
}
