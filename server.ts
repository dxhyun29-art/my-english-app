import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(apiVersion?: 'v1' | 'v1beta'): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGeminiError(err: unknown): { status: number; message: string } {
  let msg = err instanceof Error ? err.message : String(err);

  // Extract clean message if SDK returns a JSON error payload
  const jsonStart = msg.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(msg.slice(jsonStart));
      if (parsed?.error?.message) {
        msg = String(parsed.error.message);
      }
    } catch {
      // keep raw message
    }
  }

  if (
    msg.includes('GEMINI_API_KEY is not configured') ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED')
  ) {
    return {
      status: 400,
      message: 'Please check your GEMINI_API_KEY in the Settings > Secrets panel.',
    };
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    return {
      status: 429,
      message: 'API rate limit reached. Please wait a moment and try again.',
    };
  }
  return {
    status: 500,
    message: msg || 'An unexpected error occurred while calling Gemini.',
  };
}

interface InputExpression {
  expression: string;
  koreanMeaning: string;
  movie: string;
}

interface BeatInput {
  id: 'hook' | 'problem' | 'turn' | 'close';
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

const app = express();
app.use(express.json({ limit: '5mb' }));

// Generate all 4 beats of the 30-second storyboard
app.post('/api/storyboard', async (req, res) => {
  try {
    const { expressions, scene } = req.body as {
      expressions: InputExpression[];
      scene: {
        place: string;
        characters: string;
        situation: string;
        style: string;
      };
    };

    if (!Array.isArray(expressions) || expressions.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one expression.' });
    }

    const ai = getAiClient();

    const expressionListText = expressions
      .map(
        (item, idx) =>
          `${idx + 1}. Expression: "${item.expression}" | Korean meaning: "${item.koreanMeaning}" | Movie: "${item.movie}"`
      )
      .join('\n');

    const prompt = `Write a cohesive 30-second short-film storyboard for Korean university students learning everyday English, titled "The Night Before The Exam".

SCENE SETTINGS:
- Place: ${scene.place}
- Characters: ${scene.characters}
- Situation: ${scene.situation}
- Visual style: ${scene.style}

USER EXPRESSIONS TO INCLUDE (MUST USE EVERY SINGLE ONE):
${expressionListText}

STRICT RULES:
1. Split the 30 seconds into exactly 4 beats:
   - Beat 1 ("hook", "Hook", 0 to 7 seconds, mood "anxious")
   - Beat 2 ("problem", "Problem", 7 to 15 seconds, mood "overwhelmed")
   - Beat 3 ("turn", "Turn", 15 to 23 seconds, mood "focused")
   - Beat 4 ("close", "Close", 23 to 30 seconds, mood "relieved")
2. Total word count of all 4 beats' "englishLines" combined MUST be strictly between 60 and 70 words. Count carefully!
3. Every expression from the list MUST be used in the English lines. If the expression is a literal phrase (for example "feel so suffocated", "keep it together", "I can't stop smiling."), embed that exact string verbatim with exact spelling and wording. If an expression contains grammar notation like "was / were going to + verb", use a clear natural instance like "was going to study" and still list the user's expression in usedExpressions.
4. Keep the same character, outfit, and setting continuity across all 4 beats. Family-friendly, no real celebrities, no copyrighted movie characters, no brand logos.
5. For each beat, provide "subtitles": an array of 2 short lines (max 2 lines total per beat, matching the beat's englishLines word-for-word, clean readable length for mobile screens).
6. List the exact user expressions used in that beat under "usedExpressions", and their source movies under "sourceMovies".`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a friendly short-film writer for Korean university students learning English. Keep total dialogue across all 4 beats strictly between 60 and 70 words. Output valid JSON matching the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            beats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  startSec: { type: Type.INTEGER },
                  endSec: { type: Type.INTEGER },
                  sceneDescription: { type: Type.STRING },
                  englishLines: { type: Type.STRING },
                  subtitles: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  usedExpressions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  sourceMovies: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  mood: { type: Type.STRING },
                },
                required: [
                  'id',
                  'label',
                  'startSec',
                  'endSec',
                  'sceneDescription',
                  'englishLines',
                  'subtitles',
                  'usedExpressions',
                  'sourceMovies',
                  'mood',
                ],
              },
            },
          },
          required: ['beats'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    if (!Array.isArray(parsed.beats) || parsed.beats.length !== 4) {
      return res.status(502).json({ error: 'Model returned an unexpected storyboard structure.' });
    }

    const canonicalBeats: BeatInput[] = parsed.beats.map((b: BeatInput, idx: number) => {
      const defaults = [
        { id: 'hook' as const, label: 'Hook', startSec: 0, endSec: 7, mood: 'anxious' as const },
        { id: 'problem' as const, label: 'Problem', startSec: 7, endSec: 15, mood: 'overwhelmed' as const },
        { id: 'turn' as const, label: 'Turn', startSec: 15, endSec: 23, mood: 'focused' as const },
        { id: 'close' as const, label: 'Close', startSec: 23, endSec: 30, mood: 'relieved' as const },
      ][idx];
      return {
        id: defaults.id,
        label: defaults.label,
        startSec: defaults.startSec,
        endSec: defaults.endSec,
        sceneDescription: b.sceneDescription ?? '',
        englishLines: b.englishLines ?? '',
        subtitles: Array.isArray(b.subtitles) ? b.subtitles.slice(0, 2) : [b.englishLines ?? ''],
        usedExpressions: Array.isArray(b.usedExpressions) ? b.usedExpressions : [],
        sourceMovies: Array.isArray(b.sourceMovies) ? b.sourceMovies : [],
        mood: defaults.mood,
      };
    });

    res.json({ beats: canonicalBeats });
  } catch (err) {
    const { status, message } = handleGeminiError(err);
    res.status(status).json({ error: message });
  }
});

