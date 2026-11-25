import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { DEFAULT_STORYBOARD, OUTFIT_COLORS, STYLE_OPTIONS } from '../data/presets';
import { AnimationStyle, SceneConfig } from '../types';
import { FilmStyleThumbnail } from './FilmCanvasPlayer';

interface Step2SceneProps {
  scene: SceneConfig;
  onChange: (next: SceneConfig) => void;
  onBack: () => void;
  onNext: () => void;
}

const SCENE_PRESETS = [
  {
    label: 'Dorm Desk Midnight',
    place: 'Cozy university dorm desk beside a large window from midnight to sunrise',
    characters: 'A tired Korean college student in a soft knit hoodie',
    situation: 'Final exam is tomorrow morning and five textbook chapters are still unread',
  },
  {
    label: 'Library Study Room',
    place: 'Quiet university library window desk with warm study lamps',
    characters: 'A focused Korean university student with neat glasses and a warm cardigan',
    situation: 'Major exam is tomorrow and only one night remains to finish five chapters',
  },
];

export const Step2Scene: React.FC<Step2SceneProps> = ({
  scene,
  onChange,
  onBack,
  onNext,
}) => {
  const previewBeat = DEFAULT_STORYBOARD[0];

  const updateLook = (partial: Partial<SceneConfig['look']>) => {
    onChange({
      ...scene,
      look: { ...scene.look, ...partial },
    });
  };

  return (
    <section className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1E292B]">
            Set Your Scene & Visual Style
          </h1>
          <p className="text-base sm:text-lg text-[#4F5D61] leading-relaxed">
            Customize the place, character outfit, and visual style. The same character, outfit, and
            room colors stay locked across all 4 beats.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SCENE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() =>
                onChange({
                  ...scene,
                  place: preset.place,
                  characters: preset.characters,
                  situation: preset.situation,
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EFF2EE] hover:bg-[#E2E7E0] text-sm font-medium text-[#2E3C40] transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-column responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Place, Characters, Situation + Character Consistency */}
        <div className="lg:col-span-6 space-y-5 bg-white border border-[#E3E6E1] rounded-2xl p-5 sm:p-6">
          <div className="space-y-1.5">
            <label htmlFor="scene-place" className="block text-sm font-semibold text-[#2E3C40]">
              Place
            </label>
            <input
              id="scene-place"
              type="text"
              value={scene.place}
              onChange={(e) => onChange({ ...scene, place: e.target.value })}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="scene-characters" className="block text-sm font-semibold text-[#2E3C40]">
              Characters
            </label>
            <input
              id="scene-characters"
              type="text"
              value={scene.characters}
              onChange={(e) => onChange({ ...scene, characters: e.target.value })}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="scene-situation" className="block text-sm font-semibold text-[#2E3C40]">
              Situation
            </label>
            <textarea
              id="scene-situation"
              rows={2}
              value={scene.situation}
              onChange={(e) => onChange({ ...scene, situation: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#F8F9F7] border border-[#D7DDD6] focus:border-[#3B5B6D] focus:bg-white focus:outline-none text-base text-[#1E292B] resize-none"
            />
          </div>

          {/* Character Outfit & Visual Continuity Controls */}
          <div className="pt-2 border-t border-[#EAECE8] space-y-4">
            <h2 className="text-base font-semibold text-[#1E292B]">
              Character Consistency Lock
            </h2>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-[#4F5D61]">
                Outfit Color · {scene.look.outfitLabel}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {OUTFIT_COLORS.map((opt) => {
                  const selected = scene.look.outfitColor === opt.color;
                  return (
                    <button
                      key={opt.color}
                      type="button"
                      onClick={() =>
                        updateLook({ outfitColor: opt.color, outfitLabel: opt.label })
                      }
                      className={`min-h-[46px] px-3 py-2 rounded-xl border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#3B5B6D] bg-[#EEF3F0] font-semibold text-[#1E292B]'
                          : 'border-[#DCE1DA] bg-[#F8F9F7] text-[#4F5D61] hover:bg-[#F0F2EF]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-md shrink-0 border border-black/15"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="text-xs truncate">{opt.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="block text-sm font-medium text-[#4F5D61]">Hair Style</span>
                <div className="flex gap-2">
                  {(['bob', 'short', 'ponytail'] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateLook({ hairStyle: h })}
                      className={`flex-1 min-h-[44px] px-3 rounded-xl border text-sm capitalize transition-colors cursor-pointer ${
                        scene.look.hairStyle === h
                          ? 'border-[#3B5B6D] bg-[#EEF3F0] font-semibold text-[#1E292B]'
                          : 'border-[#DCE1DA] bg-[#F8F9F7] text-[#4F5D61]'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-sm font-medium text-[#4F5D61]">Eyewear</span>
                <button
                  type="button"
                  onClick={() => updateLook({ glasses: !scene.look.glasses })}
                  className={`w-full min-h-[44px] px-4 rounded-xl border text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    scene.look.glasses
                      ? 'border-[#3B5B6D] bg-[#EEF3F0] text-[#1E292B]'
                      : 'border-[#DCE1DA] bg-[#F8F9F7] text-[#4F5D61]'
                  }`}
                >
                  <span>Round Study Glasses</span>
                  <span>{scene.look.glasses ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 4 Visual Style Cards with Live Previews */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E292B]">Choose Animation Style</h2>
            <span className="text-sm text-[#556367]">Live preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STYLE_OPTIONS.map((opt) => {
              const selected = scene.style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...scene, style: opt.id as AnimationStyle })}
                  className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer ${
                    selected
                      ? 'bg-white border-[#3B5B6D] ring-2 ring-[#3B5B6D]/20 shadow-sm'
                      : 'bg-white border-[#E3E6E1] hover:border-[#B6C2BF]'
                  }`}
                >
                  <div className="relative">
                    <FilmStyleThumbnail
                      beat={previewBeat}
                      style={opt.id}
                      look={scene.look}
                    />
                    {selected && (
                      <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-[#3B5B6D] text-white flex items-center justify-center shadow">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="pt-3 px-1 space-y-1">
                    <div className="text-base font-bold text-[#1E292B]">{opt.title}</div>
                    <div className="text-sm text-[#4F5D61]">{opt.subtitle}</div>
                  </div>
                </button>
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
          <span>Back to Expressions</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="min-h-[54px] px-7 py-3.5 rounded-xl bg-[#3B5B6D] hover:bg-[#304B5A] text-white font-semibold text-base flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
        >
          <span>Next: Storyboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
