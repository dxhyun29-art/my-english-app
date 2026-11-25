import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { MovieExpression, SceneConfig, StoryboardBeat } from '../types';
import { exportFullFilmVideo } from '../utils/videoExport';
import { FilmCanvasPlayer } from './FilmCanvasPlayer';

interface Step5FinalProps {
  expressions: MovieExpression[];
  beats: StoryboardBeat[];
  scene: SceneConfig;
  authorName: string;
  onChangeAuthorName: (name: string) => void;
  onBack: () => void;
  onStartOver: () => void;
}

function formatSrtTime(sec: number): string {
  const whole = Math.floor(sec);
  const ms = Math.round((sec - whole) * 1000);
  const s = String(whole % 60).padStart(2, '0');
  const m = String(Math.floor(whole / 60)).padStart(2, '0');
  return `00:${m}:${s},${String(ms).padStart(3, '0')}`;
}

export const Step5Final: React.FC<Step5FinalProps> = ({
  expressions,
  beats,
  scene,
  authorName,
  onChangeAuthorName,
  onBack,
  onStartOver,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportPercent, setExportPercent] = useState(0);
  const [exportLabel, setExportLabel] = useState('');
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleDownloadVideo = async () => {
    setExportError(null);
    setIsExporting(true);
    setExportPercent(0);
    setExportLabel('Preparing 30-second video...');

    try {
      const blob = await exportFullFilmVideo({
        beats,
        style: scene.style,
        look: scene.look,
        authorName,
        onProgress: (pct, lbl) => {
          setExportPercent(pct);
          setExportLabel(lbl);
        },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'the-night-before-the-exam.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Unable to export video in this browser.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSrt = () => {
    const srtContent = beats
      .map((b, idx) => {
        const lines = b.subtitles.length > 0 ? b.subtitles.slice(0, 2).join('\n') : b.englishLines;
        return `${idx + 1}\n${formatSrtTime(b.startSec + 0.2)} --> ${formatSrtTime(
          b.endSec - 0.1
        )}\n${lines}\n`;
      })
      .join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'the-night-before-the-exam.srt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const handleCopyStudySheet = async () => {
    const text = [
      'The Night Before The Exam — Study Sheet',
      '',
      'Movie Expressions:',
      ...expressions.map(
        (e, i) => `${i + 1}. ${e.expression} — ${e.koreanMeaning} (${e.movie})`
      ),
      '',
      '30-Second Film Script:',
      ...beats.map((b) => `[${b.startSec}–${b.endSec}s · ${b.label}] ${b.englishLines}`),
      '',
      `Made with Google AI Studio · Script by ${authorName.trim() || 'Dahyun'}`,
    ].join('\n');

    await navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2200);
  };

  return (
    <section className="space-y-6">
      <div className="space-y-2 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
          Your 30-Second Short Film Is Ready
        </h1>
        <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
          Watch the complete animated video with burned-in English subtitles, or download the video
          and study notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <FilmCanvasPlayer
            beats={beats}
            style={scene.style}
            look={scene.look}
            authorName={authorName}
            showCreditAtEnd={true}
          />

          {/* Credit Display */}
          <div className="bg-white border border-[#E3E6E1] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-base font-semibold text-[#1E292B]">
              Made with Google AI Studio · Script by [{authorName.trim() || 'Dahyun'}]
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="author-credit" className="text-sm text-[#4F5D61]">
                Script by:
              </label>
              <input
                id="author-credit"
                type="text"
                value={authorName}
                onChange={(e) => onChangeAuthorName(e.target.value)}
                placeholder="Dahyun"
                className="w-36 min-h-[42px] px-3 py-1.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-sm font-medium text-[#1E292B]"
              />
            </div>
          </div>
        </div>

        {/* Download & Study Review Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E3E6E1] rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-[#1E292B]">Download & Export</h2>

            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={isExporting}
              className="w-full min-h-[54px] px-5 py-3.5 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] disabled:opacity-70 text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>{isExporting ? `Exporting (${exportPercent}%)` : 'Download 30s Video'}</span>
            </button>

            {isExporting && (
              <div className="space-y-1.5">
                <div className="w-full h-2.5 bg-[#E6EAE5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B5B6D] transition-all duration-200"
                    style={{ width: `${exportPercent}%` }}
                  />
                </div>
                <p className="text-xs text-[#4F5D61] font-mono-tabular">{exportLabel}</p>
              </div>
            )}

            {exportError && (
              <p className="text-sm text-[#9F3A3A] bg-[#FDF2F2] border border-[#E5B8B8] rounded-xl p-3">
                {exportError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadSrt}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F3F5F2] hover:bg-[#E7EBE6] text-[#1E292B] font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Subtitles (.srt)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyStudySheet}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F3F5F2] hover:bg-[#E7EBE6] text-[#1E292B] font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedScript ? <Check className="w-4 h-4 text-[#2E6F52]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? 'Copied Study Sheet' : 'Copy Study Script'}</span>
              </button>
            </div>
          </div>

          {/* Learned Expressions Quick Review */}
          <div className="bg-white border border-[#E3E6E1] rounded-2xl p-5 space-y-3">
            <h2 className="text-base font-bold text-[#1E292B]">Expressions in This Film</h2>
            <ul className="divide-y divide-[#EEF0EC]">
              {expressions
                .filter((e) => e.expression.trim().length > 0)
                .map((e) => (
                  <li key={e.id} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                    <div className="text-sm font-semibold text-[#1E292B]">{e.expression}</div>
                    <div className="text-xs text-[#4F5D61]">
                      {e.koreanMeaning} · {e.movie}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[52px] px-6 py-3 rounded-xl bg-white border border-[#D5DBD4] hover:bg-[#F1F4F0] text-[#1E292B] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Video Clips</span>
        </button>

        <button
          type="button"
          onClick={onStartOver}
          className="min-h-[52px] px-6 py-3 rounded-xl bg-[#EFF2EE] hover:bg-[#E2E7E0] text-[#1E292B] font-semibold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Film</span>
        </button>
      </div>
    </section>
  );
};
