'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StackedCoupons, CouponItem } from '@/components/coupon/StackedCoupons';
import { Sparkles, LogOut, RefreshCw, Ticket, CheckCircle2, Star, ShieldCheck, Film } from 'lucide-react';

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-amber-200">Opening Your VIP Wallet...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between max-w-md mx-auto p-4 sm:p-5 relative pb-10 select-none">
      {/* Top Header Card */}
      <div className="z-10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-700 text-white border border-red-600 shadow-md">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-sm tracking-[0.2em] uppercase text-white block">
                BYENIOR 2026
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                VIP Food & Beverage Pass
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              className={`p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300 hover:text-white transition-all ${
                refreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Badge Profile */}
        <div className="p-4 rounded-3xl bg-neutral-950 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white line-clamp-1">{user?.fullName}</h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-amber-300" />
                  Checked-in
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                STUDENT ID: {user?.studentId}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold block">
                สิทธิ์คงเหลือ
              </span>
              <span className="text-xl font-black text-amber-400">
                {coupons.filter((c) => !c.isRedeemed).length}
                <span className="text-xs text-neutral-400 font-normal ml-1">สิทธิ์</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Coupons Section */}
      <div className="flex-1 z-10">
        <div className="flex items-center gap-2 mb-3.5 px-1">
          <Ticket className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold tracking-wider text-neutral-200 uppercase">
            คูปองอาหารและเครื่องดื่มในงาน
          </h3>
        </div>

        {coupons.length === 0 ? (
          <div className="text-center py-16 bg-neutral-950/70 rounded-3xl border border-neutral-800 p-6">
            <Ticket className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-neutral-300">ยังไม่มีรายการคูปองในขณะนี้</p>
            <p className="text-xs text-neutral-500 mt-1">โปรดรอแอดมินหรือเจ้าหน้าที่เปิดรอบแจกคูปอง</p>
          </div>
        ) : (
          <StackedCoupons coupons={coupons} onRefresh={fetchSessionAndCoupons} />
        )}
      </div>

      {/* Safety Notice (always positioned below cards without overlap) */}
      <div className="text-center text-[11px] text-neutral-400 mt-8 mb-4 z-10 px-4 py-3 bg-neutral-950/80 rounded-2xl border border-amber-500/20 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
        <span>ระบบความปลอดภัย Dynamic Single-Use QR Code รหัสจะหมุนเปลี่ยนใหม่อัตโนมัติ</span>
      </div>
    </div>
  );
}