// Regenerate a single beat while maintaining continuity and 60-70 total words
app.post('/api/regenerate-beat', async (req, res) => {
  try {
    const { beatId, allBeats, expressions, scene } = req.body as {
      beatId: 'hook' | 'problem' | 'turn' | 'close';
      allBeats: BeatInput[];
      expressions: InputExpression[];
      scene: {
        place: string;
        characters: string;
        situation: string;
        style: string;
      };
    };

    const targetBeat = allBeats.find((b) => b.id === beatId);
    if (!targetBeat) {
      return res.status(400).json({ error: 'Target beat not found.' });
    }

    const otherBeatsWords = allBeats
      .filter((b) => b.id !== beatId)
      .reduce((sum, b) => sum + b.englishLines.trim().split(/\s+/).filter(Boolean).length, 0);

    const minTargetWords = Math.max(10, 60 - otherBeatsWords);
    const maxTargetWords = Math.max(minTargetWords + 4, 70 - otherBeatsWords);

    const targetExpressions =
      targetBeat.usedExpressions.length > 0
        ? targetBeat.usedExpressions
        : expressions.slice(0, 1).map((e) => e.expression);

    const ai = getAiClient();

    const prompt = `Rewrite ONLY the "${targetBeat.label}" beat (${targetBeat.startSec}-${targetBeat.endSec}s) of our 30-second English learning short film "The Night Before The Exam".

SCENE CONTEXT:
- Place: ${scene.place}
- Characters: ${scene.characters}
- Situation: ${scene.situation}

OTHER BEATS FOR CONTINUITY:
${allBeats
  .map((b) =>
    b.id === beatId
      ? `[REWRITE THIS BEAT]: ${b.label} (${b.startSec}-${b.endSec}s)`
      : `- ${b.label} (${b.startSec}-${b.endSec}s): ${b.englishLines}`
  )
  .join('\n')}

REQUIRED EXPRESSIONS FOR THIS BEAT:
${targetExpressions.map((e) => `- "${e}"`).join('\n')}

RULES:
1. Keep englishLines for this beat around ${minTargetWords} to ${maxTargetWords} words so the total across all 4 beats stays between 60 and 70 words.
2. Include all required expressions listed above naturally (verbatim if literal phrase).
3. Provide a fresh, vivid sceneDescription and 2-line subtitles matching englishLines word-for-word.
4. Keep the same character, outfit, and family-friendly tone.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You rewrite a single beat of a 30-second student short film cleanly and concisely in JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sceneDescription: { type: Type.STRING },
            englishLines: { type: Type.STRING },
            subtitles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            usedExpressions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            sourceMovies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'sceneDescription',
            'englishLines',
            'subtitles',
            'usedExpressions',
            'sourceMovies',
          ],
        },
      },
    });

    const updated = JSON.parse((response.text ?? '{}').trim());
    res.json({
      beat: {
        ...targetBeat,
        sceneDescription: updated.sceneDescription ?? targetBeat.sceneDescription,
        englishLines: updated.englishLines ?? targetBeat.englishLines,
        subtitles: Array.isArray(updated.subtitles)
          ? updated.subtitles.slice(0, 2)
          : targetBeat.subtitles,
        usedExpressions: Array.isArray(updated.usedExpressions)
          ? updated.usedExpressions
          : targetBeat.usedExpressions,
        sourceMovies: Array.isArray(updated.sourceMovies)
          ? updated.sourceMovies
          : targetBeat.sourceMovies,
      },
    });
  } catch (err) {
    const { status, message } = handleGeminiError(err);
    res.status(status).json({ error: message });
  }
});

// Generate natural English TTS voiceover for a beat
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceName, mood } = req.body as {
      text: string;
      voiceName?: 'Kore' | 'Zephyr' | 'Puck' | 'Charon';
      mood?: string;
    };

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for voiceover generation.' });
    }

    const ai = getAiClient('v1beta');
    const validVoice = ['Kore', 'Zephyr', 'Puck', 'Charon'].includes(voiceName ?? '')
      ? voiceName!
      : 'Kore';

    const styleByMood: Record<string, string> = {
      anxious: 'Natural university student voice, slightly surprised and brisk, clear English pronunciation',
      overwhelmed: 'Natural university student voice, tired yet steady and brisk, clear English pronunciation',
      focused: 'Natural university student voice, inspired and determined, clear brisk English pacing',
      relieved: 'Natural university student voice, relieved, happy and smiling, clear English pronunciation',
    };

    const style =
      styleByMood[mood ?? ''] ?? 'Clear, natural English student voice at a brisk, comfortable pace';

    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash-lite-tts',
      input: [
        {
          type: 'text',
          text: text.trim(),
          annotations: [
            {
              type: 'speech_metadata',
              style,
            },
          ],
        },
      ],
      response_format: { type: 'audio' },
      generation_config: {
        speech_config: [
          {
            language: 'en-US',
            voice: validVoice,
          },
        ],
      },
    });

    const audio = interaction.output_audio;
    if (!audio?.data) {
      return res.status(502).json({ error: 'Voiceover generation returned no audio data.' });
    }

    res.json({
      audioBase64: audio.data,
      mimeType: audio.mime_type || 'audio/wav',
    });
  } catch (err) {
    const { status, message } = handleGeminiError(err);
    res.status(status).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
