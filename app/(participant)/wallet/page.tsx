'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StackedCoupons, CouponItem } from '@/components/coupon/StackedCoupons';
import { Sparkles, LogOut, RefreshCw, Ticket, CheckCircle2 } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchSessionAndCoupons = useCallback(async () => {
    try {
      const [authRes, couponRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/coupon/list'),
      ]);

      if (!authRes.ok) {
        router.push('/login');
        return;
      }

      const authData = await authRes.json();
      setUser(authData.user);

      if (couponRes.ok) {
        const couponData = await couponRes.json();
        setCoupons(couponData.coupons || []);
      }
    } catch {
      console.error('Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSessionAndCoupons();
  }, [fetchSessionAndCoupons]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchSessionAndCoupons();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-400">กำลังเปิดกระเป๋าคูปองของคุณ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-md mx-auto p-4 sm:p-5 relative pb-10">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-indigo-600/10 blur-[90px] pointer-events-none" />

      {/* Top Header Card */}
      <div className="z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-slate-200">
              BYENIOR WALLET
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all ${
                refreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Badge Profile */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white line-clamp-1">{user?.fullName}</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                เข้าร่วมงานแล้ว
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              รหัสนักศึกษา: {user?.studentId}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
              สิทธิ์คงเหลือ
            </span>
            <span className="text-lg font-black text-amber-400">
              {coupons.filter((c) => !c.isRedeemed).length}
              <span className="text-xs text-slate-400 font-normal ml-1">สิทธิ์</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Coupons Section */}
      <div className="flex-1 z-10">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Ticket className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold tracking-wide text-slate-200">
            คูปองอาหารและเครื่องดื่ม
          </h3>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800/60 p-6">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">ยังไม่มีรายการคูปองในขณะนี้</p>
            <p className="text-xs text-slate-500 mt-1">โปรดรอแอดมินหรือเจ้าหน้าที่เปิดรอบแจกคูปอง</p>
          </div>
        ) : (
          <StackedCoupons coupons={coupons} onRefresh={fetchSessionAndCoupons} />
        )}
      </div>

      {/* Safety Notice */}
      <div className="text-center text-[11px] text-slate-500 mt-6 z-10 px-4">
        🔒 ปลอดภัยด้วย Dynamic QR Code ที่หมุนเปลี่ยนรหัสอัตโนมัติ ห้ามแคปเจอร์ภาพหน้าจอส่งต่อ
      </div>
    </div>
  );
}
