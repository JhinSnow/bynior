'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, Star, Sparkles, UtensilsCrossed } from 'lucide-react';
import { DynamicQRModal } from './DynamicQRModal';

export interface CouponItem {
  id: string;
  name: string;
  storeName: string;
  description?: string | null;
  isRedeemed: boolean;
  redeemedAt?: string | null;
}

interface StackedCouponsProps {
  coupons: CouponItem[];
  onRefresh: () => void;
}

// Flat Solid Colors for Hollywood Cards (No Gradients)
const HOLLYWOOD_SOLID_STYLES = [
  {
    bg: 'bg-red-900',
    border: 'border-2 border-amber-400',
    badge: 'bg-amber-400 text-black',
    accent: 'text-amber-300',
  },
  {
    bg: 'bg-neutral-900',
    border: 'border-2 border-amber-500',
    badge: 'bg-red-700 text-white',
    accent: 'text-amber-400',
  },
  {
    bg: 'bg-stone-900',
    border: 'border-2 border-red-700',
    badge: 'bg-amber-500 text-black',
    accent: 'text-amber-200',
  },
  {
    bg: 'bg-red-950',
    border: 'border-2 border-neutral-600',
    badge: 'bg-white text-black',
    accent: 'text-amber-100',
  },
];

export function StackedCoupons({ coupons, onRefresh }: StackedCouponsProps) {
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

  const handleCardClick = (coupon: CouponItem) => {
    if (coupon.isRedeemed) return;
    setSelectedCoupon(coupon);
  };

  const redeemedCount = coupons.filter((c) => c.isRedeemed).length;

  return (
    <div className="w-full">
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300">
          <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
          <span>ทั้งหมด {coupons.length} รายการ</span>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300">
          ใช้แล้ว {redeemedCount}/{coupons.length} สิทธิ์
        </span>
      </div>

      {/* Spacious Vertical Card Feed (No overlapping stack, ample breathing room) */}
      <div className="flex flex-col space-y-4">
        <AnimatePresence>
          {coupons.map((coupon, index) => {
            const style = HOLLYWOOD_SOLID_STYLES[index % HOLLYWOOD_SOLID_STYLES.length];

            return (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                whileTap={!coupon.isRedeemed ? { scale: 0.98 } : undefined}
                onClick={() => handleCardClick(coupon)}
                className={`w-full rounded-3xl p-5 border select-none transition-all shadow-xl relative overflow-hidden ${
                  coupon.isRedeemed
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-600 opacity-60 cursor-not-allowed'
                    : `${style.bg} ${style.border} text-white cursor-pointer hover:shadow-2xl`
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Left Info Column */}
                  <div className="flex flex-col justify-between flex-1 min-h-[96px]">
                    <div>
                      {/* Store & VIP Tags */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[11px] font-black tracking-wider uppercase px-3 py-0.5 rounded-full shadow-sm ${
                            coupon.isRedeemed
                              ? 'bg-neutral-800 text-neutral-500'
                              : style.badge
                          }`}
                        >
                          {coupon.storeName}
                        </span>
                        {!coupon.isRedeemed && (
                          <span className="text-[10px] text-amber-300 flex items-center gap-1 font-bold uppercase tracking-wider">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            VIP Pass
                          </span>
                        )}
                      </div>

                      {/* Menu Name */}
                      <h4 className="text-xl font-black tracking-tight leading-snug text-white">
                        {coupon.name}
                      </h4>

                      {/* Description */}
                      {coupon.description && (
                        <p className="text-xs text-neutral-300 mt-1 font-medium leading-relaxed">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action / Status Tag */}
                    <div className="mt-4 text-[11px] font-bold flex items-center">
                      {coupon.isRedeemed ? (
                        <span className="text-neutral-400 flex items-center gap-1.5 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                          <span>ใช้สิทธิ์รับอาหารแล้ว</span>
                        </span>
                      ) : (
                        <span className="text-amber-300 bg-black/60 px-3.5 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>แตะเพื่อเปิด QR Code รับอาหาร</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right QR Action Button */}
                  <div className="flex flex-col items-center justify-center shrink-0 self-center">
                    {coupon.isRedeemed ? (
                      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black flex items-center justify-center border-2 border-black shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <QrCode className="w-7 h-7 stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dynamic QR Modal */}
      {selectedCoupon && (
        <DynamicQRModal
          couponId={selectedCoupon.id}
          couponName={selectedCoupon.name}
          storeName={selectedCoupon.storeName}
          onClose={() => setSelectedCoupon(null)}
          onRedeemedSuccess={() => {
            setSelectedCoupon(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
