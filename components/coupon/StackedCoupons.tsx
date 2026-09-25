'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, ChevronDown, Layers, Ticket, Star, Sparkles } from 'lucide-react';
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

// Hollywood Gala Cards Color Schemes (Crimson, Champagne Gold, Velvet Dark, Deep Wine)
const HOLLYWOOD_CARD_STYLES = [
  {
    gradient: 'from-red-950 via-red-900 to-amber-950',
    border: 'border-amber-500/50',
    badge: 'bg-amber-400 text-black',
    accent: 'text-amber-300',
  },
  {
    gradient: 'from-neutral-900 via-neutral-800 to-stone-900',
    border: 'border-amber-400/60',
    badge: 'bg-red-700 text-white',
    accent: 'text-amber-200',
  },
  {
    gradient: 'from-amber-950 via-red-950 to-neutral-950',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500 text-black',
    accent: 'text-amber-400',
  },
  {
    gradient: 'from-stone-900 via-red-950 to-neutral-900',
    border: 'border-neutral-600',
    badge: 'bg-neutral-800 text-amber-300',
    accent: 'text-amber-100',
  },
];

export function StackedCoupons({ coupons, onRefresh }: StackedCouponsProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

  const handleCardClick = (coupon: CouponItem) => {
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    if (coupon.isRedeemed) return;
    setSelectedCoupon(coupon);
  };

  return (
    <div className="w-full">
      {/* Wallet Controls / State Indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300 bg-neutral-900/90 px-4 py-2 rounded-full border border-amber-500/30 shadow-md active:scale-95 transition-all"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{isExpanded ? 'พับเก็บการ์ด (Stack)' : 'กางดูคูปองทั้งหมด (Unfold)'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 text-amber-400 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <span className="text-xs font-medium text-neutral-400">
          ใช้แล้ว {coupons.filter((c) => c.isRedeemed).length}/{coupons.length} สิทธิ์
        </span>
      </div>

      {/* Cards Deck Container with dynamic responsive height */}
      <div
        className="relative transition-all duration-300 ease-out"
        style={{
          minHeight: isExpanded
            ? `${Math.max(280, (coupons.length - 1) * 145 + 170)}px`
            : `${Math.max(260, (coupons.length - 1) * 45 + 180)}px`,
          marginBottom: '24px',
        }}
      >
        <AnimatePresence>
          {coupons.map((coupon, index) => {
            const style = HOLLYWOOD_CARD_STYLES[index % HOLLYWOOD_CARD_STYLES.length];
            const stackY = index * 42;
            const stackScale = 1 - index * 0.035;
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
                className={`w-full rounded-3xl p-5 shadow-2xl border cursor-pointer select-none relative overflow-hidden transition-all ${
                  coupon.isRedeemed
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-600 grayscale opacity-60'
                    : `bg-gradient-to-r ${style.gradient} ${style.border} text-white active:scale-[0.99]`
                }`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '140px',
                }}
              >
                {/* Hollywood Golden Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />

                <div className="flex justify-between items-start h-full">
                  <div className="flex flex-col justify-between h-full pr-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full ${coupon.isRedeemed ? 'bg-neutral-800 text-neutral-500' : style.badge}`}>
                          {coupon.storeName}
                        </span>
                        {!coupon.isRedeemed && (
                          <span className="text-[10px] text-amber-300/80 flex items-center gap-0.5 font-semibold uppercase tracking-wider">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            VIP Pass
                          </span>
                        )}
                      </div>

                      <h4 className="text-lg font-black tracking-tight leading-tight line-clamp-1 text-white">
                        {coupon.name}
                      </h4>
                      {coupon.description && (
                        <p className="text-xs text-neutral-300 line-clamp-1 mt-1">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                    <div className="text-[11px] font-medium flex items-center gap-1.5">
                      {coupon.isRedeemed ? (
                        <span className="text-neutral-400 flex items-center gap-1 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                          ใช้สิทธิ์รับอาหารแล้ว
                        </span>
                      ) : (
                        <span className="text-amber-200 bg-black/40 px-2.5 py-0.5 rounded-full border border-amber-500/20 backdrop-blur-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          แตะเพื่อเปิด QR Code รับอาหาร
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QR icon / Status */}
                  <div className="flex flex-col items-center justify-center shrink-0 self-center">
                    {coupon.isRedeemed ? (
                      <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <QrCode className="w-6 h-6 stroke-[2.5]" />
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
