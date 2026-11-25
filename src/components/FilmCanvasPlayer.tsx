import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { renderFilmFrame } from '../engine/filmRenderer';
import { AnimationStyle, BeatClipAudio, BeatKey, CharacterLook, StoryboardBeat } from '../types';
import { decodeAudioBase64 } from '../utils/audio';

interface StaticThumbnailProps {
  beat: StoryboardBeat;
  style: AnimationStyle;
  look: CharacterLook;
  timeOffset?: number;
  className?: string;
}

export const FilmStyleThumbnail: React.FC<StaticThumbnailProps> = ({
  beat,
  style,
  look,
  timeOffset = 2.4,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderFilmFrame(ctx, canvas.width, canvas.height, {
      timeSec: beat.startSec + timeOffset,
      beat,
      beatProgress: 0.45,
      style,
      look,
      showSubtitles: false,
      isSpeaking: false,
    });
  }, [beat, style, look, timeOffset]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className={`w-full aspect-video rounded-xl block ${className}`}
    />
  );
};

interface FilmCanvasPlayerProps {
  beats: StoryboardBeat[];
  style: AnimationStyle;
  look: CharacterLook;
  audioMap: Partial<Record<BeatKey, BeatClipAudio>>;
  activeBeatOnly?: BeatKey | null;
  authorName?: string;
  showCreditAtEnd?: boolean;
  compact?: boolean;
}

