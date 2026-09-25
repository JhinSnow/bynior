'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidateUser, setCandidateUser] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ไม่พบข้อมูลในระบบ');
        setLoading(false);
        return;
      }

      // แสดงยืนยันตัวตนก่อนเข้าหน้าหลัก
      setCandidateUser(data.user);
      setStep('confirm');
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckin = () => {
    router.push('/wallet');
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-amber-500/15 blur-[100px] pointer-events-none" />

      {/* Header bar with discreet Admin button */}
      <header className="flex justify-between items-center w-full max-w-md mx-auto pt-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-indigo-200">
            BYENIOR 2026
          </span>
        </div>

        <Link
          href="/admin/login"
          className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs backdrop-blur-md"
          title="เจ้าหน้าที่และผู้ดูแล"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Admin / Staff</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-6">
        {step === 'input' ? (
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
                ลงทะเบียนเข้าร่วมงาน
              </h1>
              <p className="text-sm text-slate-400">
                กรอกรหัสนักศึกษาและนามสกุลของคุณเพื่อรับคูปองอาหาร
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  รหัสนักศึกษา-นามสกุล
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="เช่น 6610210001-ใจดี"
                    className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                  <span>📌 รูปแบบ:</span>
                  <span className="text-amber-300 font-mono font-medium">รหัสนักศึกษา-นามสกุล</span>
                  <span>(ต้องมีเครื่องหมายขีดคั่นกลาง)</span>
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-indigo-600 to-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-600/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ตรวจสอบสิทธิ์</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Confirm Identity & Check-in */
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/50 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-8 h-8" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 mb-3">
              พบข้อมูลในระบบ
            </span>

            <h2 className="text-2xl font-bold text-white mb-1">
              {candidateUser?.fullName}
            </h2>
            <p className="text-slate-400 font-mono text-sm mb-6">
              รหัสนักศึกษา: {candidateUser?.studentId}
            </p>

            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 mb-6 text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200">
                <p className="font-semibold mb-0.5">ยืนยันการเช็คชื่อเข้างาน</p>
                <p className="text-emerald-300/80">
                  ระบบได้บันทึกเวลาเข้าร่วมงานของคุณเรียบร้อยแล้ว พร้อมรับสิทธิ์สุ่มของรางวัลในงาน
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmCheckin}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-600/30 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>เข้าสู่กระเป๋าคูปองอาหาร</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-3 z-10">
        สโมสรนักศึกษาคณะวิทยาศาสตร์ • Byenior Celebration System
      </footer>
    </main>
  );
}
