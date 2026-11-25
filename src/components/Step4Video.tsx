import React, { useState } from 'react';
import { CheckCircle2, Film } from 'lucide-react';
import { STYLE_OPTIONS } from '../data/presets';
import { AnimationStyle, BeatKey, SceneConfig, StoryboardBeat } from '../types';
import { FilmCanvasPlayer, FilmStyleThumbnail } from './FilmCanvasPlayer';

interface Step4VideoProps {
  beats: StoryboardBeat[];
  scene: SceneConfig;
  onChangeStyle: (style: AnimationStyle) => void;
}

export const Step4Video: React.FC<Step4VideoProps> = ({
  beats,
  scene,
  onChangeStyle,
}) => {
  const [previewMode, setPreviewMode] = useState<'full' | BeatKey>('full');

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
            Animated Scene Clips & Subtitles
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
            Preview each scene clip individually or play all 4 scenes in order as one 30-second
            animated video with synchronized English subtitles.
          </p>
        </div>

        {/* Visual Style Switcher */}
        <div
          role="group"
          aria-label="Animation style"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EAECE8] rounded-xl shrink-0"
        >
          {STYLE_OPTIONS.map((opt) => {
            const active = scene.style === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeStyle(opt.id)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-[#1E292B] shadow-sm font-semibold'
                    : 'text-[#4F5D61] hover:text-[#1E292B]'
                }`}
              >
                {opt.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Layout: Player + 4 Scene Clips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1E292B]">
              <Film className="w-4 h-4 text-[#3B5B6D]" />
              <span>
                {previewMode === 'full'
                  ? 'Full 30-Second Sequence (Scenes 1–4)'
                  : `Single Scene Clip · ${beats.find((b) => b.id === previewMode)?.label ?? ''}`}
              </span>
            </div>

            {previewMode !== 'full' && (
              <button
                type="button"
                onClick={() => setPreviewMode('full')}
                className="min-h-[38px] px-3 py-1 rounded-lg bg-[#EFF2EE] hover:bg-[#E2E7E0] text-sm font-medium text-[#1E292B] cursor-pointer"
              >
                Switch to Full 30s
              </button>
            )}
          </div>

          <FilmCanvasPlayer
            beats={beats}
            style={scene.style}
            look={scene.look}
            activeBeatOnly={previewMode === 'full' ? null : previewMode}
            authorName="Dahyun"
            showCreditAtEnd={true}
          />
        </div>

        {/* 4 Individual Scene Clip Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-[#4F5D61]">
            <span className="font-semibold text-[#1E292B]">Individual Scene Clips</span>
            <span className="font-mono-tabular">4 scenes · 30s total</span>
          </div>

          <div className="space-y-3">
            {beats.map((beat) => {
              const isSelected = previewMode === beat.id;

              return (
                <div
                  key={beat.id}
                  className={`bg-white rounded-2xl p-3.5 border transition-colors ${
                    isSelected ? 'border-[#3B5B6D] bg-[#F7FAF8]' : 'border-[#E3E6E1]'
                  }`}
                >
                  <div className="flex gap-3.5 items-center">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(beat.id)}
                      className="w-28 sm:w-32 shrink-0 cursor-pointer rounded-xl overflow-hidden border border-[#DCE1DA]"
                    >
                      <FilmStyleThumbnail
                        beat={beat}
                        style={scene.style}
                        look={scene.look}
                        timeOffset={3.2}
                      />
                    </button>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1E292B]">
                          {beat.label}{' '}
                          <span className="font-mono-tabular font-normal text-[#556367]">
                            ({beat.startSec}–{beat.endSec}s)
                          </span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E6F52]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Clip ready</span>
                        </span>
                      </div>

                      <p className="text-sm text-[#4F5D61] line-clamp-2">{beat.englishLines}</p>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewMode(beat.id)}
                          className={`min-h-[38px] px-3.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#3B5B6D] text-white'
                              : 'bg-[#EFF2EE] hover:bg-[#E2E7E0] text-[#1E292B]'
                          }`}
                        >
                          {isSelected ? 'Previewing Scene' : 'Preview Scene'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
