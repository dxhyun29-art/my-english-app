import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit3,
  Loader2,
  RefreshCw,
  Wand2,
} from 'lucide-react';
import { BeatKey, MovieExpression, SceneConfig, StoryboardBeat } from '../types';
import {
  countStoryboardWords,
  formatTwoLineSubtitles,
  getExpressionCoverage,
  highlightExpressionsInText,
} from '../utils/expressions';

interface Step3StoryboardProps {
  expressions: MovieExpression[];
  scene: SceneConfig;
  beats: StoryboardBeat[];
  onChangeBeats: (next: StoryboardBeat[]) => void;
  onGenerateFullStoryboard: () => Promise<void>;
  onRegenerateOneBeat: (beatId: BeatKey) => Promise<void>;
  isGeneratingFull: boolean;
  regeneratingBeatId: BeatKey | null;
  errorMsg: string | null;
  onBack: () => void;
  onNext: () => void;
}

export const Step3Storyboard: React.FC<Step3StoryboardProps> = ({
  expressions,
  beats,
  onChangeBeats,
  onGenerateFullStoryboard,
  onRegenerateOneBeat,
  isGeneratingFull,
  regeneratingBeatId,
  errorMsg,
  onBack,
  onNext,
}) => {
  const [editingBeatId, setEditingBeatId] = useState<BeatKey | null>(null);

  const totalWords = countStoryboardWords(beats);
  const inWordRange = totalWords >= 60 && totalWords <= 70;
  const coverage = getExpressionCoverage(beats, expressions);
  const allIncluded = coverage.every((c) => c.included);

  const handleUpdateBeat = (beatId: BeatKey, patch: Partial<StoryboardBeat>) => {
    onChangeBeats(
      beats.map((b) => {
        if (b.id !== beatId) return b;
        const next = { ...b, ...patch };
        if (patch.englishLines !== undefined && patch.subtitles === undefined) {
          next.subtitles = formatTwoLineSubtitles(patch.englishLines);
        }
        return next;
      })
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
            30-Second Storyboard
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
            Review the 4 beats, check highlighted movie expressions, and edit or regenerate any
            beat before creating your video.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateFullStoryboard}
          disabled={isGeneratingFull || regeneratingBeatId !== null}
          className="min-h-[52px] px-6 py-3 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] disabled:opacity-60 text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          {isGeneratingFull ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Wand2 className="w-5 h-5" />
          )}
          <span>{isGeneratingFull ? 'Writing 4 Beats...' : 'Generate Script with AI'}</span>
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="bg-[#FDF2F2] border border-[#E5B8B8] rounded-2xl p-4 text-[#822B2B] flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-base">{errorMsg}</p>
        </div>
      )}

      {/* Script Metrics & Expression Coverage Bar */}
      <div className="bg-white border border-[#E3E6E1] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAECE8]">
          <div className="flex items-center gap-3">
            {inWordRange ? (
              <CheckCircle2 className="w-5 h-5 text-[#2E6F52] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#B45309] shrink-0" />
            )}
            <span className="text-base font-semibold text-[#1E292B]">
              Total Dialogue Length:{' '}
              <span className="font-mono-tabular">{totalWords} words</span>
            </span>
            <span className="text-sm text-[#556367]">(Target: 60–70 words)</span>
          </div>

          <div className="text-sm text-[#4F5D61]">
            {allIncluded
              ? 'All movie expressions included'
              : 'Some expressions need to be included'}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {coverage.map((item) => (
            <div key={item.expression} className="flex items-center gap-1.5">
              {item.included ? (
                <CheckCircle2 className="w-4 h-4 text-[#2E6F52] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0" />
              )}
              <span
                className={
                  item.included
                    ? 'font-medium text-[#1E292B] bg-[#DDE8E2] px-2 py-0.5 rounded-md'
                    : 'font-medium text-[#7D4A10]'
                }
              >
                {item.expression}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Beat Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {beats.map((beat) => {
          const isEditing = editingBeatId === beat.id;
          const isRegenerating = regeneratingBeatId === beat.id;
          const highlightedSegments = highlightExpressionsInText(beat.englishLines, expressions);

          return (
            <article
              key={beat.id}
              className="bg-white border border-[#E3E6E1] rounded-2xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Beat Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-mono-tabular text-[#4F5D61]">
                      {beat.startSec}–{beat.endSec}s · {beat.label}
                    </div>
                    <div className="text-xs text-[#617074]">
                      {beat.sourceMovies.length > 0
                        ? `Movie source: ${beat.sourceMovies.join(', ')}`
                        : 'Continuity beat'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBeatId(isEditing ? null : beat.id)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F3F5F2] hover:bg-[#E7EBE6] text-sm font-medium text-[#1E292B] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isEditing ? 'Done' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRegenerateOneBeat(beat.id)}
                      disabled={isGeneratingFull || regeneratingBeatId !== null}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F3F5F2] hover:bg-[#E7EBE6] disabled:opacity-50 text-sm font-medium text-[#1E292B] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isRegenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>{isRegenerating ? 'Writing...' : 'Regenerate'}</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#4F5D61]">
                        Scene Description
                      </label>
                      <textarea
                        rows={3}
                        value={beat.sceneDescription}
                        onChange={(e) =>
                          handleUpdateBeat(beat.id, { sceneDescription: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#4F5D61]">
                        English Lines
                      </label>
                      <textarea
                        rows={2}
                        value={beat.englishLines}
                        onChange={(e) =>
                          handleUpdateBeat(beat.id, { englishLines: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#4F5D61]">
                        Burned-in Subtitles (Line 1 / Line 2)
                      </label>
                      <input
                        type="text"
                        value={beat.subtitles[0] ?? ''}
                        onChange={(e) =>
                          handleUpdateBeat(beat.id, {
                            subtitles: [e.target.value, beat.subtitles[1] ?? ''].filter(
                              (_, i) => i === 0 || (beat.subtitles[1] ?? '').length > 0
                            ),
                          })
                        }
                        placeholder="Subtitle line 1"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B] mb-2"
                      />
                      <input
                        type="text"
                        value={beat.subtitles[1] ?? ''}
                        onChange={(e) =>
                          handleUpdateBeat(beat.id, {
                            subtitles: [beat.subtitles[0] ?? '', e.target.value].filter(Boolean),
                          })
                        }
                        placeholder="Subtitle line 2 (optional)"
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div>
                      <div className="text-xs font-semibold text-[#556367] mb-1">
                        Scene Description
                      </div>
                      <p className="text-base text-[#364448] leading-relaxed">
                        {beat.sceneDescription}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-[#556367] mb-1">
                        English Lines
                      </div>
                      <p className="text-lg font-medium text-[#1E292B] leading-relaxed">
                        {highlightedSegments.map((seg, i) =>
                          seg.highlighted ? (
                            <mark
                              key={i}
                              className="bg-[#DDE8E2] text-[#143025] font-bold px-1.5 py-0.5 rounded-md"
                            >
                              {seg.text}
                            </mark>
                          ) : (
                            <span key={i}>{seg.text}</span>
                          )
                        )}
                      </p>
                    </div>

                    <div className="bg-[#212B31] text-white rounded-xl px-4 py-3 text-center space-y-0.5">
                      <div className="text-[11px] text-[#B7C4C8] mb-1">
                        Subtitle Preview (Max 2 Lines)
                      </div>
                      {(beat.subtitles.length > 0
                        ? beat.subtitles.slice(0, 2)
                        : formatTwoLineSubtitles(beat.englishLines)
                      ).map((line, i) => (
                        <div key={i} className="text-sm sm:text-base font-bold leading-snug">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[52px] px-6 py-3 rounded-xl bg-white border border-[#D5DBD4] hover:bg-[#F1F4F0] text-[#1E292B] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Scene</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[54px] px-7 py-3.5 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
        >
          <span>Next: Preview Video Clips</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
