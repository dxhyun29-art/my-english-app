import { useState } from 'react';
import {
  DEFAULT_EXPRESSIONS,
  DEFAULT_SCENE_CONFIG,
  DEFAULT_STORYBOARD,
} from './data/presets';
import {
  AppStep,
  BeatKey,
  MovieExpression,
  SceneConfig,
  StoryboardBeat,
} from './types';
import { validateExpressions } from './utils/expressions';
import { Step1Expressions } from './components/Step1Expressions';
import { Step2Scene } from './components/Step2Scene';
import { Step3Storyboard } from './components/Step3Storyboard';
import { Step4Video } from './components/Step4Video';
import { Step5Final } from './components/Step5Final';

const STEPS: { id: AppStep; num: string; label: string }[] = [
  { id: 'input', num: '1', label: 'Expressions' },
  { id: 'scene', num: '2', label: 'Scene' },
  { id: 'storyboard', num: '3', label: 'Storyboard' },
  { id: 'video', num: '4', label: 'Video' },
  { id: 'final', num: '5', label: 'Final' },
];

export default function App() {
  const [step, setStep] = useState<AppStep>('input');
  const [expressions, setExpressions] = useState<MovieExpression[]>(DEFAULT_EXPRESSIONS);
  const [scene, setScene] = useState<SceneConfig>(DEFAULT_SCENE_CONFIG);
  const [beats, setBeats] = useState<StoryboardBeat[]>(DEFAULT_STORYBOARD);
  const [authorName, setAuthorName] = useState<string>('Dahyun');

  const [isGeneratingFull, setIsGeneratingFull] = useState(false);
  const [regeneratingBeatId, setRegeneratingBeatId] = useState<BeatKey | null>(null);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);

  const validation = validateExpressions(expressions);

  const goToStep = (target: AppStep) => {
    if (target !== 'input' && !validation.isValid) {
      setStep('input');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetSample = () => {
    setExpressions(DEFAULT_EXPRESSIONS);
    setScene(DEFAULT_SCENE_CONFIG);
    setBeats(DEFAULT_STORYBOARD);
    setStoryboardError(null);
  };

  const handleGenerateFullStoryboard = async () => {
    setStoryboardError(null);
    setIsGeneratingFull(true);
    try {
      const response = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expressions: expressions.filter((e) => e.expression.trim().length > 0),
          scene: {
            place: scene.place,
            characters: scene.characters,
            situation: scene.situation,
            style: scene.style,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate storyboard.');
      }
      setBeats(data.beats);
    } catch (err) {
      setStoryboardError(
        err instanceof Error ? err.message : 'Unable to generate storyboard.'
      );
    } finally {
      setIsGeneratingFull(false);
    }
  };

  const handleRegenerateOneBeat = async (beatId: BeatKey) => {
    setStoryboardError(null);
    setRegeneratingBeatId(beatId);
    try {
      const response = await fetch('/api/regenerate-beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beatId,
          allBeats: beats,
          expressions: expressions.filter((e) => e.expression.trim().length > 0),
          scene: {
            place: scene.place,
            characters: scene.characters,
            situation: scene.situation,
            style: scene.style,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate beat.');
      }
      setBeats((prev) => prev.map((b) => (b.id === beatId ? data.beat : b)));
    } catch (err) {
      setStoryboardError(
        err instanceof Error ? err.message : 'Unable to regenerate beat.'
      );
    } finally {
      setRegeneratingBeatId(null);
    }
  };

  const currentIdx = STEPS.findIndex((s) => s.id === step);
  const nextStepObj = currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F5] text-[#1E292B]">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3E6E1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => goToStep('input')}
            className="text-base sm:text-lg font-bold tracking-tight text-[#1E292B] whitespace-nowrap shrink-0 cursor-pointer"
          >
            The Night Before The Exam
          </button>

          <nav
            aria-label="Film creation steps"
            className="hidden md:flex items-center gap-5 text-sm font-medium text-[#556367]"
          >
            {STEPS.map((s) => {
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                    active
                      ? 'text-[#1E292B] border-[#3B5B6D] font-semibold'
                      : 'border-transparent hover:text-[#1E292B]'
                  }`}
                >
                  {s.num}. {s.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            {nextStepObj ? (
              <button
                type="button"
                onClick={() => goToStep(nextStepObj.id)}
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#3B5B6D] hover:bg-[#304B5A] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Next: {nextStepObj.label}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep('input')}
                className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#EFF2EE] hover:bg-[#E2E7E0] text-[#1E292B] text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                Edit Script
              </button>
            )}
          </div>
        </div>

        {/* Compact mobile step selector */}
        <div className="md:hidden border-t border-[#EEF0EC] px-3 py-1.5 flex items-center justify-between gap-1 overflow-x-auto">
          {STEPS.map((s) => {
            const active = s.id === step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(s.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#3B5B6D] text-white font-semibold'
                    : 'text-[#556367] hover:bg-[#EFF2EE]'
                }`}
              >
                {s.num}. {s.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-9">
        {step === 'input' && (
          <Step1Expressions
            expressions={expressions}
            onChange={setExpressions}
            onResetSample={handleResetSample}
            onNext={() => goToStep('scene')}
          />
        )}

        {step === 'scene' && (
          <Step2Scene
            scene={scene}
            onChange={setScene}
            onBack={() => goToStep('input')}
            onNext={() => goToStep('storyboard')}
          />
        )}

        {step === 'storyboard' && (
          <Step3Storyboard
            expressions={expressions}
            scene={scene}
            beats={beats}
            onChangeBeats={setBeats}
            onGenerateFullStoryboard={handleGenerateFullStoryboard}
            onRegenerateOneBeat={handleRegenerateOneBeat}
            isGeneratingFull={isGeneratingFull}
            regeneratingBeatId={regeneratingBeatId}
            errorMsg={storyboardError}
            onBack={() => goToStep('scene')}
            onNext={() => goToStep('video')}
          />
        )}

        {step === 'video' && (
          <Step4Video
            beats={beats}
            scene={scene}
            onBack={() => goToStep('storyboard')}
            onNext={() => goToStep('final')}
          />
        )}

        {step === 'final' && (
          <Step5Final
            expressions={expressions}
            beats={beats}
            scene={scene}
            authorName={authorName}
            onChangeAuthorName={setAuthorName}
            onBack={() => goToStep('video')}
            onStartOver={() => {
              handleResetSample();
              goToStep('input');
            }}
          />
        )}
      </main>

      <footer className="border-t border-[#E3E6E1] bg-white/60 py-5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[#556367]">
          <span>The Night Before The Exam · English Learning Short Film Studio</span>
          <span>Made with Google AI Studio · Script by [{authorName.trim() || 'Dahyun'}]</span>
        </div>
      </footer>
    </div>
  );
}
