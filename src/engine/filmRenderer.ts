import { AnimationStyle, BeatKey, CharacterLook, StoryboardBeat } from '../types';
import { formatTwoLineSubtitles } from '../utils/expressions';

export interface RenderFrameOptions {
  timeSec: number; // Global 0..30 or beat-local time
  beat: StoryboardBeat;
  beatProgress: number; // 0..1 within current beat
  style: AnimationStyle;
  look: CharacterLook;
  showSubtitles: boolean;
  authorName?: string;
  showEndCredit?: boolean;
}

const DESK_PALETTES = {
  'warm-oak': { top: '#C79F79', front: '#A67E5A', edge: '#8C6645' },
  'pale-birch': { top: '#DFCAAE', front: '#C7AF91', edge: '#AB9273' },
  walnut: { top: '#8A6752', front: '#6E4E3D', edge: '#543A2C' },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(hexA: string, hexB: string, t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(lerp(ar, br, clamped));
  const g = Math.round(lerp(ag, bg, clamped));
  const bl = Math.round(lerp(ab, bb, clamped));
  return `rgb(${r}, ${g}, ${bl})`;
}

function shadeHex(hex: string, factor: number): string {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function fillStyledShape(
  ctx: CanvasRenderingContext2D,
  style: AnimationStyle,
  baseColor: string,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 10,
  strokeColor = '#273238'
) {
  drawRoundedRect(ctx, x, y, w, h, r);
  if (style === 'clay') {
    const grad = ctx.createRadialGradient(
      x + w * 0.3,
      y + h * 0.25,
      Math.max(4, Math.min(w, h) * 0.1),
      x + w * 0.5,
      y + h * 0.5,
      Math.max(w, h) * 0.85
    );
    grad.addColorStop(0, shadeHex(baseColor.startsWith('#') ? baseColor : '#668899', 1.2));
    grad.addColorStop(1, shadeHex(baseColor.startsWith('#') ? baseColor : '#668899', 0.78));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (style === 'watercolor') {
    ctx.save();
    ctx.globalAlpha *= 0.86;
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(42, 54, 59, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  } else if (style === 'live-action') {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, baseColor);
    grad.addColorStop(1, baseColor.startsWith('#') ? shadeHex(baseColor, 0.78) : baseColor);
    ctx.fillStyle = grad;
    ctx.fill();
  } else {
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

export function renderFilmFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: RenderFrameOptions
) {
  const { beat, beatProgress, style, look, showSubtitles, authorName, showEndCredit } = opts;

  // Clay style uses authentic 12fps stepped stop-motion cadence
  const t = style === 'clay' ? Math.floor(opts.timeSec * 12) / 12 : opts.timeSec;
  const p = style === 'clay' ? Math.floor(beatProgress * 96) / 96 : beatProgress;

  ctx.save();

  // Subtle camera motion (especially live-action dolly / gentle drift)
  let camScale = 1;
  let camX = 0;
  let camY = 0;
  if (beat.id === 'hook') {
    camScale = lerp(1, 1.045, p);
    camX = lerp(0, -14, p);
  } else if (beat.id === 'problem') {
    camScale = lerp(1.04, 1.01, p);
    camX = Math.sin(t * 1.4) * (style === 'live-action' ? 6 : 2);
  } else if (beat.id === 'turn') {
    camScale = lerp(1.01, 1.05, p);
    camY = lerp(4, -6, p);
  } else {
    camScale = lerp(1.05, 1, p);
  }

  ctx.translate(width / 2 + camX, height / 2 + camY);
  ctx.scale(camScale, camScale);
  ctx.translate(-width / 2, -height / 2);

  // Room sky & wall mood progression across 4 beats
  const beatIndexMap: Record<BeatKey, number> = {
    hook: 0,
    problem: 1,
    turn: 2,
    close: 3,
  };
  const idx = beatIndexMap[beat.id];
  const globalT = (idx + p) / 4; // 0 (night) -> 1 (golden sunrise)

  const wallColor =
    globalT < 0.55
      ? lerpColor('#263240', '#2E3A4A', globalT / 0.55)
      : lerpColor('#2E3A4A', '#EAE0D2', (globalT - 0.55) / 0.45);

  const skyTop =
    globalT < 0.45
      ? '#141B29'
      : globalT < 0.72
      ? lerpColor('#141B29', '#4A5D82', (globalT - 0.45) / 0.27)
      : lerpColor('#4A5D82', '#F2B880', (globalT - 0.72) / 0.28);

  const skyBottom =
    globalT < 0.45
      ? '#223047'
      : globalT < 0.72
      ? lerpColor('#223047', '#80769E', (globalT - 0.45) / 0.27)
      : lerpColor('#80769E', '#FCE2B6', (globalT - 0.72) / 0.28);

  // Background wall fill
  if (style === 'watercolor') {
    ctx.fillStyle = lerpColor('#E7E4DD', '#FAF3E7', globalT);
    ctx.fillRect(0, 0, width, height);
    // Soft watercolor wash blotches
    const wash = ctx.createRadialGradient(width * 0.72, height * 0.3, 40, width * 0.72, height * 0.3, width * 0.65);
    wash.addColorStop(0, globalT > 0.65 ? 'rgba(247, 198, 134, 0.38)' : 'rgba(72, 95, 128, 0.28)');
    wash.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = wallColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Dorm window (right half)
  const winX = width * 0.56;
  const winY = height * 0.09;
  const winW = width * 0.34;
  const winH = height * 0.48;

  // Window sky gradient
  drawRoundedRect(ctx, winX, winY, winW, winH, 12);
  const skyGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fill();

  // Stars (fade out by Beat 3/4)
  const starAlpha = Math.max(0, 1 - globalT * 1.6);
  if (starAlpha > 0.02) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 252, 232, ${starAlpha})`;
    const stars = [
      [0.18, 0.2],
      [0.42, 0.14],
      [0.72, 0.25],
      [0.85, 0.16],
      [0.28, 0.42],
      [0.62, 0.38],
    ];
    for (let i = 0; i < stars.length; i++) {
      const [sx, sy] = stars[i];
      const twinkle = 2 + Math.sin(t * 2.5 + i) * 0.8;
      ctx.beginPath();
      ctx.arc(winX + winW * sx, winY + winH * sy, twinkle, 0, Math.PI * 2);
      ctx.fill();
    }
    // Crescent moon
    ctx.beginPath();
    ctx.arc(winX + winW * 0.78, winY + winH * 0.24, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skyTop;
    ctx.beginPath();
    ctx.arc(winX + winW * 0.805, winY + winH * 0.22, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sunrise sun & warm rays (Beat 4 / late Beat 3)
  if (globalT > 0.62) {
    const sunProgress = (globalT - 0.62) / 0.38;
    const sunY = lerp(winY + winH * 0.92, winY + winH * 0.56, sunProgress);
    const sunX = winX + winW * 0.36;
    ctx.save();
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
    sunGlow.addColorStop(0, `rgba(255, 235, 175, ${0.95 * sunProgress})`);
    sunGlow.addColorStop(0.5, `rgba(255, 194, 120, ${0.42 * sunProgress})`);
    sunGlow.addColorStop(1, 'rgba(255, 194, 120, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFE7A3';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Live-action bokeh lights outside window
  if (style === 'live-action') {
    ctx.save();
    const bokehSpots = [
      [0.2, 0.78, 18],
      [0.48, 0.82, 24],
      [0.75, 0.74, 16],
      [0.88, 0.85, 20],
    ];
    for (const [bx, by, br] of bokehSpots) {
      ctx.fillStyle = globalT > 0.7 ? 'rgba(255, 224, 160, 0.22)' : 'rgba(173, 210, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(winX + winW * bx, winY + winH * by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Distant campus rooftops silhouette inside window
  ctx.save();
  drawRoundedRect(ctx, winX, winY, winW, winH, 12);
  ctx.clip();
  ctx.fillStyle = globalT > 0.7 ? '#897B8C' : '#182233';
  ctx.fillRect(winX, winY + winH * 0.78, winW * 0.35, winH * 0.25);
  ctx.fillRect(winX + winW * 0.32, winY + winH * 0.7, winW * 0.38, winH * 0.35);
  ctx.fillRect(winX + winW * 0.66, winY + winH * 0.76, winW * 0.36, winH * 0.3);
  ctx.restore();

  // Window frame & panes
  ctx.save();
  drawRoundedRect(ctx, winX, winY, winW, winH, 12);
  ctx.strokeStyle = style === 'watercolor' ? '#706860' : '#4E5866';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(winX + winW / 2, winY);
  ctx.lineTo(winX + winW / 2, winY + winH);
  ctx.moveTo(winX, winY + winH * 0.52);
  ctx.lineTo(winX + winW, winY + winH * 0.52);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  // Wall Calendar (prominent on left wall, especially Beat 1)
  const calX = width * 0.09;
  const calY = height * 0.12;
  const calW = width * 0.145;
  const calH = height * 0.21;
  fillStyledShape(ctx, style, '#FAF8F5', calX, calY, calW, calH, 8, '#2C373D');
  // Calendar top header bar
  fillStyledShape(ctx, style, '#C75C5C', calX, calY, calW, calH * 0.24, 6, '#2C373D');
  // Calendar grid lines
  ctx.save();
  ctx.strokeStyle = '#D5D2CA';
  ctx.lineWidth = 1.5;
  for (let r = 1; r <= 3; r++) {
    const gy = calY + calH * (0.28 + r * 0.16);
    ctx.beginPath();
    ctx.moveTo(calX + 12, gy);
    ctx.lineTo(calX + calW - 12, gy);
    ctx.stroke();
  }
  // Red circled EXAM day
  const circlePulse = beat.id === 'hook' ? 1 + Math.sin(t * 6) * 0.12 : 1;
  ctx.strokeStyle = '#C94A4A';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(calX + calW * 0.62, calY + calH * 0.66, 15 * circlePulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#C94A4A';
  ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('EXAM', calX + calW * 0.44, calY + calH * 0.42);
  ctx.restore();

  // Warm sunbeams across room in Beat 4
  if (globalT > 0.68) {
    const beamAlpha = (globalT - 0.68) / 0.32 * 0.22;
    ctx.save();
    ctx.fillStyle = `rgba(255, 222, 150, ${beamAlpha})`;
    ctx.beginPath();
    ctx.moveTo(winX, winY + winH);
    ctx.lineTo(winX + winW, winY + winH);
    ctx.lineTo(width * 0.42, height);
    ctx.lineTo(width * 0.12, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Desk surface
  const deskY = height * 0.66;
  const deskPalette = DESK_PALETTES[look.deskTone];
  fillStyledShape(ctx, style, deskPalette.top, width * 0.04, deskY, width * 0.92, height * 0.09, 8);
  fillStyledShape(ctx, style, deskPalette.front, width * 0.06, deskY + height * 0.08, width * 0.88, height * 0.28, 4);

  // Desk Lamp on left side
  const lampBaseX = width * 0.14;
  const lampBaseY = deskY + 8;
  fillStyledShape(ctx, style, '#465866', lampBaseX - 34, lampBaseY - 12, 68, 16, 8);
  ctx.save();
  ctx.strokeStyle = style === 'watercolor' ? '#465866' : '#2C373D';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lampBaseX, lampBaseY - 12);
  ctx.lineTo(lampBaseX - 18, lampBaseY - 110);
  ctx.lineTo(lampBaseX + 34, lampBaseY - 165);
  ctx.stroke();
  ctx.restore();
  // Lamp shade
  fillStyledShape(ctx, style, '#5C7688', lampBaseX + 14, lampBaseY - 184, 62, 34, 14);
  // Warm lamp light cone (stronger during night beats, gentler at sunrise)
  const lampAlpha = lerp(0.28, 0.06, globalT);
  ctx.save();
  const lampCone = ctx.createRadialGradient(
    lampBaseX + 45,
    lampBaseY - 140,
    10,
    lampBaseX + 150,
    deskY + 10,
    290
  );
  lampCone.addColorStop(0, `rgba(255, 224, 156, ${lampAlpha})`);
  lampCone.addColorStop(1, 'rgba(255, 224, 156, 0)');
  ctx.fillStyle = lampCone;
  ctx.beginPath();
  ctx.moveTo(lampBaseX + 24, lampBaseY - 150);
  ctx.lineTo(lampBaseX + 74, lampBaseY - 150);
  ctx.lineTo(lampBaseX + 360, deskY + 40);
  ctx.lineTo(lampBaseX - 40, deskY + 40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Consistent Student Character (center-left at desk)
  const charX = width * 0.44;
  const charY = deskY - 6;

  // Breathing & beat posture offsets
  const breath = Math.sin(t * 2.2) * 3;
  let torsoLean = 0;
  let headDrop = 0;
  let headTilt = 0;

  if (beat.id === 'hook') {
    torsoLean = -8;
    headTilt = -0.08 + Math.sin(t * 3) * 0.02;
  } else if (beat.id === 'problem') {
    torsoLean = 14;
    headDrop = 16 + Math.sin(t * 1.8) * 3;
    headTilt = 0.08;
  } else if (beat.id === 'turn') {
    torsoLean = lerp(12, 6, Math.min(1, p * 2));
    headDrop = lerp(10, 0, Math.min(1, p * 2));
    headTilt = 0.04;
  } else {
    torsoLean = -4;
    headDrop = -2 + breath * 0.5;
    headTilt = -0.03;
  }

  // Chair back behind student
  fillStyledShape(ctx, style, '#3D4852', charX - 72, charY - 170, 144, 150, 26);

  // Back hair layer (if ponytail or bob)
  const hairColor = '#2A2B33';
  if (look.hairStyle === 'bob') {
    fillStyledShape(ctx, style, hairColor, charX + torsoLean - 52, charY - 245 + headDrop, 104, 96, 40);
  } else if (look.hairStyle === 'ponytail') {
    fillStyledShape(ctx, style, hairColor, charX + torsoLean - 64, charY - 220 + headDrop, 38, 80, 18);
  }

  // Torso (consistent outfitColor across ALL 4 beats!)
  fillStyledShape(
    ctx,
    style,
    look.outfitColor,
    charX + torsoLean - 68,
    charY - 125 + breath,
    136,
    130,
    38
  );
  // Hoodie collar / neckline detail
  fillStyledShape(
    ctx,
    style,
    shadeHex(look.outfitColor, 0.85),
    charX + torsoLean - 32,
    charY - 128 + breath,
    64,
    24,
    12
  );

  // Neck & Head
  const headCenterX = charX + torsoLean;
  const headCenterY = charY - 188 + headDrop + breath * 0.6;

  ctx.save();
  ctx.translate(headCenterX, headCenterY);
  ctx.rotate(headTilt);

  // Neck
  fillStyledShape(ctx, style, '#F2C9AC', -15, 34, 30, 32, 8);
  // Face
  fillStyledShape(ctx, style, '#F7D5BA', -46, -48, 92, 92, 42);

  // Soft blush on cheeks (warm in Beat 4, stressed flush in Beat 2)
  ctx.save();
  ctx.fillStyle = beat.id === 'problem' ? 'rgba(218, 118, 108, 0.35)' : 'rgba(236, 146, 134, 0.32)';
  ctx.beginPath();
  ctx.ellipse(-26, 12, 10, 6, 0, 0, Math.PI * 2);
  ctx.ellipse(26, 12, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hair bangs & crown
  fillStyledShape(ctx, style, hairColor, -48, -56, 96, 42, 22);
  if (look.hairStyle === 'short') {
    fillStyledShape(ctx, style, hairColor, -50, -34, 16, 40, 8);
    fillStyledShape(ctx, style, hairColor, 34, -34, 16, 40, 8);
  }

  // Eyes (blinking + beat emotion)
  const blinkPhase = t % 4.2;
  const isBlinking = blinkPhase > 4.05;
  ctx.save();
  ctx.strokeStyle = '#242A30';
  ctx.fillStyle = '#242A30';
  ctx.lineWidth = 3;

  if (beat.id === 'problem' || isBlinking) {
    // Tired closed / squinted arc eyes
    ctx.beginPath();
    ctx.arc(-18, -2, 8, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(18, -2, 8, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  } else if (beat.id === 'close') {
    // Happy curved smiling eyes
    ctx.beginPath();
    ctx.arc(-18, 2, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(18, 2, 8, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  } else {
    const eyeRadius = beat.id === 'hook' ? 6.5 : 5.5;
    ctx.beginPath();
    ctx.arc(-18, -2, eyeRadius, 0, Math.PI * 2);
    ctx.arc(18, -2, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    // Eye catchlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-20, -4, 2, 0, Math.PI * 2);
    ctx.arc(16, -4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyebrows
  ctx.strokeStyle = '#242A30';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  if (beat.id === 'hook') {
    ctx.moveTo(-27, -16);
    ctx.lineTo(-10, -20);
    ctx.moveTo(10, -20);
    ctx.lineTo(27, -16);
  } else if (beat.id === 'problem') {
    ctx.moveTo(-27, -12);
    ctx.lineTo(-10, -17);
    ctx.moveTo(10, -17);
    ctx.lineTo(27, -12);
  } else {
    ctx.moveTo(-26, -15);
    ctx.lineTo(-10, -16);
    ctx.moveTo(10, -16);
    ctx.lineTo(26, -15);
  }
  ctx.stroke();

  // Glasses (consistent if selected)
  if (look.glasses) {
    ctx.strokeStyle = '#4A525D';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-18, -1, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(18, -1, 13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, -1);
    ctx.lineTo(5, -1);
    ctx.stroke();
  }

  // Mouth emotion per beat
  ctx.strokeStyle = '#6B3F3B';
  ctx.fillStyle = '#B55B54';
  ctx.lineWidth = 2.6;
  if (beat.id === 'hook') {
    // Small surprised "o" gasp when checking the exam calendar
    ctx.beginPath();
    ctx.ellipse(0, 22, 5.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (beat.id === 'close') {
    ctx.beginPath();
    ctx.arc(0, 17, 11, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else if (beat.id === 'problem') {
    ctx.beginPath();
    ctx.arc(0, 27, 8, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-7, 22);
    ctx.lineTo(7, 22);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();

  // Arms & Beat-specific desk props
  // Left & Right textbook stacks on desk
  const bookColors = ['#5B7D87', '#8CA08E', '#C78E75', '#6E7A94'];
  if (beat.id === 'hook' || beat.id === 'problem') {
    // Tall stack of unopened textbooks on the right
    for (let b = 0; b < 4; b++) {
      fillStyledShape(
        ctx,
        style,
        bookColors[b],
        width * 0.65 + (b % 2) * 5,
        deskY - 22 - b * 22,
        140,
        22,
        4
      );
      // Pages stripe
      ctx.fillStyle = '#F5F1E6';
      ctx.fillRect(width * 0.65 + 10 + (b % 2) * 5, deskY - 17 - b * 22, 116, 11);
    }
  } else {
    // Neatly stacked completed books on the right
    for (let b = 0; b < 3; b++) {
      fillStyledShape(
        ctx,
        style,
        bookColors[b],
        width * 0.68,
        deskY - 22 - b * 22,
        130,
        22,
        4
      );
    }
  }

  // Beat-specific foreground action & arms
  if (beat.id === 'hook') {
    // Pointing hand toward calendar + surprised exclamation indicator
    fillStyledShape(ctx, style, look.outfitColor, charX - 96, charY - 90, 42, 76, 18);
    fillStyledShape(ctx, style, '#F7D5BA', charX - 98, charY - 108, 28, 28, 14);
    // Open planner on desk
    fillStyledShape(ctx, style, '#F7F4EC', charX - 60, deskY - 10, 130, 18, 4);
  } else if (beat.id === 'problem') {
    // Hands raised holding head in frustration
    fillStyledShape(ctx, style, look.outfitColor, charX - 68, charY - 165 + headDrop, 32, 75, 16);
    fillStyledShape(ctx, style, look.outfitColor, charX + 46, charY - 165 + headDrop, 32, 75, 16);
    fillStyledShape(ctx, style, '#F7D5BA', charX - 58, charY - 185 + headDrop, 26, 28, 12);
    fillStyledShape(ctx, style, '#F7D5BA', charX + 42, charY - 185 + headDrop, 26, 28, 12);
    // Scattered open textbook & loose notes
    fillStyledShape(ctx, style, '#FAF6EC', charX - 95, deskY - 12, 180, 20, 4);
  } else if (beat.id === 'turn') {
    // Friend's neat color-coded study notes glowing softly on desk!
    ctx.save();
    const noteGlow = ctx.createRadialGradient(charX + 10, deskY - 6, 10, charX + 10, deskY - 6, 110);
    noteGlow.addColorStop(0, 'rgba(167, 212, 188, 0.35)');
    noteGlow.addColorStop(1, 'rgba(167, 212, 188, 0)');
    ctx.fillStyle = noteGlow;
    ctx.fillRect(charX - 110, deskY - 70, 240, 90);
    ctx.restore();

    fillStyledShape(ctx, style, '#FDFBF5', charX - 85, deskY - 14, 170, 22, 4);
    // Color-coded highlight stripes on neat notes
    ctx.fillStyle = '#7FB69E';
    ctx.fillRect(charX - 70, deskY - 9, 55, 5);
    ctx.fillStyle = '#E0A96D';
    ctx.fillRect(charX + 8, deskY - 9, 55, 5);

    // Focused writing arm moving gently
    const writeOffset = Math.sin(t * 7) * 8;
    fillStyledShape(ctx, style, look.outfitColor, charX + 20, charY - 65, 54, 48, 18);
    fillStyledShape(ctx, style, '#F7D5BA', charX + 4 + writeOffset, deskY - 22, 26, 22, 10);
  } else {
    // Close: last textbook neatly closed on desk, hands resting calmly
    fillStyledShape(ctx, style, '#5B7D87', charX - 64, deskY - 24, 134, 24, 5);
    fillStyledShape(ctx, style, '#F7D5BA', charX - 42, deskY - 34, 28, 22, 10);
    fillStyledShape(ctx, style, '#F7D5BA', charX + 14, deskY - 34, 28, 22, 10);
  }

  // Warm mug on desk (consistent prop across all 4 beats!)
  fillStyledShape(ctx, style, '#E8DFD3', width * 0.25, deskY - 34, 34, 36, 8);

  // Subtle floating dust/sunlight particles in Beat 3 & 4
  if (beat.id === 'turn' || beat.id === 'close') {
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const px = (width * 0.3 + i * 75 + Math.sin(t + i) * 18) % width;
      const py = (height * 0.2 + i * 42 - t * 12) % (deskY - 10);
      ctx.fillStyle = beat.id === 'close' ? 'rgba(255, 240, 190, 0.55)' : 'rgba(220, 240, 230, 0.35)';
      ctx.beginPath();
      ctx.arc(px, Math.abs(py), 2.5 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Style-specific film overlays (Clay speckle, Watercolor paper, Live-action vignette)
  if (style === 'live-action') {
    const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.28, width / 2, height / 2, width * 0.65);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(10,14,20,0.34)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  } else if (style === 'clay') {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 40; i++) {
      const gx = ((i * 193) % width);
      const gy = ((i * 137) % height);
      ctx.fillRect(gx, gy, 3, 2);
    }
    ctx.restore();
  }

  ctx.restore();

  // Burned-in English Subtitles (white bold text, bottom of the screen, max 2 lines)
  if (showSubtitles && !showEndCredit) {
    const lines =
      beat.subtitles && beat.subtitles.length > 0
        ? beat.subtitles.slice(0, 2)
        : formatTwoLineSubtitles(beat.englishLines);

    if (lines.length > 0) {
      ctx.save();
      // Measured contrast scrim along the bottom edge
      const scrimGrad = ctx.createLinearGradient(0, height * 0.72, 0, height);
      scrimGrad.addColorStop(0, 'rgba(12, 18, 22, 0)');
      scrimGrad.addColorStop(0.55, 'rgba(12, 18, 22, 0.52)');
      scrimGrad.addColorStop(1, 'rgba(12, 18, 22, 0.82)');
      ctx.fillStyle = scrimGrad;
      ctx.fillRect(0, height * 0.72, width, height * 0.28);

      const fontSize = Math.round(height * 0.044); // ~32px at 720p
      ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", "DM Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lineHeight = fontSize * 1.32;
      const baseBottomY = height - height * 0.075;
      const startY = lines.length === 2 ? baseBottomY - lineHeight : baseBottomY - lineHeight * 0.35;

      lines.forEach((line, lineIdx) => {
        const y = startY + lineIdx * lineHeight;
        ctx.lineWidth = Math.max(4, fontSize * 0.16);
        ctx.strokeStyle = 'rgba(12, 16, 22, 0.88)';
        ctx.lineJoin = 'round';
        ctx.strokeText(line, width / 2, y, width * 0.88);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(line, width / 2, y, width * 0.88);
      });

      ctx.restore();
    }
  }

  // Closing Credit Frame ("Made with Google AI Studio · Script by [Dahyun]")
  if (showEndCredit) {
    ctx.save();
    ctx.fillStyle = 'rgba(22, 30, 36, 0.74)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 ${Math.round(height * 0.052)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText('The Night Before The Exam', width / 2, height * 0.43);

    ctx.fillStyle = '#DDE8E2';
    ctx.font = `600 ${Math.round(height * 0.032)}px "DM Sans", sans-serif`;
    ctx.fillText(
      `Made with Google AI Studio · Script by ${authorName?.trim() || 'Dahyun'}`,
      width / 2,
      height * 0.54
    );
    ctx.restore();
  }
}
