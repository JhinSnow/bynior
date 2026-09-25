'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Sparkles, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Film, Clapperboard, Star } from 'lucide-react';
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
    <main className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Hollywood Red Carpet & Gold Cinematic Glow */}
      <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-red-900/25 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-[-10%] w-[350px] h-[350px] rounded-full bg-amber-600/10 blur-[100px] pointer-events-none" />

      {/* Header bar with discreet Admin button */}
      <header className="flex justify-between items-center w-full max-w-md mx-auto pt-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-red-700 via-amber-600 to-amber-400 text-black shadow-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-base tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 block">
              BYENIOR 2026
            </span>
            <span className="text-[10px] tracking-widest text-red-400 uppercase font-semibold block">
              Hollywood Red Carpet Gala
            </span>
          </div>
        </div>

        <Link
          href="/admin/login"
          className="p-2.5 rounded-full bg-neutral-900/80 border border-amber-500/30 hover:border-amber-400/80 hover:bg-neutral-800 text-amber-200 transition-all flex items-center gap-1.5 text-xs backdrop-blur-md"
          title="ผู้ดูแลระบบ"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Admin Portal</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-6">
        {step === 'input' ? (
          <div className="bg-neutral-950/85 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-red-950/40 relative">
            {/* Top decorative star */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-red-800 to-amber-700 rounded-full border border-amber-400/40 flex items-center gap-1 text-[10px] font-bold text-amber-200 uppercase tracking-widest">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>Red Carpet Admission</span>
            </div>

            <div className="text-center mb-7 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white mb-2 uppercase">
                ลงทะเบียนเข้าร่วมงาน
              </h1>
              <p className="text-xs text-neutral-400 tracking-wide">
                Faculty of Science Byenior Celebration Gala
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>รหัสนักศึกษา-นามสกุล</span>
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
                    className="w-full px-4 py-3.5 bg-neutral-900 border border-neutral-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-2xl text-white placeholder-neutral-500 text-base transition-all font-mono"
                  />
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>รูปแบบ:</span>
                  <span className="text-amber-300 font-mono font-medium">รหัสนักศึกษา-นามสกุล</span>
                  <span>(ต้องมีเครื่องหมายขีดคั่นกลาง)</span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-700 via-amber-600 to-amber-500 hover:from-red-600 hover:to-amber-400 text-black font-black text-base tracking-wider uppercase shadow-xl shadow-red-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ตรวจสอบสิทธิ์ VIP</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: Confirm Identity & Check-in */
          <div className="bg-neutral-950/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-red-950/50 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-tr from-red-800 to-amber-600 border border-amber-400 flex items-center justify-center text-amber-200 shadow-lg">
              <UserCheck className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3 tracking-widest uppercase">
              <Star className="w-3 h-3 fill-amber-300" />
              VIP Attendee Verified
            </span>

            <h2 className="text-2xl font-black text-white mb-1">
              {candidateUser?.fullName}
            </h2>
            <p className="text-amber-200/80 font-mono text-sm mb-6">
              STUDENT ID: {candidateUser?.studentId}
            </p>

            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/40 mb-6 text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-200">
                <p className="font-bold text-amber-300 mb-0.5 uppercase tracking-wide">
                  ยืนยันการเช็คชื่อเข้างาน Red Carpet
                </p>
                <p className="text-neutral-400">
                  ระบบได้บันทึกเวลาเข้าร่วมงานของคุณเรียบร้อยแล้ว พร้อมรับสิทธิ์คูปองอาหารและร่วมลุ้นรางวัล Lucky Draw
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmCheckin}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-base tracking-wider uppercase shadow-xl shadow-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>เข้าสู่กระเป๋าคูปอง VIP Wallet</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-500 py-3 z-10 tracking-widest uppercase">
        Faculty of Science • Byenior Celebration 2026
      </footer>
    </main>
  );
}
