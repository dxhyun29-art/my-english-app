import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Film,
} from 'lucide-react';
import { BeatKey, SceneConfig, StoryboardBeat } from '../types';
import { FilmCanvasPlayer, FilmStyleThumbnail } from './FilmCanvasPlayer';

interface Step4VideoProps {
  beats: StoryboardBeat[];
  scene: SceneConfig;
  onBack: () => void;
  onNext: () => void;
}

export const Step4Video: React.FC<Step4VideoProps> = ({
  beats,
  scene,
  onBack,
  onNext,
}) => {
  const [previewMode, setPreviewMode] = useState<'full' | BeatKey>('full');

  return (
    <section className="space-y-6">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
          Animated Scene Clips & Subtitles
        </h1>
        <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
          Preview each scene clip individually or play all 4 scenes in order as one 30-second
          animated video with synchronized English subtitles.
        </p>
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
            showCreditAtEnd={false}
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

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[52px] px-6 py-3 rounded-xl bg-white border border-[#D5DBD4] hover:bg-[#F1F4F0] text-[#1E292B] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Storyboard</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[54px] px-7 py-3.5 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
        >
          <span>Next: Play & Download Final Video</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
