'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, SwitchCamera, Upload, Keyboard } from 'lucide-react';

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

  // Cameras list
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualToken, setManualToken] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isVerifyingRef = useRef<boolean>(false);

  // ค้นหากล้องทั้งหมดที่มีในเครื่อง
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // เลือกล้องหลังเป็นค่าเริ่มต้น หรือตัวสุดท้าย (มักเป็นกล้องหลังบนมือถือ)
          const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
          setSelectedCameraId(backCam ? backCam.id : devices[devices.length - 1].id);
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras:', err);
      });
  }, []);

  // เริ่มกล้อง
  const startCamera = async (overrideCameraId?: string) => {
    setCameraError('');
    setFeedback(null);

    // หยุดกล้องเดิมก่อนถ้าเปิดอยู่
    if (scannerRef.current && scannerRef.current.isScanning) {
      await stopCamera();
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      const camId = overrideCameraId || selectedCameraId;
      const cameraConfig = camId ? camId : { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.75);
            return { width: edge, height: edge };
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (isVerifyingRef.current) return;
          isVerifyingRef.current = true;
          handleScanSuccess(decodedText);
        },
        () => {
          // Continuous frame polling
        }
      );
      setScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      // ลอง fallback เปิดกล้องตัวแรก
      if (!overrideCameraId && cameras.length > 0) {
        try {
          await startCamera(cameras[0].id);
          return;
        } catch {}
      }
      setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตสิทธิ์การใช้กล้องในเบราว์เซอร์ หรือใช้วิธีอัปโหลดรูปภาพ');
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

  // สลับกล้อง
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    if (scanning) {
      await startCamera(nextCamId);
    }
  };

  // ตรวจสอบ Token เมื่อสแกนติด
  const handleScanSuccess = async (scannedToken: string) => {
    setCurrentToken(scannedToken.trim());
    setActionLoading(true);

    try {
      const res = await fetch('/api/staff/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: scannedToken.trim(), action: 'VERIFY' }),
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

  // สแกนจากไฟล์รูปภาพ
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      const decoded = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decoded);
    } catch (err) {
      setFeedback({ type: 'error', message: 'ไม่พบ QR Code ในรูปภาพที่เลือก กรุณาลองใหม่' });
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
      <div className="bg-neutral-950 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl text-center">
        <h2 className="text-xl font-black text-white mb-1 uppercase tracking-wider">เครื่องสแกนคูปองอาหาร</h2>
        <p className="text-xs text-neutral-400 mb-6">
          สแกน Dynamic QR Code บนหน้าจอมือถือของผู้เข้าร่วมงานเพื่อตัดสิทธิ์
        </p>

        {/* Camera Area */}
        <div className="relative max-w-sm mx-auto aspect-square bg-black rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl flex flex-col items-center justify-center">
          <div id="qr-reader-container" className="w-full h-full" />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/95 text-center z-10">
              <Camera className="w-16 h-16 text-amber-500/60 mb-4" />
              <p className="text-sm font-bold text-neutral-200 mb-1">กล้องยังไม่ได้เปิดใช้งาน</p>
              <p className="text-xs text-neutral-500 mb-6 max-w-xs">
                กดปุ่มด้านล่างเพื่อเปิดกล้องสำหรับสแกน QR Code
              </p>
              <button
                onClick={() => startCamera()}
                className="py-3 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm tracking-wider uppercase shadow-lg border border-amber-300 active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>เปิดกล้องสแกน</span>
              </button>
            </div>
          )}

          {scanning && (
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
              {cameras.length > 1 && (
                <button
                  onClick={handleSwitchCamera}
                  className="p-2.5 rounded-full bg-neutral-900 border border-neutral-700 text-amber-400 hover:text-white shadow-md"
                  title="สลับกล้อง"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={stopCamera}
                className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-xs font-semibold text-white hover:bg-neutral-800 shadow-md"
              >
                ปิดกล้อง
              </button>
            </div>
          )}
        </div>

        {/* Alternative options: Upload Image or Manual Input */}
        <div className="flex items-center justify-center gap-3 mt-5 max-w-sm mx-auto">
          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer border border-slate-700">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>สแกนจากรูปภาพ</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-400" />
            <span>กรอกรหัสด้วยมือ</span>
          </button>
        </div>

        {/* Manual Input Dropdown */}
        {showManualInput && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-sm mx-auto animate-fade-in text-left">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              วาง Token หรือกรอกรหัส
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="วางรหัส Token ที่นี่..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
              <button
                onClick={() => handleScanSuccess(manualToken)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl"
              >
                ตรวจ
              </button>
            </div>
          </div>
        )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in select-none">
          <div className="relative w-full max-w-sm bg-neutral-950 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl text-center">
            <button
              onClick={() => {
                setVerifyModal(null);
                isVerifyingRef.current = false;
              }}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-900 border border-neutral-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-700 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-wider">ยืนยันข้อมูลผู้รับอาหาร</h3>
            <p className="text-xs text-neutral-400 mb-5">ตรวจสอบข้อมูลก่อนกดยืนยันการตัดสิทธิ์</p>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-left space-y-3 mb-6">
              <div>
                <span className="text-[10px] text-amber-400 block uppercase font-bold tracking-wider">
                  ผู้รับอาหาร
                </span>
                <p className="text-base font-bold text-white">{verifyModal.user.fullName}</p>
                <p className="text-xs font-mono text-neutral-400">
                  STUDENT ID: {verifyModal.user.studentId}
                </p>
              </div>

              <div className="border-t border-neutral-800 pt-2">
                <span className="text-[10px] text-amber-400 block uppercase font-bold tracking-wider">
                  เมนู / ร้านค้า
                </span>
                <p className="text-sm font-bold text-amber-300">{verifyModal.coupon.name}</p>
                <p className="text-xs text-neutral-400">{verifyModal.coupon.storeName}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setVerifyModal(null);
                  isVerifyingRef.current = false;
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs border border-neutral-800 uppercase tracking-wider"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmRedeem}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-lg border border-amber-300 flex items-center justify-center gap-1.5"
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
