'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Plus, Trash2, Utensils, Users, Sparkles, RefreshCw, Trophy, AlertCircle, Award, Star, Clapperboard } from 'lucide-react';

export default function ActivitiesPage() {
  const [activeSubTab, setActiveSubTab] = useState<'lucky-draw' | 'coupons'>('lucky-draw');

  // Lucky draw states
  const [prizeName, setPrizeName] = useState('รางวัลพิเศษ Byenior Gala Award');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDisplayWinner, setCurrentDisplayWinner] = useState<string>('--- WAITING TO DRAW ---');
  const [wonUser, setWonUser] = useState<any>(null);
  const [luckyData, setLuckyData] = useState<any>(null);
  const [luckyError, setLuckyError] = useState('');

  // Coupon CRUD states
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ name: '', storeName: '', description: '' });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const fetchLuckyData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/lucky-draw');
      if (res.ok) {
        const data = await res.json();
        setLuckyData(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchLuckyData();
    fetchCoupons();
  }, [fetchLuckyData, fetchCoupons]);

  // สุ่มผู้โชคดี
  const handleStartDraw = async () => {
    if (!prizeName.trim()) {
      setLuckyError('กรุณากรอกชื่อรางวัล');
      return;
    }
    if (!luckyData?.eligibleAttendees?.length) {
      setLuckyError('ไม่มีผู้มีสิทธิ์เข้าร่วมสุ่มรางวัล (อาจยังไม่มีผู้เช็คชื่อ หรือทุกคนได้รางวัลหมดแล้ว)');
      return;
    }

    setLuckyError('');
    setIsDrawing(true);
    setWonUser(null);

    const eligibleList = luckyData.eligibleAttendees;
    let counter = 0;
    const interval = setInterval(() => {
      const randomCandidate = eligibleList[Math.floor(Math.random() * eligibleList.length)];
      setCurrentDisplayWinner(`${randomCandidate.studentId} - ${randomCandidate.fullName}`);
      counter++;
    }, 80);

    try {
      const res = await fetch('/api/admin/lucky-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeName }),
      });
      const data = await res.json();

      setTimeout(() => {
        clearInterval(interval);
        setIsDrawing(false);

        if (!res.ok) {
          setLuckyError(data.error || 'เกิดข้อผิดพลาดในการสุ่ม');
          setCurrentDisplayWinner('--- WAITING TO DRAW ---');
        } else {
          setCurrentDisplayWinner(`${data.winner.studentId} - ${data.winner.fullName}`);
          setWonUser(data.winner);

          // พลุสีทองและแดงฉลองรางวัล
          confetti({
            particleCount: 140,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#d4af37', '#f59e0b', '#dc2626', '#ffffff'],
          });

          fetchLuckyData();
        }
      }, 2500);
    } catch {
      clearInterval(interval);
      setIsDrawing(false);
      setLuckyError('เครือข่ายขัดข้อง');
    }
  };

  // สร้างคูปองใหม่
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.name || !newCoupon.storeName) return;

    setCreatingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoupon),
      });
      if (res.ok) {
        setNewCoupon({ name: '', storeName: '', description: '' });
        fetchCoupons();
      }
    } finally {
      setCreatingCoupon(false);
    }
  };

  // ลบคูปอง
  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('ต้องการลบคูปองรายการนี้หรือไม่?')) return;
    await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
    fetchCoupons();
  };

  return (
    <div className="space-y-6 select-none">
      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-amber-500/20 pb-3">
        <button
          onClick={() => setActiveSubTab('lucky-draw')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'lucky-draw'
              ? 'bg-amber-400 text-black border border-amber-300'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>ระบบสุ่มรางวัล (Lucky Draw)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('coupons')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeSubTab === 'coupons'
              ? 'bg-amber-400 text-black border border-amber-300'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>จัดการคูปองอาหาร (CRUD)</span>
        </button>
      </div>

      {activeSubTab === 'lucky-draw' ? (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                เช็คชื่อเข้างานแล้ว
              </span>
              <span className="text-2xl font-black text-amber-300">
                {luckyData?.stats?.totalCheckedIn || 0}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                ผู้มีสิทธิ์สุ่ม
              </span>
              <span className="text-2xl font-black text-amber-400">
                {luckyData?.stats?.eligibleCount || 0}
              </span>
            </div>
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
                ได้รางวัลไปแล้ว
              </span>
              <span className="text-2xl font-black text-red-400">
                {luckyData?.stats?.winnersCount || 0}
              </span>
            </div>
          </div>

          {/* Interactive Draw Machine */}
          <div className="bg-neutral-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-red-700 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-wider">
              Sci-lywood Gala Award Lucky Draw
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              ระบบสุ่มผู้โชคดีเฉพาะผู้ที่ผ่านการเช็คชื่อเข้างานและยังไม่เคยได้รับรางวัล
            </p>

            <div className="max-w-md mx-auto mb-6 text-left">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>ชื่อของรางวัล</span>
              </label>
              <input
                type="text"
                value={prizeName}
                onChange={(e) => setPrizeName(e.target.value)}
                placeholder="ระบุชื่อรางวัล เช่น รางวัลเกียรติยศ Byenior Gala Award"
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-2xl text-white text-sm"
              />
            </div>

            {/* Display Screen */}
            <div className="max-w-lg mx-auto bg-black border-2 border-amber-500/60 rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
              <div className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-mono mb-2 font-bold flex items-center justify-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>WINNER ANNOUNCEMENT</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-wider min-h-[44px] flex items-center justify-center">
                {currentDisplayWinner}
              </div>
            </div>

            {luckyError && (
              <div className="max-w-md mx-auto mb-4 p-3 rounded-xl bg-red-950 border border-red-500/60 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{luckyError}</span>
              </div>
            )}

            <button
              onClick={handleStartDraw}
              disabled={isDrawing || !luckyData?.stats?.eligibleCount}
              className="py-4 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-base uppercase tracking-wider shadow-xl border border-amber-300 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isDrawing ? 'กำลังสุ่มรายชื่อ...' : 'เริ่มหมุนสุ่มรางวัล'}</span>
            </button>
          </div>

          {/* Winners History */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6">
            <h4 className="text-base font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>ประวัติผู้ได้รับรางวัล ({luckyData?.winners?.length || 0})</span>
            </h4>

            <div className="space-y-2">
              {luckyData?.winners?.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4 uppercase tracking-wider">ยังไม่มีประวัติการสุ่มรางวัล</p>
              ) : (
                luckyData?.winners?.map((win: any) => (
                  <div
                    key={win.id}
                    className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-black text-white">{win.user.fullName}</p>
                      <p className="text-xs font-mono text-amber-300/80">
                        {win.user.studentId} • {win.prizeName}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {new Date(win.wonAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Coupons CRUD Tab */
        <div className="space-y-6">
          <div className="bg-neutral-950 border border-amber-500/30 rounded-3xl p-6">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>เพิ่มร้านค้าและเมนูอาหารใหม่</span>
            </h3>

            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="ชื่อเมนู (เช่น ข้าวหมูกรอบ)"
                value={newCoupon.name}
                onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                className="px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-2xl text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="ชื่อร้านค้า (เช่น ร้านป้าแดง)"
                value={newCoupon.storeName}
                onChange={(e) => setNewCoupon({ ...newCoupon, storeName: e.target.value })}
                className="px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-2xl text-xs text-white"
              />
              <input
                type="text"
                placeholder="คำอธิบาย (ถ้ามี)"
                value={newCoupon.description}
                onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                className="px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-2xl text-xs text-white"
              />
              <div className="sm:col-span-3 text-right">
                <button
                  type="submit"
                  disabled={creatingCoupon}
                  className="py-2.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider shadow-md border border-amber-300 transition-all"
                >
                  {creatingCoupon ? 'กำลังบันทึก...' : 'บันทึกคูปองใหม่'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6">
            <h3 className="text-base font-black text-white mb-4 uppercase tracking-wider">
              รายการคูปองอาหารทั้งหมด ({coupons.length})
            </h3>
            <div className="space-y-3">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-black text-white">{c.name}</h4>
                    <p className="text-xs text-neutral-400">
                      ร้าน: {c.storeName} • มีผู้ใช้สิทธิ์แล้ว {c._count?.redemptions || 0} คน
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="p-2 text-neutral-400 hover:text-red-400 rounded-xl hover:bg-neutral-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
