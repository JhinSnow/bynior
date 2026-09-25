'use client';

import React, { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { X, Clock, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

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
  const [timeLeft, setTimeLeft] = useState<number>(45);
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

      // คำนวณเวลาที่เหลือจาก expiresAt
      const nowEpoch = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, data.expiresAt - nowEpoch);
      setTimeLeft(remaining > 0 ? remaining : 45);

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

  // รันครั้งแรกเมื่อ Modal เปิด
  useEffect(() => {
    fetchTokenAndGenerateQR();
  }, [fetchTokenAndGenerateQR]);

  // Countdown timer
  useEffect(() => {
    if (loading || error) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // หมดเวลา: สั่ง Re-fetch ใหม่โดยอัตโนมัติ
          fetchTokenAndGenerateQR();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, fetchTokenAndGenerateQR]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4 pt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Dynamic Single-Use QR
          </span>
          <h3 className="text-xl font-bold text-white line-clamp-1">{couponName}</h3>
          <p className="text-xs text-slate-400">{storeName}</p>
        </div>

        {/* QR Display Area */}
        <div className="w-64 h-64 mx-auto bg-white rounded-2xl p-3 shadow-inner flex items-center justify-center relative overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">กำลังสร้างรหัสลับ...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 p-3 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <span className="text-xs">{error}</span>
              <button
                onClick={fetchTokenAndGenerateQR}
                className="mt-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800"
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
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono font-medium mb-1.5">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>รหัสจะหมุนเปลี่ยนใหม่ใน {timeLeft} วินาที</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(timeLeft / 45) * 100}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-3">
              ยื่น QR Code นี้ให้เจ้าหน้าที่ประจำร้านสแกนเพื่อรับอาหาร
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
