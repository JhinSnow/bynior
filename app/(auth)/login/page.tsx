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
    <main className="min-h-screen bg-black text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Header bar with discreet Admin button */}
      <header className="flex justify-between items-center w-full max-w-md mx-auto pt-2 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-700 text-white">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-base tracking-[0.2em] uppercase text-amber-400 block">
              BYENIOR 2026
            </span>
            <span className="text-[10px] tracking-widest text-red-500 uppercase font-bold block">
              Hollywood Red Carpet Gala
            </span>
          </div>
        </div>

        <Link
          href="/admin/login"
          className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 hover:border-amber-400 text-amber-300 transition-colors flex items-center gap-1.5 text-xs"
          title="ผู้ดูแลระบบ"
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Admin Portal</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto z-10 py-6">
        {step === 'input' ? (
          <div className="bg-neutral-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 relative">
            {/* Top decorative badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-red-800 rounded-full border border-amber-400 flex items-center gap-1 text-[10px] font-black text-white uppercase tracking-widest">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>Red Carpet Admission</span>
            </div>

            <div className="text-center mb-7 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-white mb-1.5 uppercase">
                ลงทะเบียนเข้าร่วมงาน
              </h1>
              <p className="text-xs text-neutral-400 tracking-wide">
                Faculty of Science Byenior Celebration Gala
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
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
                    className="w-full px-4 py-3.5 bg-neutral-900 border border-neutral-700 focus:border-amber-400 focus:outline-none rounded-2xl text-white placeholder-neutral-500 text-base transition-colors font-mono"
                  />
                </div>
                <div className="text-[11px] text-neutral-400 mt-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>รูปแบบ:</span>
                  <span className="text-amber-300 font-mono font-bold">รหัสนักศึกษา-นามสกุล</span>
                  <span>(ต้องมีเครื่องหมายขีดคั่นกลาง)</span>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950 border border-red-600 text-red-200 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-base tracking-wider uppercase active:scale-[0.98] transition-colors flex items-center justify-center gap-2 min-h-[48px]"
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
          <div className="bg-neutral-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-800 border-2 border-amber-400 flex items-center justify-center text-amber-300">
              <UserCheck className="w-8 h-8" />
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-black mb-3 tracking-widest uppercase">
              <Star className="w-3 h-3 fill-black" />
              VIP Attendee Verified
            </span>

            <h2 className="text-2xl font-black text-white mb-1">
              {candidateUser?.fullName}
            </h2>
            <p className="text-amber-300 font-mono text-sm mb-6">
              STUDENT ID: {candidateUser?.studentId}
            </p>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6 text-left flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-200">
                <p className="font-bold text-amber-400 mb-0.5 uppercase tracking-wide">
                  ยืนยันการเช็คชื่อเข้างาน Red Carpet
                </p>
                <p className="text-neutral-400">
                  ระบบได้บันทึกเวลาเข้าร่วมงานของคุณเรียบร้อยแล้ว พร้อมรับสิทธิ์คูปองอาหารและร่วมลุ้นรางวัล Lucky Draw
                </p>
              </div>
            </div>

            <button
              onClick={handleConfirmCheckin}
              className="w-full py-4 px-6 rounded-2xl bg-red-700 hover:bg-red-600 text-white font-black text-base tracking-wider uppercase active:scale-[0.98] transition-colors flex items-center justify-center gap-2 min-h-[48px] border border-amber-400"
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
