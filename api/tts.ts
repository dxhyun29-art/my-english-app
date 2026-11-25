import { GoogleGenAI } from '@google/genai';

interface ServerlessReq {
  method?: string;
  body?: unknown;
}

interface ServerlessRes {
  status(code: number): ServerlessRes;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

export default async function handler(req: ServerlessReq, res: ServerlessRes) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}) as {
      text?: string;
      voiceName?: 'Kore' | 'Zephyr' | 'Puck' | 'Charon';
      mood?: string;
    };

    const text = body.text?.trim();
    if (!text) {
      return res.status(400).json({ error: 'Text is required for voiceover generation.' });
    }

    const validVoice = ['Kore', 'Zephyr', 'Puck', 'Charon'].includes(body.voiceName ?? '')
      ? body.voiceName!
      : 'Kore';

    const styleByMood: Record<string, string> = {
      anxious: 'Natural university student voice, slightly surprised and brisk, clear English pronunciation',
      overwhelmed: 'Natural university student voice, tired yet steady and brisk, clear English pronunciation',
      focused: 'Natural university student voice, inspired and determined, clear brisk English pacing',
      relieved: 'Natural university student voice, relieved, happy and smiling, clear English pronunciation',
    };

    const style =
      styleByMood[body.mood ?? ''] ?? 'Clear, natural English student voice at a brisk, comfortable pace';

    const ai = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const interaction = await ai.interactions.create({
      model: 'gemini-3.8-flash-lite-tts',
      input: [
        {
          type: 'text',
          text,
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

    return res.status(200).json({
      audioBase64: audio.data,
      mimeType: audio.mime_type || 'audio/wav',
    });
  } catch (err) {
    let msg = err instanceof Error ? err.message : String(err);
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
    return res.status(500).json({ error: msg || 'Voiceover generation failed.' });
  }
}
