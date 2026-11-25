export type AnimationStyle = '2d' | 'clay' | 'watercolor' | 'live-action';

export type BeatKey = 'hook' | 'problem' | 'turn' | 'close';

export type VoiceName = 'Kore' | 'Zephyr' | 'Puck' | 'Charon';

export interface MovieExpression {
  id: string;
  expression: string;
  koreanMeaning: string;
  movie: string;
}

export interface CharacterLook {
  outfitColor: string;
  outfitLabel: string;
  hairStyle: 'bob' | 'short' | 'ponytail';
  glasses: boolean;
  deskTone: 'warm-oak' | 'pale-birch' | 'walnut';
}

export interface SceneConfig {
  place: string;
  characters: string;
  situation: string;
  style: AnimationStyle;
  voiceName: VoiceName;
  look: CharacterLook;
}

export interface StoryboardBeat {
  id: BeatKey;
  label: string;
  startSec: number;
  endSec: number;
  sceneDescription: string;
  englishLines: string;
  subtitles: string[];
  usedExpressions: string[];
  sourceMovies: string[];
  mood: 'anxious' | 'overwhelmed' | 'focused' | 'relieved';
}

export interface BeatClipAudio {
  beatId: BeatKey;
  audioBase64: string;
  mimeType: string;
  durationSec: number;
  spokenText: string;
}
