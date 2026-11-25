import { MovieExpression, StoryboardBeat } from '../types';

export interface ExpressionValidation {
  validCount: number;
  distinctMovies: string[];
  hasEnoughExpressions: boolean;
  hasMultipleMovies: boolean;
  isValid: boolean;
  warnings: string[];
}

export function validateExpressions(expressions: MovieExpression[]): ExpressionValidation {
  const filled = expressions.filter(
    (e) => e.expression.trim().length > 0 && e.koreanMeaning.trim().length > 0 && e.movie.trim().length > 0
  );
  const nonEmptyExpressions = expressions.filter((e) => e.expression.trim().length > 0);
  const movies = Array.from(
    new Set(
      expressions
        .map((e) => e.movie.trim())
        .filter((m) => m.length > 0)
        .map((m) => m.toLowerCase())
    )
  );

  const hasEnoughExpressions = nonEmptyExpressions.length >= 5;
  const hasMultipleMovies = movies.length >= 2;

  const warnings: string[] = [];
  if (!hasEnoughExpressions) {
    const remaining = 5 - nonEmptyExpressions.length;
    warnings.push(
      `Add ${remaining} more English ${remaining === 1 ? 'expression' : 'expressions'} (minimum 5 required).`
    );
  }
  if (!hasMultipleMovies) {
    warnings.push(
      movies.length === 0
        ? 'Add source movie titles from at least 2 different movies.'
        : 'Only 1 movie is listed so far. Add expressions from at least 2 different movies.'
    );
  }
  if (filled.length < nonEmptyExpressions.length) {
    warnings.push('Please fill in the Korean meaning and movie title for each expression.');
  }

  return {
    validCount: nonEmptyExpressions.length,
    distinctMovies: movies,
    hasEnoughExpressions,
    hasMultipleMovies,
    isValid: hasEnoughExpressions && hasMultipleMovies && filled.length === nonEmptyExpressions.length,
    warnings,
  };
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countStoryboardWords(beats: StoryboardBeat[]): number {
  return beats.reduce((sum, beat) => sum + countWords(beat.englishLines), 0);
}

/**
 * Formats English spoken text into at most 2 balanced lines for burned-in subtitles.
 */
export function formatTwoLineSubtitles(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= 42) return [clean];

  const words = clean.split(' ');
  const mid = Math.ceil(clean.length / 2);
  let bestIndex = Math.floor(words.length / 2);
  let bestDiff = Infinity;

  let running = 0;
  for (let i = 0; i < words.length - 1; i++) {
    running += words[i].length + (i > 0 ? 1 : 0);
    const diff = Math.abs(running - mid);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i + 1;
    }
  }

  const line1 = words.slice(0, bestIndex).join(' ');
  const line2 = words.slice(bestIndex).join(' ');
  return [line1, line2].filter(Boolean);
}

/**
 * Returns regex-matchable phrases for highlighting typed expressions in text.
 * Supports literal expressions (exact match) and common slash/placeholder patterns
 * like "was / were going to + verb".
 */
export function buildExpressionMatchers(expressions: MovieExpression[]): {
  raw: string;
  matchedText: (text: string) => RegExpMatchArray | null;
  regex: RegExp | null;
}[] {
  return expressions
    .map((e) => e.expression.trim())
    .filter(Boolean)
    .map((raw) => {
      const escaped = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // If the expression contains "/" or "+", also match a realistic spoken realization
      if (raw.includes('/') || raw.includes('+')) {
        const lower = raw.toLowerCase();
        if (lower.includes('was / were going to')) {
          const rx = /\b(?:was|were)\s+going\s+to(?:\s+[a-z']+)?/i;
          return { raw, matchedText: (t: string) => t.match(rx), regex: rx };
        }
        const simplified = raw
          .replace(/\+\s*[a-z]+/gi, '')
          .split('/')[0]
          .trim()
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = simplified ? new RegExp(simplified, 'i') : null;
        return { raw, matchedText: (t: string) => (rx ? t.match(rx) : null), regex: rx };
      }
      const rx = new RegExp(escaped, 'i');
      return {
        raw,
        matchedText: (t: string) => t.match(rx),
        regex: rx,
      };
    });
}

export function getExpressionCoverage(
  beats: StoryboardBeat[],
  expressions: MovieExpression[]
): { expression: string; included: boolean }[] {
  const fullScript = beats.map((b) => b.englishLines).join(' ');
  const matchers = buildExpressionMatchers(expressions);
  return matchers.map((m) => ({
    expression: m.raw,
    included: Boolean(m.matchedText(fullScript)),
  }));
}

export interface TextSegment {
  text: string;
  highlighted: boolean;
}

export function highlightExpressionsInText(
  text: string,
  expressions: MovieExpression[]
): TextSegment[] {
  const matchers = buildExpressionMatchers(expressions).filter((m) => m.regex !== null);
  if (matchers.length === 0 || !text) {
    return [{ text, highlighted: false }];
  }

  const ranges: { start: number; end: number }[] = [];
  for (const m of matchers) {
    if (!m.regex) continue;
    const globalRx = new RegExp(m.regex.source, 'gi');
    let match: RegExpExecArray | null;
    while ((match = globalRx.exec(text)) !== null) {
      if (match[0].length === 0) break;
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  if (ranges.length === 0) {
    return [{ text, highlighted: false }];
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const r of ranges) {
    const prev = merged[merged.length - 1];
    if (prev && r.start <= prev.end) {
      prev.end = Math.max(prev.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) {
      segments.push({ text: text.slice(cursor, r.start), highlighted: false });
    }
    segments.push({ text: text.slice(r.start, r.end), highlighted: true });
    cursor = r.end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }
  return segments;
}
