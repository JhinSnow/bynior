'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface VerifyData {
  user: {
    id: string;
    fullName: string;
    studentId: string;
  };
  coupon: {
    id: string;
    name: string;
    storeName: string;
  };
}

export default function StaffScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [verifyModal, setVerifyModal] = useState<VerifyData | null>(null);
  const [currentToken, setCurrentToken] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isVerifyingRef = useRef<boolean>(false);

  // เริ่มกล้อง
  const startCamera = async () => {
    setCameraError('');
    setFeedback(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // กล้องหลังของสมาร์ตโฟน
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (isVerifyingRef.current) return;
          isVerifyingRef.current = true;
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame scan error (normal continuous polling)
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์การใช้กล้องในเบราว์เซอร์');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Stop camera error:', err);
      }
    }
    setScanning(false);
    isVerifyingRef.current = false;
  };

  // ตรวจสอบ Token เมื่อสแกนติด
  const handleScanSuccess = async (scannedToken: string) => {
    setCurrentToken(scannedToken);
    setActionLoading(true);

    try {
      const res = await fetch('/api/staff/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedToken, action: 'VERIFY' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'QR Code ไม่ถูกต้อง หรือหมดอายุแล้ว',
        });
        setTimeout(() => {
          isVerifyingRef.current = false;
        }, 2000);
        return;
      }

      // แสดง Popup ยืนยันข้อมูล
      setVerifyModal({
        user: data.user,
        coupon: data.coupon,
      });
    } catch {
      setFeedback({ type: 'error', message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
      setTimeout(() => {
        isVerifyingRef.current = false;
      }, 2000);
    } finally {
      setActionLoading(false);
    }
  };

  // กดยืนยันการตัดสิทธิ์
  const handleConfirmRedeem = async () => {
    if (!currentToken) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/staff/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, action: 'CONFIRM_REDEEM' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'เกิดข้อผิดพลาดในการตัดสิทธิ์',
        });
      } else {
        setFeedback({
          type: 'success',
          message: `ยืนยันรับอาหารเรียบร้อย: ${data.coupon.name} (${data.user.fullName})`,
        });
      }

      setVerifyModal(null);
      setCurrentToken('');
    } catch {
      setFeedback({ type: 'error', message: 'เครือข่ายขัดข้อง' });
    } finally {
      setActionLoading(false);
      setTimeout(() => {
        isVerifyingRef.current = false;
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl text-center">
        <h2 className="text-xl font-black text-white mb-1">แท็บ 1: เครื่องสแกนคูปองอาหาร</h2>
        <p className="text-xs text-slate-400 mb-6">
          สแกน Dynamic QR Code บนหน้าจอมือถือของผู้เข้าร่วมงานเพื่อตัดสิทธิ์
        </p>

        {/* Camera Area */}
        <div className="relative max-w-sm mx-auto aspect-square bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-2xl flex flex-col items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center z-10">
              <Camera className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-sm font-semibold text-slate-300 mb-1">กล้องยังไม่ได้เปิดใช้งาน</p>
              <p className="text-xs text-slate-500 mb-6 max-w-xs">
                กดปุ่มด้านล่างเพื่อเปิดกล้องหลังสำหรับสแกน QR Code
              </p>
              <button
                onClick={startCamera}
                className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องสแกน</span>
              </button>
            </div>
          )}

          {scanning && (
            <button
              onClick={stopCamera}
              className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-semibold text-white hover:bg-slate-800"
            >
              ปิดกล้อง
            </button>
          )}
        </div>

        {cameraError && (
          <div className="mt-4 p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs max-w-sm mx-auto flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Global Feedback message */}
        {feedback && (
          <div
            className={`mt-4 p-4 rounded-2xl max-w-sm mx-auto text-xs font-semibold flex items-center gap-2.5 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/80 border border-red-500/40 text-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Confirmation Modal Pop-up */}
      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center">
            <button
              onClick={() => {
                setVerifyModal(null);
                isVerifyingRef.current = false;
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">ยืนยันข้อมูลผู้รับอาหาร</h3>
            <p className="text-xs text-slate-400 mb-5">ตรวจสอบข้อมูลก่อนกดยืนยันการตัดสิทธิ์</p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-3 mb-6">
              <div>
                <span className="text-[11px] text-slate-500 block uppercase font-bold">
                  ผู้รับอาหาร
                </span>
                <p className="text-base font-bold text-white">{verifyModal.user.fullName}</p>
                <p className="text-xs font-mono text-slate-400">
                  รหัสนักศึกษา: {verifyModal.user.studentId}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <span className="text-[11px] text-slate-500 block uppercase font-bold">
                  เมนู / ร้านค้า
                </span>
                <p className="text-sm font-bold text-amber-400">{verifyModal.coupon.name}</p>
                <p className="text-xs text-slate-400">{verifyModal.coupon.storeName}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setVerifyModal(null);
                  isVerifyingRef.current = false;
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmRedeem}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>กดยืนยันการรับอาหาร</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
