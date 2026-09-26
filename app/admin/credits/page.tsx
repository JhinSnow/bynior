'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, Play, Pause, RotateCcw, Volume2, ArrowLeft, Star, Film, Bug, FastForward, Gauge, Image as ImageIcon, Sparkles, Heart, Music, Music2, AlertCircle } from 'lucide-react';
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

const SONG_1_ID = 'KQQ5YszMNfc'; // เมื่อถูกค้นพบ - FREEHAND
const SONG_1_TITLE = 'เมื่อถูกค้นพบ - FREEHAND';
const SONG_2_ID = 'ouKiGEKnPso'; // Had I Not Seen the Sun - HOYO-MiX (Robin / Chevy)
const SONG_2_TITLE = 'Had I Not Seen the Sun - HOYO-MiX';

export default function EndCreditTheaterPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [staffGroups, setStaffGroups] = useState<StaffGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Theater state
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef<boolean>(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState<1 | 2>(1);
  const currentSongIndexRef = useRef<1 | 2>(1);
  const [song1Status, setSong1Status] = useState<string>('Unloaded');
  const [song2Status, setSong2Status] = useState<string>('Unloaded');
  const [audioError, setAudioError] = useState<string | null>(null);

  // Debug Mode & Speed Controls (สำหรับตรวจสอบความเร็วและคำใน End Credit)
  const [debugMode, setDebugMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const speedRef = useRef<number>(1);
  const virtualElapsedRef = useRef<number>(0);
  const lastTimestampRef = useRef<number | null>(null);

  // Animation timeline sync
  const [offsetY, setOffsetY] = useState<number>(1920);
  const contentRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const namesSectionRef = useRef<HTMLDivElement>(null);
  const photoCardRef = useRef<HTMLDivElement>(null);
  const thankYouRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<number>(0);
  // Simulated sticky & center transition: computed screen position for the photo overlay
  const [photoLayout, setPhotoLayout] = useState<{
    x: number;
    y: number;
    width: number;
    opacity: number;
    isCentered: boolean;
  }>({
    x: 40,
    y: -9999,
    width: 420,
    opacity: 1,
    isCentered: false,
  });

  // Photo image display state (loads from /LOGO.png or falls back to placeholder)
  const [photoUrl, setPhotoUrl] = useState<string>('/LOGO.png');
  const [photoLoadError, setPhotoLoadError] = useState<boolean>(false);

  // Single YouTube Player Architecture (guarantees seamless transition without browser multi-iframe restrictions)
  const playerRef = useRef<any>(null);
  // เพลง 1 (240s) + เพลง 2 (145s) = 385s (ค่า default ที่แม่นยำ ป้องกันการข้ามชื่อหรือกระตุกตอนสลับเพลง)
  const [totalDuration, setTotalDuration] = useState<number>(385);
  const totalDurationRef = useRef<number>(385);
  const duration1Ref = useRef<number>(240);
  const duration2Ref = useRef<number>(145);

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
      initPlayer();
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }
  }, []);

  const initPlayer = () => {
    try {
      playerRef.current = new window.YT.Player('yt-player-unified', {
        videoId: SONG_1_ID,
        playerVars: { controls: 0, disablekb: 1, rel: 0, enablejsapi: 1 },
        events: {
          onReady: (event: any) => {
            setSong1Status('Ready');
            const d1 = event.target.getDuration();
            if (d1 && d1 > 0) {
              duration1Ref.current = Math.round(d1);
              updateTotalDuration();
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
            if (event.data === 1 && !isPlayingRef.current) {
              try {
                event.target.pauseVideo();
              } catch {}
              return;
            }

            const activeIdx = currentSongIndexRef.current;
            if (event.data === 1) {
              if (activeIdx === 1) {
                setSong1Status('Playing');
                const d1 = playerRef.current?.getDuration();
                if (d1 && d1 > 0) {
                  duration1Ref.current = Math.round(d1);
                  updateTotalDuration();
                }
              } else {
                setSong2Status('Playing');
                const d2 = playerRef.current?.getDuration();
                if (d2 && d2 > 0) {
                  duration2Ref.current = Math.round(d2);
                  updateTotalDuration();
                }
              }
            } else if (event.data === 2) {
              if (activeIdx === 1) setSong1Status('Paused');
              else setSong2Status('Paused');
            } else if (event.data === 3) {
              if (activeIdx === 1) setSong1Status('Buffering');
              else setSong2Status('Buffering');
            } else if (event.data === 0) {
              // Song Ended
              if (activeIdx === 1) {
                // Song 1 ended -> transition to Song 2
                setSong1Status('Ended');
                setCurrentSongIndex(2);
                currentSongIndexRef.current = 2;
                setSong2Status('Loading & Playing...');
                try {
                  playerRef.current?.loadVideoById(SONG_2_ID);
                  playerRef.current?.unMute();
                  playerRef.current?.playVideo();
                } catch (e: any) {
                  setAudioError(`Song 2 load failed: ${e.message}`);
                }
              } else {
                // Song 2 ended -> finish audio, DO NOT REPEAT
                setSong2Status('Ended');
                try {
                  playerRef.current?.stopVideo();
                } catch {}
                // If scroll has reached THANK YOU (>= 98%), complete
                if (progressRef.current >= 0.98) {
                  setIsCompleted(true);
                  setIsPlaying(false);
                }
              }
            }
          },
          onError: (e: any) => {
            const msg = `Audio error: code ${e.data} (150/101 = restricted by creator)`;
            if (currentSongIndexRef.current === 1) setSong1Status(msg);
            else setSong2Status(msg);
            setAudioError(msg);
          },
        },
      });
    } catch (err: any) {
      setAudioError(`Init error: ${err.message}`);
    }
  };

  // Helper to switch or test specific song directly from Debug Mode
  const playSpecificSong = (songIdx: 1 | 2) => {
    setCurrentSongIndex(songIdx);
    currentSongIndexRef.current = songIdx;
    setAudioError(null);
    try {
      playerRef.current?.unMute();
      if (songIdx === 1) {
        setSong1Status('Loading & Playing...');
        playerRef.current?.loadVideoById(SONG_1_ID);
      } else {
        setSong2Status('Loading & Playing...');
        playerRef.current?.loadVideoById(SONG_2_ID);
      }
      playerRef.current?.playVideo();
    } catch (err: any) {
      setAudioError(`Play error: ${err.message}`);
    }
  };

  const updateTotalDuration = () => {
    const total = duration1Ref.current + duration2Ref.current;
    if (total > 0) {
      totalDurationRef.current = total;
      setTotalDuration(total);
    }
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

  // Fullscreen toggle with reliable documentElement target
  const toggleFullscreen = () => {
    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          (elem as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  // Helper to calculate photo layout (sticky on left -> smoothly center and expand before THANK YOU)
  const calculatePhotoLayout = useCallback((currentY: number) => {
    if (!namesSectionRef.current) return;

    const namesTop = namesSectionRef.current.offsetTop;
    const namesHeight = namesSectionRef.current.offsetHeight;

    // Stable card dimensions (NO dynamic DOM measuring to prevent oscillation / flicker)
    const STICKY_CARD_HEIGHT = 620;
    const initialWidth = 420;
    const stickyScreenY = Math.round((1920 - STICKY_CARD_HEIGHT) / 2); // 650px (Dead Center vertically)
    const leftX = 40;

    const targetWidth = 420; // compact and balanced size
    const targetHeight = Math.round((420 * 4) / 3); // 560px (3:4 ratio)
    const centerX = (1080 - targetWidth) / 2; // 330px (Dead Center horizontally)
    const centerY = (1920 - targetHeight) / 2; // 680px (Dead Center vertically)

    const namesVisualTop = currentY + namesTop;
    const namesVisualBottom = currentY + namesTop + namesHeight;

    // Trigger right when the last name passes the sticky card center position
    // (no long delay or waiting for names to clear all the way to screen top)
    const TRIGGER_EXIT_POINT = stickyScreenY + 120;

    if (namesVisualTop > stickyScreenY) {
      // 1. Before names reach center sticky point -> scrolls in naturally with content
      setPhotoLayout({
        x: leftX,
        y: namesVisualTop,
        width: initialWidth,
        opacity: 1,
        isCentered: false,
      });
    } else if (namesVisualBottom > TRIGGER_EXIT_POINT) {
      // 2. Names are scrolling through -> photo stays pinned on the left
      setPhotoLayout({
        x: leftX,
        y: stickyScreenY,
        width: initialWidth,
        opacity: 1,
        isCentered: false,
      });
    } else {
      // 3. Last name has just passed sticky card -> smoothly glide to center, hold, then fade out cleanly
      const distancePast = TRIGGER_EXIT_POINT - namesVisualBottom;

      const MOVE_DURATION = 350; // Glide smoothly to center and scale gently
      const HOLD_DURATION = 400; // Hold in center spotlight
      const FADE_DURATION = 250; // Fade out completely before THANK YOU section arrives

      if (distancePast < MOVE_DURATION) {
        // Moving from left to center and transitioning smoothly
        const t = Math.min(1, Math.max(0, distancePast / MOVE_DURATION));
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const curX = leftX + (centerX - leftX) * ease;
        const curY = stickyScreenY + (centerY - stickyScreenY) * ease;
        const curWidth = initialWidth + (targetWidth - initialWidth) * ease;

        setPhotoLayout({
          x: curX,
          y: curY,
          width: curWidth,
          opacity: 1,
          isCentered: ease > 0.4,
        });
      } else if (distancePast < MOVE_DURATION + HOLD_DURATION) {
        // Spotlight hold in center
        setPhotoLayout({
          x: centerX,
          y: centerY,
          width: targetWidth,
          opacity: 1,
          isCentered: true,
        });
      } else if (distancePast < MOVE_DURATION + HOLD_DURATION + FADE_DURATION) {
        // Smoothly dissolve out to 0 opacity BEFORE THANK YOU appears
        const fadeT = (distancePast - MOVE_DURATION - HOLD_DURATION) / FADE_DURATION;
        setPhotoLayout({
          x: centerX,
          y: centerY,
          width: targetWidth,
          opacity: Math.max(0, 1 - fadeT),
          isCentered: true,
        });
      } else {
        // 100% gone
        setPhotoLayout({
          x: centerX,
          y: -9999,
          width: targetWidth,
          opacity: 0,
          isCentered: true,
        });
      }
    }
  }, []);

  // Set speed ref when speed changes
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    speedRef.current = speed;
  };

  // Start Playback
  const handleStartPlay = () => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    setIsCompleted(false);
    setControlsVisible(false);
    lastTimestampRef.current = null;
    progressRef.current = 0;

    // เล่นเพลงที่ 1
    setCurrentSongIndex(1);
    currentSongIndexRef.current = 1;
    setAudioError(null);
    try {
      playerRef.current?.unMute();
      playerRef.current?.loadVideoById(SONG_1_ID);
      playerRef.current?.playVideo();
    } catch {}
  };

  // Toggle Pause (Debug mode)
  const handleTogglePause = () => {
    if (!isPlaying) {
      // If stopped from initial screen, start play
      handleStartPlay();
      return;
    }

    if (!isPaused) {
      // Pause
      setIsPaused(true);
      try {
        playerRef.current?.pauseVideo();
      } catch {}
    } else {
      // Resume
      setIsPaused(false);
      lastTimestampRef.current = null;
      try {
        playerRef.current?.playVideo();
      } catch {}
    }
  };

  // Jump to specific percentage (0 to 100)
  const handleSeek = (percent: number) => {
    const fraction = Math.max(0, Math.min(1, percent / 100));
    const scrollTargetDuration = Math.max(60, totalDurationRef.current - 12);
    virtualElapsedRef.current = fraction * scrollTargetDuration;
    setProgressPercent(fraction * 100);
    progressRef.current = fraction;

    if (contentRef.current) {
      const thankYouTop = thankYouRef.current ? thankYouRef.current.offsetTop : contentRef.current.offsetHeight - 400;
      const thankYouHeight = thankYouRef.current ? thankYouRef.current.offsetHeight : 600;
      const thankYouCenter = thankYouTop + thankYouHeight / 2;
      const totalDistance = 960 + thankYouCenter;

      const currentY = 1920 - fraction * totalDistance;
      setOffsetY(currentY);
      calculatePhotoLayout(currentY);
    }
  };

  // Reset
  const handleReset = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsPaused(false);
    setIsCompleted(false);
    setCurrentSongIndex(1);
    currentSongIndexRef.current = 1;
    setSong1Status('Ready');
    setSong2Status('Unloaded');
    setOffsetY(1920);
    virtualElapsedRef.current = 0;
    setProgressPercent(0);
    progressRef.current = 0;
    lastTimestampRef.current = null;
    try {
      playerRef.current?.pauseVideo();
      playerRef.current?.cueVideoById(SONG_1_ID, 0);
    } catch {}
    setControlsVisible(true);
    setPhotoLayout({
      x: 40,
      y: -9999,
      width: 420,
      opacity: 1,
      isCentered: false,
    });
  };

  // Scroll Animation loop with speed multiplier and pause check
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }
      const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      // เพิ่มเวลาตาม speed multiplier
      virtualElapsedRef.current += deltaSec * speedRef.current;
      const elapsed = virtualElapsedRef.current;
      const curTotalDuration = totalDurationRef.current;

      if (contentRef.current) {
        const thankYouTop = thankYouRef.current ? thankYouRef.current.offsetTop : contentRef.current.offsetHeight - 400;
        const thankYouHeight = thankYouRef.current ? thankYouRef.current.offsetHeight : 600;
        const thankYouCenter = thankYouTop + thankYouHeight / 2;
        // ปลายทาง: ให้ข้อความ THANK YOU เลื่อนมาหยุดที่กึ่งกลางจอ (Y = 960) พอดีเป๊ะ
        const totalDistance = 960 + thankYouCenter;

        // สิ้นสุดการเลื่อนก่อนเพลงจบ 12 วินาที เพื่อให้จอค้างที่หน้า THANK YOU พร้อมเสียงดนตรีช่วงท้าย
        const scrollTargetDuration = Math.max(60, curTotalDuration - 12);
        const progress = Math.min(elapsed / scrollTargetDuration, 1);
        progressRef.current = progress;
        setProgressPercent(progress * 100);

        const currentY = 1920 - progress * totalDistance;
        setOffsetY(currentY);
        calculatePhotoLayout(currentY);

        if (progress >= 1) {
          // ถึงหน้า THANK YOU แล้ว จอดค้างตรงกลาง
          // ถ้าเล่นจนครบเวลาเพลงทั้งหมดแล้ว หรือเพลงที่ 2 จบแล้ว ให้จบสมบูรณ์
          if (elapsed >= curTotalDuration) {
            setIsCompleted(true);
            setIsPlaying(false);
            setIsPaused(false);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isPaused]);

  // ซ่อน/แสดง Controls เมื่อเมาส์ขยับ
  useEffect(() => {
    if (debugMode) {
      setControlsVisible(true);
      return;
    }

    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timeout);
      if (isPlaying && !debugMode) {
        timeout = setTimeout(() => setControlsVisible(false), 3000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying, debugMode]);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden select-none relative font-luxurious"
    >
      {/* Single YouTube Audio Player (off-screen so browser plays without throttling) */}
      <div className="absolute -left-[9999px] -top-[9999px] w-[200px] h-[200px] opacity-0 pointer-events-none">
        <div id="yt-player-unified" />
      </div>

      {/* Floating Minimal Controls */}
      <div
        className={`fixed top-4 left-4 right-4 z-50 flex items-center justify-between transition-opacity duration-500 pointer-events-auto ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {!isFullscreen ? (
          <Link
            href="/admin/activities"
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white text-xs shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้า Admin</span>
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {!isFullscreen && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-[11px] text-amber-400 font-mono shadow-md">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                <span>Soundtrack #{currentSongIndex}</span>
              </div>

              {/* Debug Mode Toggle */}
              <button
                onClick={() => setDebugMode(!debugMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md transition-all ${
                  debugMode
                    ? 'bg-amber-400 text-black border-amber-300'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
                title="สลับโหมด Debug สำหรับตรวจสอบคำและความเร็ว"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Debug</span>
              </button>
            </>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white shadow-md"
            title="สลับเต็มจอ (Fullscreen)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {!isFullscreen && isPlaying && (
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

      {/* Floating Debug Toolbar when Debug Mode is ON (hidden in fullscreen to keep theater view clean) */}
      {debugMode && !isFullscreen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-950/95 border-2 border-amber-400 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 max-w-xl w-[92%] sm:w-auto font-sans">
          <div className="flex items-center justify-between gap-4 text-xs font-mono text-amber-300 border-b border-neutral-800 pb-2">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>DEBUG CONTROL PANEL</span>
            </span>
            <span className="text-neutral-400">
              Progress: <strong className="text-white">{progressPercent.toFixed(1)}%</strong> • Speed: <strong className="text-amber-400">{playbackSpeed}x</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Play / Pause Toggle Button */}
            <button
              onClick={handleTogglePause}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              {isPlaying && !isPaused ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
              <span>{isPlaying && !isPaused ? 'หยุดชั่วคราว (Pause)' : 'เล่นต่อ (Play)'}</span>
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              <FastForward className="w-3.5 h-3.5 text-neutral-400 ml-1.5 mr-1" />
              {[1, 2, 4, 8, 16].map((spd) => (
                <button
                  key={spd}
                  onClick={() => changeSpeed(spd)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    playbackSpeed === spd
                      ? 'bg-amber-400 text-black shadow-sm font-black'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-red-950 text-neutral-400 hover:text-red-300 border border-neutral-800 text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Scrub Slider */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-neutral-500 font-mono">0%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={0.1}
              value={progressPercent}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg"
            />
            <span className="text-[10px] text-neutral-500 font-mono">100%</span>
          </div>

          {/* Soundtracks Debug & Testing Section */}
          <div className="mt-1 pt-2 border-t border-neutral-800 flex flex-col gap-1.5 text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Music className="w-3.5 h-3.5" />
                <span>SOUNDTRACK AUDIT & TEST</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                Playing: <strong className="text-amber-400 font-bold">#{currentSongIndex}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-0.5">
              {/* Song 1 Card */}
              <div
                className={`p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                  currentSongIndex === 1
                    ? 'bg-amber-400/10 border-amber-400/60'
                    : 'bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 truncate text-[11px]">
                    #1: {SONG_1_TITLE}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      song1Status === 'Playing'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : song1Status.startsWith('Error')
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {song1Status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-neutral-500 font-mono">{duration1Ref.current.toFixed(0)}s</span>
                  <button
                    onClick={() => playSpecificSong(1)}
                    className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    <span>ทดสอบเปิดเพลง 1</span>
                  </button>
                </div>
              </div>

              {/* Song 2 Card */}
              <div
                className={`p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                  currentSongIndex === 2
                    ? 'bg-amber-400/10 border-amber-400/60'
                    : 'bg-neutral-900 border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 truncate text-[11px]">
                    #2: {SONG_2_TITLE}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      song2Status === 'Playing'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : song2Status.startsWith('Error')
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {song2Status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-neutral-500 font-mono">{duration2Ref.current.toFixed(0)}s</span>
                  <button
                    onClick={() => playSpecificSong(2)}
                    className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Play className="w-3 h-3 fill-black" />
                    <span>ทดสอบเปิดเพลง 2</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner if any */}
            {audioError && (
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="font-mono">{audioError}</span>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Completed / Finished Screen Overlay */}
      {isCompleted && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-2xl">
            <Star className="w-10 h-10 fill-amber-300 text-amber-300" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-amber-400 tracking-widest mb-3 uppercase">
            END OF CREDITS
          </h2>
          <p className="text-base text-neutral-300 max-w-md mb-8">
            การฉาย End Credit เสร็จสมบูรณ์แล้ว
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-black text-lg tracking-wider uppercase shadow-2xl transition-all flex items-center gap-2.5 border-2 border-amber-300"
            >
              <RotateCcw className="w-5 h-5" />
              <span>ฉายใหม่อีกครั้ง (Replay)</span>
            </button>

            <Link
              href="/admin/activities"
              className="px-8 py-4 rounded-full bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-200 font-bold text-lg tracking-wider shadow-xl transition-all flex items-center gap-2.5 border border-neutral-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>กลับหน้าหลัก Admin</span>
            </Link>
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
          className="w-full text-center will-change-transform"
          style={{ transform: `translate3d(0, ${offsetY}px, 0)` }}
        >
          {/* Header */}
          <div className="mb-32 px-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Film className="w-8 h-8 text-amber-400" />
              <p className="text-3xl text-amber-400 tracking-[0.3em] uppercase font-semibold">
                Faculty of Science • Sci-lywood Celebration
              </p>
              <Film className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-8xl font-black tracking-widest text-white mb-6">
              BYENIOR 2026
            </h1>
            <p className="text-3xl text-slate-400 font-light tracking-widest">
              MEMORIES & GRATITUDE CREDITS
            </p>
          </div>

          {/* Names Section: Right-aligned to leave space for photo overlay on left */}
          <div ref={namesSectionRef} className="ml-auto text-left pr-16" style={{ width: '580px' }}>
            {/* Part 1: Attendees */}
            <div className="mb-36">
              <div className="border-b-2 border-amber-400/60 pb-4 mb-10">
                <h2 className="text-4xl font-black tracking-[0.2em] text-amber-300 uppercase">
                  ATTENDEES
                </h2>
                <p className="text-sm text-neutral-400 tracking-wider font-mono mt-1">ผู้เข้าร่วมงาน BYENIOR 2026</p>
              </div>
              <div className="flex flex-col space-y-5 text-3xl text-slate-100 font-light">
                {participants.length === 0 ? (
                  <div className="text-slate-500 text-2xl py-6 italic">
                    (ยังไม่มีรายชื่อผู้เช็คชื่อเข้าร่วมงาน)
                  </div>
                ) : (
                  participants.map((p) => (
                    <div key={p.id} className="tracking-wide py-1 border-b border-neutral-800/40">
                      <span className="font-normal text-white">{p.fullName}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Part 2: Staff & Organizers */}
            {staffGroups.map((group) => (
              <div key={group.category} className="mb-36">
                <div className="border-b-2 border-amber-400/60 pb-4 mb-10">
                  <h2 className="text-4xl font-black tracking-widest text-amber-400 uppercase">
                    {group.label}
                  </h2>
                  <p className="text-sm text-neutral-400 tracking-wider font-mono mt-1">ทีมงานและคณะผู้จัดทำ</p>
                </div>
                <div className="flex flex-col space-y-5 text-3xl text-slate-100 font-light">
                  {group.members.length === 0 ? (
                    <p className="text-slate-500 text-2xl italic">- ไม่พบรายชื่อ -</p>
                  ) : (
                    group.members.map((m) => (
                      <div key={m.id} className="tracking-wide py-1 border-b border-neutral-800/40">
                        <span className="font-normal text-white">{m.fullName}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Spacer before THANK YOU (gives ample stage time for centered & expanded photo) */}
          <div className="h-[1200px]" />

          {/* Final Ending Message */}
          <div ref={thankYouRef} className="py-48 text-center px-16">
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

        {/* Photo Overlay: Floats & Simulates CSS sticky on left, then transitions to center & expands */}
        {photoLayout.opacity > 0 && photoLayout.y > -2000 && (
          <div
            ref={photoCardRef}
            className="absolute pointer-events-none will-change-transform"
            style={{
              left: `${photoLayout.x}px`,
              top: `${photoLayout.y}px`,
              width: `${photoLayout.width}px`,
              opacity: photoLayout.opacity,
            }}
          >
            <div className="w-full aspect-[3/4] bg-neutral-950 rounded-2xl flex flex-col items-center justify-center text-amber-300 relative overflow-hidden border-2 border-amber-400/50 shadow-2xl">
              {!photoLoadError ? (
                <img
                  src={photoUrl}
                  alt="Memories of Byenior 2026"
                  className="w-full h-full object-cover rounded-2xl"
                  onError={() => setPhotoLoadError(true)}
                />
              ) : (
                <div
                  className={`flex flex-col items-center justify-center ${
                    photoLayout.isCentered ? 'gap-8 p-6' : 'gap-5 p-3'
                  }`}
                >
                  <div
                    className={`rounded-full bg-neutral-900 border-2 border-amber-400 flex items-center justify-center shadow-2xl ${
                      photoLayout.isCentered ? 'w-36 h-36 border-amber-300' : 'w-24 h-24 border-amber-400/60'
                    }`}
                  >
                    <ImageIcon className={`${photoLayout.isCentered ? 'w-20 h-20 text-amber-300' : 'w-12 h-12 text-amber-400'}`} />
                  </div>
                  <div className="text-center px-4 font-luxurious">
                    <p
                      className={`font-black tracking-widest uppercase text-amber-300 ${
                        photoLayout.isCentered ? 'text-4xl tracking-[0.2em]' : 'text-2xl'
                      }`}
                    >
                      {photoLayout.isCentered ? 'FINAL MEMORIES PHOTO' : 'PHOTO PLACEHOLDER'}
                    </p>
                    <p
                      className={`text-neutral-400 tracking-wider ${
                        photoLayout.isCentered ? 'text-lg mt-3 uppercase' : 'text-sm mt-2'
                      }`}
                    >
                      {photoLayout.isCentered
                        ? 'FACULTY OF SCIENCE • CLASS OF 2026'
                        : 'MEMORIES OF BYENIOR 2026'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
