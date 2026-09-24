'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, QrCode, CheckCircle2, ChevronDown, Layers } from 'lucide-react';
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

const CARD_COLORS = [
  'from-amber-500 via-orange-600 to-rose-600',
  'from-indigo-600 via-purple-600 to-pink-600',
  'from-emerald-500 via-teal-600 to-cyan-600',
  'from-blue-600 via-indigo-700 to-violet-800',
];

export function StackedCoupons({ coupons, onRefresh }: StackedCouponsProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

  const handleCardClick = (coupon: CouponItem) => {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    if (coupon.isRedeemed) return; // ไม่สามารถกดเปิดได้ถ้าใช้ไปแล้ว
    setSelectedCoupon(coupon);
  };

  return (
    <div className="w-full">
      {/* Wallet Controls / State Indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-sm active:scale-95 transition-all"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{isExpanded ? 'พับการ์ดเก็บ (Stack)' : 'กางดูคูปองทั้งหมด (Unfold)'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <span className="text-xs text-slate-400">
          ใช้แล้ว {coupons.filter((c) => c.isRedeemed).length}/{coupons.length} สิทธิ์
        </span>
      </div>

      {/* Cards Deck */}
      <div className="relative min-h-[460px] pb-12">
        <AnimatePresence>
          {coupons.map((coupon, index) => {
            const colorGradient = CARD_COLORS[index % CARD_COLORS.length];
            // Stacked offset
            const stackY = index * 42;
            const stackScale = 1 - index * 0.04;
            const stackZIndex = coupons.length - index;

            return (
              <motion.div
                key={coupon.id}
                layout
                initial={false}
                animate={
                  isExpanded
                    ? {
                        y: index * 135,
                        scale: 1,
                        zIndex: 10 + index,
                      }
                    : {
                        y: stackY,
                        scale: stackScale,
                        zIndex: stackZIndex,
                      }
                }
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                onClick={() => handleCardClick(coupon)}
                className={`w-full rounded-3xl p-5 shadow-xl border cursor-pointer select-none relative overflow-hidden transition-shadow ${
                  coupon.isRedeemed
                    ? 'bg-slate-900 border-slate-800 text-slate-500 grayscale opacity-75'
                    : `bg-gradient-to-r ${colorGradient} text-white border-white/20 active:scale-[0.99]`
                }`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '140px',
                }}
              >
                {/* Decorative watermarks */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

                <div className="flex justify-between items-start h-full">
                  <div className="flex flex-col justify-between h-full pr-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm">
                          {coupon.storeName}
                        </span>
                      </div>
                      <h4 className="text-lg font-black tracking-tight leading-tight line-clamp-1">
                        {coupon.name}
                      </h4>
                      {coupon.description && (
                        <p className="text-xs text-white/80 line-clamp-1 mt-1">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] font-medium flex items-center gap-1.5">
                      {coupon.isRedeemed ? (
                        <span className="text-red-400 flex items-center gap-1 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ใช้สิทธิ์รับอาหารแล้ว
                        </span>
                      ) : (
                        <span className="text-white/90 bg-black/20 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                          แตะเพื่อเปิด QR Code รับอาหาร
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QR icon / Status */}
                  <div className="flex flex-col items-center justify-center shrink-0 self-center">
                    {coupon.isRedeemed ? (
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                        <QrCode className="w-6 h-6" />
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
