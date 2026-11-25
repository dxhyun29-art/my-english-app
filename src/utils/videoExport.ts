import { renderFilmFrame } from '../engine/filmRenderer';
import { AnimationStyle, CharacterLook, StoryboardBeat } from '../types';

export async function exportFullFilmVideo(params: {
  beats: StoryboardBeat[];
  style: AnimationStyle;
  look: CharacterLook;
  authorName: string;
  onProgress: (percent: number, label: string) => void;
}): Promise<Blob> {
  const { beats, style, look, authorName, onProgress } = params;

  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize video canvas.');
  }

  const videoStream = canvas.captureStream(30);

  const mimeCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  const selectedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

  const recorder = new MediaRecorder(videoStream, {
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
      reject(new Error('Video recording failed in this browser.'));
    };

    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: selectedMime }));
    };

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

      renderFilmFrame(ctx, width, height, {
        timeSec: elapsedSec,
        beat: activeBeat,
        beatProgress,
        style,
        look,
        showSubtitles: true,
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
