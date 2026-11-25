import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Film, Loader2, Mic, RefreshCw } from 'lucide-react';
import { STYLE_OPTIONS } from '../data/presets';
import { AnimationStyle, BeatClipAudio, BeatKey, SceneConfig, StoryboardBeat } from '../types';
import { FilmCanvasPlayer, FilmStyleThumbnail } from './FilmCanvasPlayer';

interface Step4VideoProps {
  beats: StoryboardBeat[];
  scene: SceneConfig;
  audioMap: Partial<Record<BeatKey, BeatClipAudio>>;
  onChangeStyle: (style: AnimationStyle) => void;
  onGenerateAllAudio: () => Promise<void>;
  onGenerateSingleBeatAudio: (beat: StoryboardBeat) => Promise<void>;
  generatingBeatId: BeatKey | null;
  isGeneratingAllAudio: boolean;
  audioNotice: string | null;
}

export const Step4Video: React.FC<Step4VideoProps> = ({
  beats,
  scene,
  audioMap,
  onChangeStyle,
  onGenerateAllAudio,
  onGenerateSingleBeatAudio,
  generatingBeatId,
  isGeneratingAllAudio,
  audioNotice,
}) => {
  const [previewMode, setPreviewMode] = useState<'full' | BeatKey>('full');
  const readyAudioCount = beats.filter((b) => Boolean(audioMap[b.id]?.audioBase64)).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
            Animated Scene Clips & English Voice
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
            Preview each scene clip individually or play all 4 scenes in order as one 30-second
            animated video with English voiceover and synchronized subtitles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onGenerateAllAudio}
            disabled={isGeneratingAllAudio || generatingBeatId !== null}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isGeneratingAllAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span>
              {isGeneratingAllAudio
                ? 'Generating Voice...'
                : readyAudioCount === beats.length
                ? 'Regenerate English Voice'
                : 'Generate English Voice'}
            </span>
          </button>

          {/* Visual Style Switcher */}
          <div
            role="group"
            aria-label="Animation style"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#EAECE8] rounded-xl"
          >
            {STYLE_OPTIONS.map((opt) => {
              const active = scene.style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeStyle(opt.id)}
                  className={`min-h-[38px] px-3 py-1 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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
      </div>

      {audioNotice && (
        <div
          role="status"
          className="bg-[#FFF8EB] border border-[#E7C684] rounded-2xl p-4 text-sm text-[#6D4813] flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#B45309]" />
          <p>{audioNotice}</p>
        </div>
      )}

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
            audioMap={audioMap}
            activeBeatOnly={previewMode === 'full' ? null : previewMode}
            authorName="Dahyun"
            showCreditAtEnd={true}
          />
        </div>

        {/* 4 Individual Scene Clip Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-[#4F5D61]">
            <span className="font-semibold text-[#1E292B]">Individual Scene Clips</span>
            <span className="font-mono-tabular">
              {readyAudioCount > 0 ? `${readyAudioCount} / 4 Gemini voices` : 'Browser English voice'}
            </span>
          </div>

          <div className="space-y-3">
            {beats.map((beat) => {
              const isSelected = previewMode === beat.id;
              const clip = audioMap[beat.id];
              const isBusy = generatingBeatId === beat.id;

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

                        {clip ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E6F52]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Gemini voice</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-[#4F5D61]">
                            {isBusy ? 'Generating...' : 'Auto voice'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-[#4F5D61] line-clamp-2">{beat.englishLines}</p>

                      <div className="flex flex-wrap gap-2 pt-1">
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

                        <button
                          type="button"
                          onClick={() => onGenerateSingleBeatAudio(beat)}
                          disabled={isBusy || isGeneratingAllAudio}
                          className="min-h-[38px] px-3 py-1 rounded-lg bg-[#EFF2EE] hover:bg-[#E2E7E0] disabled:opacity-50 text-xs font-medium text-[#1E292B] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span>{clip ? 'Regenerate' : 'Gemini Voice'}</span>
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
