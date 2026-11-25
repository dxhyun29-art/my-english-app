import { AnimationStyle, MovieExpression, SceneConfig, StoryboardBeat } from '../types';

export const DEFAULT_EXPRESSIONS: MovieExpression[] = [
  {
    id: 'exp-1',
    expression: 'was / were going to + verb',
    koreanMeaning: '~하려고 했었다 (하지만 못 했다)',
    movie: 'Notting Hill',
  },
  {
    id: 'exp-2',
    expression: 'feel so suffocated',
    koreanMeaning: '숨이 턱 막히고 답답하다',
    movie: 'Minari',
  },
  {
    id: 'exp-3',
    expression: 'keep it together',
    koreanMeaning: '침착함을 유지하다, 정신을 차리다',
    movie: 'Inside Out 2',
  },
  {
    id: 'exp-4',
    expression: 'Seeing that made me want to level up.',
    koreanMeaning: '그걸 보니 나도 한 단계 성장하고 싶어졌어.',
    movie: 'Inside Out 2',
  },
  {
    id: 'exp-5',
    expression: "I can't stop smiling.",
    koreanMeaning: '미소가 멈추지 않아.',
    movie: 'Inside Out 2',
  },
];

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  place: 'Cozy university dorm desk beside a large window from midnight to sunrise',
  characters: 'A tired Korean college student in a soft knit hoodie',
  situation: 'Final exam is tomorrow morning and five textbook chapters are still unread',
  style: '2d',
  voiceName: 'Kore',
  look: {
    outfitColor: '#4A6B82',
    outfitLabel: 'Slate Blue Hoodie',
    hairStyle: 'bob',
    glasses: true,
    deskTone: 'warm-oak',
  },
};

export const DEFAULT_STORYBOARD: StoryboardBeat[] = [
  {
    id: 'hook',
    label: 'Hook',
    startSec: 0,
    endSec: 7,
    sceneDescription:
      'While checking the calendar, a college student realizes the exam is tomorrow. Stacks of unopened textbooks are on the desk.',
    englishLines:
      'I was going to study last week, but I kept putting it off. Now the exam is tomorrow!',
    subtitles: [
      'I was going to study last week,',
      'but I kept putting it off. Now the exam is tomorrow!',
    ],
    usedExpressions: ['was / were going to + verb'],
    sourceMovies: ['Notting Hill'],
    mood: 'anxious',
  },
  {
    id: 'problem',
    label: 'Problem',
    startSec: 7,
    endSec: 15,
    sceneDescription:
      'The student sits at a messy desk surrounded by piles of textbooks and notes. Looking at the huge amount of work, the student holds their head in frustration and tries to stay calm.',
    englishLines:
      'Five chapters are left. I feel so suffocated, but I have to keep it together.',
    subtitles: [
      'Five chapters are left. I feel so suffocated,',
      'but I have to keep it together.',
    ],
    usedExpressions: ['feel so suffocated', 'keep it together'],
    sourceMovies: ['Minari', 'Inside Out 2'],
    mood: 'overwhelmed',
  },
  {
    id: 'turn',
    label: 'Turn',
    startSec: 15,
    endSec: 23,
    sceneDescription:
      "The student notices a friend's neatly organized study notes on the desk. Inspired by the notes, the student takes a deep breath, makes a study plan, and starts studying seriously.",
    englishLines:
      "I saw my friend's amazing notes. Seeing that made me want to level up, so I started studying harder.",
    subtitles: [
      "I saw my friend's amazing notes.",
      'Seeing that made me want to level up, so I started studying harder.',
    ],
    usedExpressions: ['Seeing that made me want to level up.'],
    sourceMovies: ['Inside Out 2'],
    mood: 'focused',
  },
  {
    id: 'close',
    label: 'Close',
    startSec: 23,
    endSec: 30,
    sceneDescription:
      'The sun rises outside the window. The student finally closes the last textbook and smiles proudly. Despite looking exhausted, the student feels relieved and happy.',
    englishLines: "The sun is rising, and I'm finally done! I can't stop smiling!",
    subtitles: ["The sun is rising, and I'm finally done!", "I can't stop smiling!"],
    usedExpressions: ["I can't stop smiling."],
    sourceMovies: ['Inside Out 2'],
    mood: 'relieved',
  },
];

export const STYLE_OPTIONS: {
  id: AnimationStyle;
  title: string;
  subtitle: string;
  detail: string;
}[] = [
  {
    id: '2d',
    title: '2D Animation',
    subtitle: 'Clean ink lines & cel shading',
    detail: 'Warm expressive character animation inspired by modern cozy study shorts.',
  },
  {
    id: 'clay',
    title: 'Clay',
    subtitle: 'Tactile stop-motion miniature',
    detail: 'Soft sculpted forms, gentle studio lighting, and classic 12fps stop-motion charm.',
  },
  {
    id: 'watercolor',
    title: 'Watercolor',
    subtitle: 'Hand-painted paper & washes',
    detail: 'Soft translucent pigment blooms, textured paper grain, and delicate ink contours.',
  },
  {
    id: 'live-action',
    title: 'Live-Action Style',
    subtitle: 'Cinematic film & soft bokeh',
    detail: 'Warm desk lamp contrast, subtle film grain, and gentle documentary camera motion.',
  },
];

export const OUTFIT_COLORS: { color: string; label: string }[] = [
  { color: '#4A6B82', label: 'Slate Blue Hoodie' },
  { color: '#5A7B68', label: 'Sage Green Cardigan' },
  { color: '#8C6D62', label: 'Warm Cocoa Knit' },
  { color: '#6E6684', label: 'Muted Lavender Sweatshirt' },
];
