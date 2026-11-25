export type AnimationStyle = '2d' | 'clay' | 'watercolor' | 'live-action';

export type BeatKey = 'hook' | 'problem' | 'turn' | 'close';

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

export type AppStep = 'input' | 'scene' | 'storyboard' | 'video' | 'final';
