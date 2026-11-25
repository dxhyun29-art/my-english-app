import { renderFilmFrame } from '../engine/filmRenderer';
import { AnimationStyle, BeatClipAudio, BeatKey, CharacterLook, StoryboardBeat } from '../types';
import { decodeAudioBase64 } from './audio';

export async function exportFullFilmVideo(params: {
  beats: StoryboardBeat[];
  style: AnimationStyle;
  look: CharacterLook;
  audioMap: Partial<Record<BeatKey, BeatClipAudio>>;
  authorName: string;
  onProgress: (percent: number, label: string) => void;
}): Promise<Blob> {
  const { beats, style, look, audioMap, authorName, onProgress } = params;

  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize video canvas.');
  }

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  const dest = audioCtx.createMediaStreamDestination();

  // Keep audio stream alive across gaps
  const silentGain = audioCtx.createGain();
  silentGain.gain.value = 0;
  const osc = audioCtx.createOscillator();
  osc.connect(silentGain);
  silentGain.connect(dest);
  osc.start();

  const decodedBuffers: Partial<Record<BeatKey, AudioBuffer>> = {};
  for (const beat of beats) {
    const clip = audioMap[beat.id];
    if (clip?.audioBase64) {
      try {
        decodedBuffers[beat.id] = await decodeAudioBase64(audioCtx, clip.audioBase64);
      } catch {
        // skip broken clip
      }
    }
  }

  const videoStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const selectedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType: selectedMime,
    videoBitsPerSecond: 3_500_000,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const totalSec = 30;
  const creditStartSec = 28.0;

  return new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => {
      audioCtx.close().catch(() => {});
      reject(new Error('Video recording failed in this browser.'));
    };

    recorder.onstop = () => {
      osc.stop();
      audioCtx.close().catch(() => {});
      resolve(new Blob(chunks, { type: selectedMime }));
    };

    const startAudioTime = audioCtx.currentTime + 0.08;
    const activeIntervals: { start: number; end: number }[] = [];

    for (const beat of beats) {
      const buf = decodedBuffers[beat.id];
      if (buf) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(dest);
        const playAt = startAudioTime + beat.startSec + 0.05;
        src.start(playAt);
        activeIntervals.push({
          start: beat.startSec + 0.05,
          end: beat.startSec + 0.05 + buf.duration,
        });
      }
    }

    recorder.start(250);
    const startWall = performance.now();

    const tick = () => {
      const elapsedSec = (performance.now() - startWall) / 1000;
      if (elapsedSec >= totalSec) {
        onProgress(100, 'Finalizing video file...');
        recorder.stop();
        return;
      }

      const activeBeat =
        beats.find((b) => elapsedSec >= b.startSec && elapsedSec < b.endSec) ??
        beats[beats.length - 1];
      const beatDuration = Math.max(1, activeBeat.endSec - activeBeat.startSec);
      const beatProgress = Math.min(1, Math.max(0, (elapsedSec - activeBeat.startSec) / beatDuration));
      const isSpeaking = activeIntervals.some(
        (iv) => elapsedSec >= iv.start && elapsedSec <= iv.end
      );

      renderFilmFrame(ctx, width, height, {
        timeSec: elapsedSec,
        beat: activeBeat,
        beatProgress,
        style,
        look,
        showSubtitles: true,
        isSpeaking,
        authorName,
        showEndCredit: elapsedSec >= creditStartSec,
      });

      const pct = Math.min(99, Math.round((elapsedSec / totalSec) * 100));
      onProgress(pct, `Recording ${activeBeat.label} (${Math.floor(elapsedSec)}s / 30s)...`);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}
