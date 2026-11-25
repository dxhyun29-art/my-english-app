import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { renderFilmFrame } from '../engine/filmRenderer';
import { AnimationStyle, BeatKey, CharacterLook, StoryboardBeat } from '../types';

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
  activeBeatOnly?: BeatKey | null;
  authorName?: string;
  showCreditAtEnd?: boolean;
  compact?: boolean;
}

export const FilmCanvasPlayer: React.FC<FilmCanvasPlayerProps> = ({
  beats,
  style,
  look,
  activeBeatOnly = null,
  authorName = 'Dahyun',
  showCreditAtEnd = true,
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Reset timeline if activeBeatOnly changes
  useEffect(() => {
    setIsPlaying(false);
    currentTimeRef.current = minTime;
    setCurrentTime(minTime);
  }, [activeBeatOnly, minTime]);

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
      authorName,
      showEndCredit,
    });
  }, [currentTime, selectedBeats, beats, style, look, activeBeatOnly, maxTime, authorName, showCreditAtEnd]);

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
        return;
      }

      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, maxTime]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentTimeRef.current >= maxTime - 0.1) {
      currentTimeRef.current = minTime;
      setCurrentTime(minTime);
    }
    setIsPlaying(true);
  };

  const handleSeek = (targetTime: number) => {
    const clamped = Math.max(minTime, Math.min(maxTime, targetTime));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
  };

  const handleRestart = () => {
    currentTimeRef.current = minTime;
    setCurrentTime(minTime);
    setIsPlaying(true);
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
        </div>
      </div>
    </div>
  );
};
