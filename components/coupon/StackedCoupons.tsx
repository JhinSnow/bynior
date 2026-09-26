'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CheckCircle2, Star, Sparkles, UtensilsCrossed, Layers, ChevronDown } from 'lucide-react';
import { DynamicQRModal } from './DynamicQRModal';

export interface CouponItem {
  id: string;
  name: string;
  storeName: string;
  description?: string | null;
  maxUsesPerUser: number;
  usedCount: number;
  remainingUses: number;
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
  // Starts expanded by default so users see all coupons, with smooth folding capability
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

  const handleCardClick = (coupon: CouponItem) => {
    // If cards are folded, clicking any card smoothly unfolds the deck
    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    if (coupon.isRedeemed) return;
    setSelectedCoupon(coupon);
  };

  const redeemedCount = coupons.filter((c) => c.isRedeemed).length;

  // Layout parameters
  const CARD_HEIGHT = 150;
  const EXPANDED_GAP = 20; // 20px clean gap between cards in expanded view (no tight scrolling!)
  const EXPANDED_STEP = CARD_HEIGHT + EXPANDED_GAP; // 170px
  const COLLAPSED_STEP = 50; // 50px peek per card in collapsed view

  const totalExpandedHeight = Math.max(CARD_HEIGHT, (coupons.length - 1) * EXPANDED_STEP + CARD_HEIGHT);
  const totalCollapsedHeight = Math.max(CARD_HEIGHT, (coupons.length - 1) * COLLAPSED_STEP + CARD_HEIGHT);

  const springTransition = {
    type: 'spring',
    stiffness: 240,
    damping: 24,
    mass: 0.8,
  };

  return (
    <div className="w-full">
      {/* Wallet Controls / State Toggle Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400 bg-neutral-900 hover:bg-neutral-850 px-4 py-2 rounded-full border border-amber-500/60 shadow-md active:scale-95 transition-all"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{isExpanded ? 'พับเก็บคูปองทั้งหมด' : 'กางดูคูปองทั้งหมด'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-300 text-amber-400 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-300">
          ใช้แล้ว {redeemedCount}/{coupons.length} สิทธิ์
        </span>
      </div>

      {/* Cards Deck Container with Smooth Dynamic Height Spring Animation */}
      <motion.div
        className="relative will-change-[height]"
        initial={false}
        animate={{
          height: isExpanded ? totalExpandedHeight : totalCollapsedHeight,
        }}
        transition={springTransition}
      >
        <AnimatePresence>
          {coupons.map((coupon, index) => {
            const style = HOLLYWOOD_SOLID_STYLES[index % HOLLYWOOD_SOLID_STYLES.length];
            const collapsedY = index * COLLAPSED_STEP;
            const expandedY = index * EXPANDED_STEP;
            const collapsedScale = 1 - index * 0.025;
            const collapsedZ = coupons.length - index;
            const expandedZ = 10 + index;

            return (
              <motion.div
                key={coupon.id}
                layout
                initial={false}
                animate={{
                  y: isExpanded ? expandedY : collapsedY,
                  scale: isExpanded ? 1 : collapsedScale,
                  zIndex: isExpanded ? expandedZ : collapsedZ,
                }}
                transition={springTransition}
                whileTap={!coupon.isRedeemed ? { scale: isExpanded ? 0.98 : 0.99 } : undefined}
                onClick={() => handleCardClick(coupon)}
                className={`w-full rounded-3xl p-5 border select-none transition-shadow shadow-xl absolute top-0 left-0 right-0 overflow-hidden cursor-pointer ${
                  coupon.isRedeemed
                    ? 'bg-neutral-950 border-neutral-800 text-neutral-600 opacity-60'
                    : `${style.bg} ${style.border} text-white hover:shadow-2xl`
                }`}
                style={{
                  height: `${CARD_HEIGHT}px`,
                }}
              >
                <div className="flex justify-between items-start gap-4 h-full">
                  {/* Left Info Column */}
                  <div className="flex flex-col justify-between flex-1 h-full pr-2">
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
                      <h4 className="text-xl font-black tracking-tight leading-snug text-white line-clamp-1">
                        {coupon.name}
                      </h4>

                      {/* Description */}
                      {coupon.description && (
                        <p className="text-xs text-neutral-300 mt-1 font-medium line-clamp-1">
                          {coupon.description}
                        </p>
                      )}
                    </div>

                      {/* Bottom Action / Status Tag */}
                    <div className="text-[11px] font-bold flex items-center gap-2">
                      {coupon.isRedeemed ? (
                        <span className="text-neutral-400 flex items-center gap-1.5 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                          <span>ใช้ครบ {coupon.maxUsesPerUser} รอบแล้ว</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-amber-300 bg-black/60 px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>แตะเพื่อเปิด QR Code</span>
                          </span>
                          {coupon.maxUsesPerUser > 1 && (
                            <span className="bg-amber-400/90 text-black px-2.5 py-0.5 rounded-full font-black text-[10px] shadow-sm">
                              เหลือ {coupon.remainingUses}/{coupon.maxUsesPerUser} รอบ
                            </span>
                          )}
                        </div>
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
                      <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black flex flex-col items-center justify-center border-2 border-black shadow-lg transition-transform hover:scale-105 active:scale-95">
                        <QrCode className="w-6 h-6 stroke-[2.5]" />
                        {coupon.maxUsesPerUser > 1 && (
                          <span className="text-[9px] font-black leading-none mt-0.5">
                            {coupon.remainingUses}x
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Dynamic QR Modal */}
      {selectedCoupon && (
        <DynamicQRModal
          couponId={selectedCoupon.id}
          couponName={selectedCoupon.name}
          storeName={selectedCoupon.storeName}
          remainingUses={selectedCoupon.remainingUses}
          maxUsesPerUser={selectedCoupon.maxUsesPerUser}
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
