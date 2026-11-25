import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { DEFAULT_SCENE_CONFIG, DEFAULT_STORYBOARD } from './data/presets';
import { AnimationStyle, BeatClipAudio, BeatKey, SceneConfig, StoryboardBeat } from './types';
import { getWavDurationSec } from './utils/audio';
import { exportFullFilmVideo } from './utils/videoExport';
import { Step4Video } from './components/Step4Video';

export default function App() {
  const [scene, setScene] = useState<SceneConfig>(DEFAULT_SCENE_CONFIG);
  const [audioMap, setAudioMap] = useState<Partial<Record<BeatKey, BeatClipAudio>>>({});
  const [isGeneratingAllAudio, setIsGeneratingAllAudio] = useState(false);
  const [generatingAudioBeatId, setGeneratingAudioBeatId] = useState<BeatKey | null>(null);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportPercent, setExportPercent] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const generateBeatTts = async (beat: StoryboardBeat): Promise<BeatClipAudio> => {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: beat.englishLines,
        voiceName: scene.voiceName,
        mood: beat.mood,
      }),
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { error: `Voice API returned status ${response.status}.` };

    if (!response.ok || !data.audioBase64) {
      throw new Error(data.error || `Failed to generate voiceover for ${beat.label}.`);
    }
    return {
      beatId: beat.id,
      audioBase64: data.audioBase64,
      mimeType: data.mimeType || 'audio/wav',
      durationSec: getWavDurationSec(data.audioBase64),
      spokenText: beat.englishLines,
    };
  };

  const handleGenerateSingleBeatAudio = async (beat: StoryboardBeat) => {
    setAudioNotice(null);
    setGeneratingAudioBeatId(beat.id);
    try {
      const clip = await generateBeatTts(beat);
      setAudioMap((prev) => ({ ...prev, [beat.id]: clip }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice generation unavailable.';
      setAudioNotice(
        `${msg} Browser English voice will play automatically during video playback.`
      );
    } finally {
      setGeneratingAudioBeatId(null);
    }
  };

  const handleGenerateAllAudio = async () => {
    setAudioNotice(null);
    setIsGeneratingAllAudio(true);
    try {
      for (const beat of DEFAULT_STORYBOARD) {
        setGeneratingAudioBeatId(beat.id);
        const clip = await generateBeatTts(beat);
        setAudioMap((prev) => ({ ...prev, [beat.id]: clip }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Voice generation unavailable.';
      setAudioNotice(
        `${msg} Browser English voice will play automatically during video playback.`
      );
    } finally {
      setGeneratingAudioBeatId(null);
      setIsGeneratingAllAudio(false);
    }
  };

  // Automatically fetch Gemini TTS voiceover on initial load
  useEffect(() => {
    void handleGenerateAllAudio();
  }, []);

  const handleStyleChange = (style: AnimationStyle) => {
    setScene((prev) => ({ ...prev, style }));
  };

  const handleDownloadVideo = async () => {
    setExportError(null);
    setIsExporting(true);
    setExportPercent(0);
    try {
      const blob = await exportFullFilmVideo({
        beats: DEFAULT_STORYBOARD,
        style: scene.style,
        look: scene.look,
        audioMap,
        authorName: 'Dahyun',
        onProgress: (pct) => setExportPercent(pct),
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F5] text-[#1E292B]">
      {/* Clean single-page header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3E6E1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 sm:gap-8">
          <span className="text-base sm:text-lg font-bold tracking-tight text-[#1E292B] whitespace-nowrap shrink-0">
            The Night Before The Exam
          </span>

          <button
            type="button"
            onClick={handleDownloadVideo}
            disabled={isExporting}
            className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#3B5B6D] hover:bg-[#304B5A] disabled:opacity-70 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {isExporting ? `Exporting (${exportPercent}%)` : 'Download 30s Video'}
            </span>
          </button>
        </div>
      </header>

      {/* Single Video Page */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-9 space-y-4">
        {exportError && (
          <div
            role="alert"
            className="bg-[#FDF2F2] border border-[#E5B8B8] rounded-2xl p-4 text-sm text-[#822B2B]"
          >
            {exportError}
          </div>
        )}

        <Step4Video
          beats={DEFAULT_STORYBOARD}
          scene={scene}
          audioMap={audioMap}
          onChangeStyle={handleStyleChange}
          onGenerateAllAudio={handleGenerateAllAudio}
          onGenerateSingleBeatAudio={handleGenerateSingleBeatAudio}
          generatingBeatId={generatingAudioBeatId}
          isGeneratingAllAudio={isGeneratingAllAudio}
          audioNotice={audioNotice}
        />
      </main>

      <footer className="border-t border-[#E3E6E1] bg-white/60 py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[#556367]">
          <span>The Night Before The Exam · 30-Second Animated Clip</span>
          <span>Made with Google AI Studio · Script by [Dahyun]</span>
        </div>
      </footer>
    </div>
  );
}
