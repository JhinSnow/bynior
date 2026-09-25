'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, Play, RotateCcw, Volume2, ArrowLeft, Star, Film } from 'lucide-react';
import Link from 'next/link';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Participant {
  id: string;
  studentId: string;
  fullName: string;
}

interface StaffMember {
  id: string;
  fullName: string;
  orderIndex: number;
}

interface StaffGroup {
  category: string;
  label: string;
  members: StaffMember[];
}

const SONG_1_ID = 'KQQ5YszMNfc';
const SONG_2_ID = 'lxVPCXYN9ww';

export default function EndCreditTheaterPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staffGroups, setStaffGroups] = useState<StaffGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Theater state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState<1 | 2>(1);

  // Animation timeline sync
  const [offsetY, setOffsetY] = useState<number>(1920);
  const contentRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // YouTube Players
  const player1Ref = useRef<any>(null);
  const player2Ref = useRef<any>(null);
  const [totalDuration, setTotalDuration] = useState<number>(480); // Default estimate ~8 min fallback
  const duration1Ref = useRef<number>(240);
  const duration2Ref = useRef<number>(240);

  // Fetch attendees and credits from Database
  useEffect(() => {
    fetch('/api/admin/credits')
      .then((res) => res.json())
      .then((data) => {
        setParticipants(data.participants || []);
        setStaffGroups(data.staffGroups || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayers();
    };

    if (window.YT && window.YT.Player) {
      initPlayers();
    }
  }, []);

  const initPlayers = () => {
    player1Ref.current = new window.YT.Player('yt-player-1', {
      videoId: SONG_1_ID,
      playerVars: { controls: 0, disablekb: 1, rel: 0 },
      events: {
        onReady: (event: any) => {
          const d1 = event.target.getDuration() || 240;
          duration1Ref.current = d1;
          updateTotalDuration();
        },
        onStateChange: (event: any) => {
          // เมื่อเพลงที่ 1 เล่นจบ (State 0 = Ended) สั่งเล่นเพลงที่ 2 ต่อทันที
          if (event.data === 0) {
            setCurrentSongIndex(2);
            player2Ref.current?.playVideo();
          }
        },
      },
    });

    player2Ref.current = new window.YT.Player('yt-player-2', {
      videoId: SONG_2_ID,
      playerVars: { controls: 0, disablekb: 1, rel: 0 },
      events: {
        onReady: (event: any) => {
          const d2 = event.target.getDuration() || 240;
          duration2Ref.current = d2;
          updateTotalDuration();
        },
        onStateChange: (event: any) => {
          // เมื่อเพลงที่ 2 จบ เป็นอันเสร็จสิ้น
          if (event.data === 0) {
            setIsCompleted(true);
            setIsPlaying(false);
          }
        },
      },
    });
  };

  const updateTotalDuration = () => {
    const total = duration1Ref.current + duration2Ref.current;
    if (total > 0) setTotalDuration(total);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Fullscreen toggle with cross-browser and mobile Safari support
  const toggleFullscreen = async () => {
    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        const elem = containerRef.current || document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  // Start Playback
  const handleStartPlay = () => {
    setIsPlaying(true);
    setIsCompleted(false);
    setControlsVisible(false);
    startTimeRef.current = null;

    // เล่นเพลงที่ 1
    setCurrentSongIndex(1);
    player1Ref.current?.playVideo();
  };

  // Reset
  const handleReset = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsPlaying(false);
    setIsCompleted(false);
    setOffsetY(1920);
    startTimeRef.current = null;
    player1Ref.current?.stopVideo();
    player2Ref.current?.stopVideo();
    player1Ref.current?.seekTo(0);
    player2Ref.current?.seekTo(0);
    setControlsVisible(true);
  };

  // Scroll Animation loop synced with timeline
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = (timestamp - startTimeRef.current) / 1000;

      if (contentRef.current) {
        const contentHeight = contentRef.current.offsetHeight;
        // ปลายทาง: รายชื่อคนสุดท้ายของสโมสรเลื่อนขึ้นมาถึงกึ่งกลางหน้าจอพอดี
        const totalDistance = 1920 + contentHeight - 960;
        const progress = Math.min(elapsed / totalDuration, 1);

        const currentY = 1920 - progress * totalDistance;
        setOffsetY(currentY);

        if (progress >= 1) {
          setIsCompleted(true);
          setIsPlaying(false);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalDuration]);

  // ซ่อน/แสดง Controls เมื่อเมาส์ขยับ
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      if (isPlaying) {
        timeout = setTimeout(() => setControlsVisible(false), 3000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none relative font-luxurious"
    >
      {/* Hidden YouTube Audio Players */}
      <div className="hidden pointer-events-none">
        <div id="yt-player-1" />
        <div id="yt-player-2" />
      </div>

      {/* Floating Minimal Controls */}
      <div
        className={`fixed top-4 left-4 right-4 z-50 flex items-center justify-between transition-opacity duration-500 pointer-events-auto ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Link
          href="/admin/activities"
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้า Admin</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-[11px] text-amber-400 font-mono shadow-md">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            <span>Soundtrack #{currentSongIndex}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white shadow-md"
            title="สลับเต็มจอ (Fullscreen)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {isPlaying && (
            <button
              onClick={handleReset}
              className="p-2 rounded-full bg-red-950 border border-red-700 text-red-200 hover:bg-red-900 shadow-md"
              title="เริ่มใหม่ (Reset)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Start Playback Screen Overlay */}
      {!isPlaying && !isCompleted && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-amber-400 tracking-widest mb-3">
            BYENIOR 2026 END CREDIT
          </h2>
          <p className="text-sm text-neutral-400 max-w-md mb-8">
            พร้อมระบบฉายอัตราส่วนแนวตั้ง 16:9 Vertical (1080x1920) ซิงค์เพลงประกอบ 2 เพลงอัตโนมัติ
          </p>

          <button
            onClick={handleStartPlay}
            disabled={loading}
            className="px-10 py-5 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-black text-xl tracking-wider uppercase shadow-2xl transition-all flex items-center gap-3 border-2 border-amber-300"
          >
            <Play className="w-6 h-6 fill-black" />
            <span>เริ่มฉาย END CREDIT</span>
          </button>

          <div className="flex gap-6 mt-8 text-xs text-slate-500">
            <span>ผู้เข้าร่วมงาน: {participants.length} คน</span>
            <span>ฝ่ายดำเนินงาน: {staffGroups.reduce((acc, g) => acc + g.members.length, 0)} คน</span>
          </div>
        </div>
      )}

      {/* 16:9 Vertical Stage (Fixed 1080x1920 Canvas with CSS Matrix Scale) */}
      <div
        className="relative bg-black text-white overflow-hidden shadow-2xl origin-center shrink-0 border border-slate-900"
        style={{
          width: '1080px',
          height: '1920px',
          transform: `scale(min(calc(100vw / 1080), calc(100vh / 1920)))`,
        }}
      >
        {/* Scroll Content Track */}
        <div
          ref={contentRef}
          className="w-full text-center px-16 will-change-transform"
          style={{ transform: `translate3d(0, ${offsetY}px, 0)` }}
        >
          {/* Header */}
          <div className="mb-48">
            <p className="text-3xl text-amber-400 tracking-[0.3em] uppercase mb-4 font-semibold">
              Faculty of Science • Byenior Celebration
            </p>
            <h1 className="text-8xl font-black tracking-widest text-white mb-6">
              BYENIOR 2026
            </h1>
            <p className="text-3xl text-slate-400 font-light tracking-widest">
              MEMORIES & GRATITUDE CREDITS
            </p>
          </div>

          {/* Part 1: Attendees (ผู้เข้าร่วมงานที่ Checked-in แสดงเฉพาะชื่อ-นามสกุล) */}
          <div className="mb-56">
            <h2 className="text-5xl font-bold tracking-[0.2em] text-amber-300 border-b-2 border-amber-500/40 pb-6 inline-block mb-20 uppercase">
              ATTENDEES
            </h2>

            <div className="grid grid-cols-2 gap-y-7 gap-x-12 text-3xl text-slate-100 font-light max-w-4xl mx-auto">
              {participants.length === 0 ? (
                <div className="col-span-2 text-slate-500 text-2xl py-6">
                  (ยังไม่มีรายชื่อผู้เช็คชื่อเข้าร่วมงาน)
                </div>
              ) : (
                participants.map((p) => (
                  <div key={p.id} className="text-center tracking-wide py-1">
                    <span className="font-normal text-white">{p.fullName}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Part 2: Staff & Organizers (ผู้ร่วมจัด, ชุมนุม, สโมสร) */}
          {staffGroups.map((group) => (
            <div key={group.category} className="mb-56">
              <h2 className="text-5xl font-black tracking-widest text-amber-400 mb-14 uppercase">
                {group.label}
              </h2>
              <div
                className={`${
                  group.members.length > 25
                    ? 'grid grid-cols-2 gap-y-7 gap-x-12 max-w-4xl mx-auto'
                    : 'space-y-7'
                } text-3xl text-slate-100 font-light`}
              >
                {group.members.length === 0 ? (
                  <p className="col-span-2 text-slate-500 text-2xl italic">- ไม่พบรายชื่อ -</p>
                ) : (
                  group.members.map((m) => (
                    <p key={m.id} className="tracking-wide font-normal text-white py-1">
                      {m.fullName}
                    </p>
                  ))
                )}
              </div>
            </div>
          ))}

          {/* Final Ending Message */}
          <div className="py-72 text-center">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-700 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-2xl">
              <Star className="w-10 h-10 fill-amber-300 text-amber-300" />
            </div>
            <h3 className="text-6xl sm:text-7xl font-serif text-amber-300 mb-6 tracking-wider uppercase font-black space-y-2">
              <span className="block">THANK YOU</span>
              <span className="block text-4xl sm:text-5xl text-amber-400/90 font-bold tracking-widest mt-3">
                FOR BEING A PART OF US
              </span>
            </h3>
            <p className="text-3xl text-neutral-300 tracking-widest font-light">
              ขอให้ทุกก้าวเดินต่อไปในอนาคตเต็มไปด้วยความสุขและความสำเร็จ
            </p>
            <div className="mt-16 text-2xl text-amber-400/80 font-mono tracking-widest uppercase font-bold">
              FACULTY OF SCIENCE • BYENIOR 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
