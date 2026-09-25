'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { X, Clock, RefreshCw, AlertCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';

interface DynamicQRModalProps {
  couponId: string;
  couponName: string;
  storeName: string;
  onClose: () => void;
  onRedeemedSuccess?: () => void;
}

export function DynamicQRModal({
  couponId,
  couponName,
  storeName,
  onClose,
}: DynamicQRModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchTokenAndGenerateQR = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/coupon/qr-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ไม่สามารถสร้าง QR Code ได้');
        setLoading(false);
        return;
      }

      const nowEpoch = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, data.expiresAt - nowEpoch);
      setTimeLeft(remaining > 0 ? remaining : 60);

      // สร้าง Data URL QR Code คมชัด สแกนติดง่ายที่สุด
      const url = await QRCode.toDataURL(data.token, {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrDataUrl(url);
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลด QR Code');
    } finally {
      setLoading(false);
    }
  }, [couponId]);

  useEffect(() => {
    fetchTokenAndGenerateQR();
  }, [fetchTokenAndGenerateQR]);

  useEffect(() => {
    if (loading || error) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchTokenAndGenerateQR();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, fetchTokenAndGenerateQR]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-neutral-950 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center overflow-hidden">
        {/* Top Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-400 to-red-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-900 border border-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 pt-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Dynamic VIP Pass
          </span>
          <h3 className="text-xl font-black text-white line-clamp-1">{couponName}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">{storeName}</p>
        </div>

        {/* QR Display Area */}
        <div className="w-64 h-64 mx-auto bg-white rounded-2xl p-2.5 shadow-2xl flex items-center justify-center relative overflow-hidden border-2 border-amber-400/40">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-800">
              <RefreshCw className="w-8 h-8 animate-spin text-red-700" />
              <span className="text-xs font-semibold">กำลังสร้างรหัสลับ VIP...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-3 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <span className="text-xs">{error}</span>
              <button
                onClick={fetchTokenAndGenerateQR}
                className="mt-2 px-3 py-1.5 bg-neutral-100 rounded-lg text-xs font-bold text-neutral-900"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <img
              src={qrDataUrl}
              alt="Single-use QR code"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Timer countdown progress */}
        {!error && !loading && (
          <div className="mt-4">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono font-bold mb-1.5">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>รหัสจะหมุนเปลี่ยนใหม่ใน {timeLeft} วินาที</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>

            <p className="text-[11px] text-neutral-400 mt-3 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ยื่น QR Code นี้ให้เจ้าหน้าที่สแกนเพื่อรับอาหาร</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