export const FilmCanvasPlayer: React.FC<FilmCanvasPlayerProps> = ({
  beats,
  style,
  look,
  audioMap,
  activeBeatOnly = null,
  authorName = 'Dahyun',
  showCreditAtEnd = true,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const selectedBeats = activeBeatOnly
    ? beats.filter((b) => b.id === activeBeatOnly)
    : beats;

  const minTime = selectedBeats[0]?.startSec ?? 0;
  const maxTime = selectedBeats[selectedBeats.length - 1]?.endSec ?? 30;
  const totalDuration = Math.max(1, maxTime - minTime);

  const [currentTime, setCurrentTime] = useState(minTime);
  const currentTimeRef = useRef(minTime);
  const rafRef = useRef<number | null>(null);
  const lastWallRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const decodedCacheRef = useRef<Record<string, AudioBuffer>>({});
  const triggeredBeatsRef = useRef<Set<BeatKey>>(new Set());
  const speakingUntilRef = useRef<number>(0);

  // Reset timeline if activeBeatOnly changes
  useEffect(() => {
    stopAudioSource();
    triggeredBeatsRef.current.clear();
    setIsPlaying(false);
    currentTimeRef.current = minTime;
    setCurrentTime(minTime);
  }, [activeBeatOnly, minTime]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
    }
    if (isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [isMuted]);

  function stopAudioSource() {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {
        // already stopped
      }
      activeSourceRef.current.disconnect();
      activeSourceRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speakingUntilRef.current = 0;
  }

  async function ensureAudioContext(): Promise<AudioContext> {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (!gainNodeRef.current) {
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function speakWithBrowserFallback(beat: StoryboardBeat) {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(beat.englishLines);
    utterance.lang = 'en-US';
    utterance.rate = 0.98;
    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang.startsWith('en-US') && /natural|google|samantha|jenny|aria/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;

    speakingUntilRef.current = beat.endSec - 0.3;
    utterance.onend = () => {
      speakingUntilRef.current = 0;
    };
    window.speechSynthesis.speak(utterance);
  }

  async function triggerBeatAudio(beat: StoryboardBeat, offsetIntoAudio = 0) {
    const clip = audioMap[beat.id];
    if (!clip?.audioBase64) {
      speakWithBrowserFallback(beat);
      return;
    }

    try {
      const ctx = await ensureAudioContext();
      const cacheKey = `${beat.id}:${clip.audioBase64.slice(0, 32)}:${clip.audioBase64.length}`;
      let buffer = decodedCacheRef.current[cacheKey];
      if (!buffer) {
        buffer = await decodeAudioBase64(ctx, clip.audioBase64);
        decodedCacheRef.current[cacheKey] = buffer;
      }

      if (offsetIntoAudio >= buffer.duration) return;

      stopAudioSource();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(gainNodeRef.current ?? ctx.destination);
      src.start(0, Math.max(0, offsetIntoAudio));
      activeSourceRef.current = src;
      speakingUntilRef.current = currentTimeRef.current + (buffer.duration - offsetIntoAudio);
    } catch {
      speakWithBrowserFallback(beat);
    }
  }

  // Draw current frame whenever static dependencies or time update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeBeat =
      selectedBeats.find((b) => currentTime >= b.startSec && currentTime < b.endSec) ??
      selectedBeats[selectedBeats.length - 1] ??
      beats[0];

    if (!activeBeat) return;

    const beatDuration = Math.max(1, activeBeat.endSec - activeBeat.startSec);
    const beatProgress = Math.min(1, Math.max(0, (currentTime - activeBeat.startSec) / beatDuration));
    const showEndCredit =
      showCreditAtEnd && !activeBeatOnly && currentTime >= maxTime - 2.0;

    renderFilmFrame(ctx, canvas.width, canvas.height, {
      timeSec: currentTime,
      beat: activeBeat,
      beatProgress,
      style,
      look,
      showSubtitles: true,
      isSpeaking: isPlaying && currentTime <= speakingUntilRef.current,
      authorName,
      showEndCredit,
    });
  }, [currentTime, selectedBeats, beats, style, look, isPlaying, activeBeatOnly, maxTime, authorName, showCreditAtEnd]);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastWallRef.current = performance.now();

    const step = (now: number) => {
      const dt = (now - lastWallRef.current) / 1000;
      lastWallRef.current = now;

      const nextTime = currentTimeRef.current + dt;
      if (nextTime >= maxTime) {
        currentTimeRef.current = maxTime;
        setCurrentTime(maxTime);
        setIsPlaying(false);
        stopAudioSource();
        return;
      }

      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);

      const activeBeat = selectedBeats.find(
        (b) => nextTime >= b.startSec && nextTime < b.endSec
      );
      if (activeBeat && !triggeredBeatsRef.current.has(activeBeat.id)) {
        if (nextTime >= activeBeat.startSec + 0.05) {
          triggeredBeatsRef.current.add(activeBeat.id);
          void triggerBeatAudio(activeBeat, Math.max(0, nextTime - (activeBeat.startSec + 0.05)));
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, maxTime, selectedBeats, isMuted, audioMap]);

  useEffect(() => {
    return () => {
      stopAudioSource();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudioSource();
      return;
    }

    await ensureAudioContext();
    let startAt = currentTimeRef.current;
    if (startAt >= maxTime - 0.1) {
      startAt = minTime;
      currentTimeRef.current = minTime;
      setCurrentTime(minTime);
    }

    triggeredBeatsRef.current.clear();
    const activeBeat = selectedBeats.find((b) => startAt >= b.startSec && startAt < b.endSec);
    if (activeBeat) {
      triggeredBeatsRef.current.add(activeBeat.id);
      void triggerBeatAudio(activeBeat, Math.max(0, startAt - (activeBeat.startSec + 0.05)));
    }
    setIsPlaying(true);
  };

  const handleSeek = (targetTime: number) => {
    const clamped = Math.max(minTime, Math.min(maxTime, targetTime));
    stopAudioSource();
    triggeredBeatsRef.current.clear();
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);

    if (isPlaying) {
      const activeBeat = selectedBeats.find((b) => clamped >= b.startSec && clamped < b.endSec);
      if (activeBeat) {
        triggeredBeatsRef.current.add(activeBeat.id);
        void triggerBeatAudio(activeBeat, Math.max(0, clamped - (activeBeat.startSec + 0.05)));
      }
    }
  };

  const handleRestart = async () => {
    stopAudioSource();
    triggeredBeatsRef.current.clear();
    currentTimeRef.current = minTime;
    setCurrentTime(minTime);
    await ensureAudioContext();
    const firstBeat = selectedBeats[0];
    if (firstBeat) {
      triggeredBeatsRef.current.add(firstBeat.id);
      void triggerBeatAudio(firstBeat, 0);
    }
    setIsPlaying(true);
  };

  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const currentBeat =
    selectedBeats.find((b) => currentTime >= b.startSec && currentTime < b.endSec) ??
    selectedBeats[selectedBeats.length - 1];

  const elapsedDisplay = Math.max(0, currentTime - minTime);

  return (
    <div className="bg-white border border-[#E3E6E1] rounded-2xl overflow-hidden shadow-sm">
      <div className="relative bg-[#192127]">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full aspect-video block"
        />
      </div>

      <div className={compact ? 'p-4 space-y-3' : 'p-5 space-y-4'}>
        {/* Scrubber & Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-[#4F5D61]">
            <span className="font-medium text-[#1E292B]">
              {currentBeat ? `${currentBeat.label} · ${currentBeat.startSec}–${currentBeat.endSec}s` : 'Ready'}
            </span>
            <span className="font-mono-tabular text-sm">
              {elapsedDisplay.toFixed(1)}s / {totalDuration}s
            </span>
          </div>

          <input
            type="range"
            min={minTime}
            max={maxTime}
            step={0.1}
            value={currentTime}
            aria-label="Video timeline"
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2.5 bg-[#E3E6E1] rounded-lg appearance-none cursor-pointer accent-[#3B5B6D]"
          />

          {!activeBeatOnly && (
            <div className="grid grid-cols-4 gap-2 pt-1">
              {beats.map((b) => {
                const active = currentBeat?.id === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSeek(b.startSec)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-left transition-colors border cursor-pointer ${
                      active
                        ? 'bg-[#EEF3F0] border-[#3B5B6D] text-[#1E292B]'
                        : 'bg-[#F8F9F7] border-[#E3E6E1] text-[#556367] hover:bg-[#F0F2EF]'
                    }`}
                  >
                    <div className="text-xs font-mono-tabular text-[#556367]">
                      {b.startSec}–{b.endSec}s
                    </div>
                    <div className="text-sm font-semibold truncate">{b.label}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Big Mobile-Friendly Transport Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex-1 min-w-[160px] min-h-[52px] px-6 py-3 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isPlaying ? 'Pause' : activeBeatOnly ? 'Play Scene' : 'Play 30s Video'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            aria-label="Replay from start"
            className="min-h-[52px] min-w-[52px] px-4 py-3 rounded-xl bg-[#F3F5F2] hover:bg-[#E7EBE6] text-[#1E292B] font-medium text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
            className="min-h-[52px] min-w-[52px] px-4 py-3 rounded-xl bg-[#F3F5F2] hover:bg-[#E7EBE6] text-[#1E292B] font-medium text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
