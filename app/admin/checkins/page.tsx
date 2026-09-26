'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Clock, 
  UserCheck, 
  UserX,
  Ticket,
  Filter,
  Sparkles
} from 'lucide-react';

interface Attendee {
  id: string;
  studentId: string;
  fullName: string;
  lastName: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  _count: {
    redemptions: number;
    luckyDrawWins: number;
  };
}

export default function AdminCheckinsPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, checkedIn: 0, notCheckedIn: 0, percentage: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CHECKED_IN' | 'NOT_CHECKED_IN'>('ALL');

  const fetchCheckins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/checkins');
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
        setStats(data.stats || { total: 0, checkedIn: 0, notCheckedIn: 0, percentage: 0 });
      }
    } catch (err) {
      console.error('Failed to load checkins:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCheckins();
  };

  // กรองข้อมูลตามการค้นหาและสถานะ
  const filteredAttendees = useMemo(() => {
    return attendees.filter((item) => {
      const matchesSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === 'CHECKED_IN') return item.isCheckedIn;
      if (filterStatus === 'NOT_CHECKED_IN') return !item.isCheckedIn;
      return true;
    });
  }, [attendees, searchQuery, filterStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-amber-200">กำลังโหลดรายชื่อผู้ลงทะเบียน...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4.5 text-center shadow-lg">
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
            ผู้มีสิทธิ์ทั้งหมด
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            {stats.total} <span className="text-xs font-normal text-neutral-500">คน</span>
          </span>
        </div>

        <div className="bg-neutral-950 border border-amber-500/40 rounded-3xl p-4.5 text-center shadow-lg relative overflow-hidden">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
            ลงทะเบียนเข้างานแล้ว
          </span>
          <span className="text-2xl font-black text-amber-300 mt-1 block">
            {stats.checkedIn} <span className="text-xs font-normal text-amber-400/70">คน</span>
          </span>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4.5 text-center shadow-lg">
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
            ยังไม่ลงทะเบียน
          </span>
          <span className="text-2xl font-black text-neutral-400 mt-1 block">
            {stats.notCheckedIn} <span className="text-xs font-normal text-neutral-600">คน</span>
          </span>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4.5 text-center shadow-lg">
          <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">
            อัตราการเข้างาน
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {stats.percentage}%
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยรหัสนักศึกษา หรือ ชื่อ-สกุล..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-700 focus:border-amber-400 rounded-2xl text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Pills & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-2xl border border-neutral-800">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider transition-all ${
                  filterStatus === 'ALL'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({attendees.length})
              </button>
              <button
                onClick={() => setFilterStatus('CHECKED_IN')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider transition-all flex items-center gap-1 ${
                  filterStatus === 'CHECKED_IN'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>เข้างานแล้ว ({stats.checkedIn})</span>
              </button>
              <button
                onClick={() => setFilterStatus('NOT_CHECKED_IN')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-wider transition-all flex items-center gap-1 ${
                  filterStatus === 'NOT_CHECKED_IN'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>ยังไม่มา ({stats.notCheckedIn})</span>
              </button>
            </div>

            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-300 hover:text-white transition-all shrink-0 ${
                refreshing ? 'animate-spin text-amber-400' : ''
              }`}
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Attendees List Card */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              รายชื่อผู้เข้าร่วมงาน ({filteredAttendees.length} รายการ)
            </h3>
          </div>
        </div>

        {filteredAttendees.length === 0 ? (
          <div className="text-center py-14 text-neutral-500">
            <UserX className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
            <p className="text-xs font-bold uppercase tracking-wider">ไม่พบรายชื่อตรงกับเงื่อนไขที่ค้นหา</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredAttendees.map((attendee, index) => (
              <div
                key={attendee.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  attendee.isCheckedIn
                    ? 'bg-neutral-900/90 border-emerald-500/30'
                    : 'bg-neutral-900/40 border-neutral-800/80 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      attendee.isCheckedIn
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{attendee.fullName}</h4>
                      {attendee._count.luckyDrawWins > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-black flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 fill-black" />
                          <span>ได้รางวัลแล้ว</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-amber-300/80">
                        {attendee.studentId}
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[11px] text-neutral-400">
                        ใช้คูปองแล้ว {attendee._count.redemptions} ใบ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-neutral-800/60 pt-2 sm:pt-0">
                  {attendee.isCheckedIn ? (
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ลงทะเบียนแล้ว</span>
                      </span>
                      {attendee.checkedInAt && (
                        <p className="text-[10px] font-mono text-neutral-400 mt-1 flex items-center sm:justify-end gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>
                            {new Date(attendee.checkedInAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })} น.
                          </span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-neutral-800/80 text-neutral-400 border border-neutral-700">
                      <XCircle className="w-3.5 h-3.5 text-neutral-500" />
                      <span>ยังไม่ลงทะเบียน</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
