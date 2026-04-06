/**
 * station-matcher.ts
 *
 * Production-grade station name normalization and fuzzy matching.
 * Handles all known DMRC station name discrepancies:
 *   - spacing differences   ("Vishwa Vidyalaya" vs "Vishwavidyalaya")
 *   - hyphen variants       ("Dabri Mor - Janakpuri South")
 *   - case differences      ("rajiv chowk" vs "Rajiv Chowk")
 *   - special chars         parentheses, dots, slashes
 *   - transliteration drift ("Vishva" vs "Vishwa")
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StationRecord {
  /** Original name exactly as it appears in the canonical dataset */
  original: string;
  /** Normalized form used for all comparisons  */
  normalized: string;
  /** Optional: lat/lon from stops.txt */
  lat?: number;
  lon?: number;
}

export interface MatchResult {
  station: StationRecord;
  /** Similarity score 0.0–1.0 (1.0 = perfect match) */
  score: number;
  /** How the match was found */
  method: 'exact' | 'partial' | 'fuzzy';
}

// ─── Normalization ───────────────────────────────────────────────────────────

/**
 * Collapses a station name to a canonical comparison key.
 * Strips spaces, hyphens, punctuation, and lowercases.
 *
 * "Dabri Mor - Janakpuri South" → "dabrimor-janakpurisouth" → "dabrmorjanakpurisouth"
 */
export function normalizeStationName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')          // apostrophes
    .replace(/[-–—]/g, '')          // hyphens / en-dash / em-dash
    .replace(/\./g, '')             // dots  (e.g. "Cantt.")
    .replace(/[()[\]/\\]/g, '')     // brackets, slashes
    .replace(/\s+/g, '')            // all whitespace
    .replace(/[^\w]/g, '')          // anything else non-word
    .trim();
}

// ─── Preprocessing ───────────────────────────────────────────────────────────

/** Build a StationRecord array from a list of canonical names */
export function buildStationIndex(names: string[]): StationRecord[] {
  return names.map((original) => ({
    original,
    normalized: normalizeStationName(original),
  }));
}

/** Parse stops.txt CSV content into StationRecord[] (usable server-side) */
export function parseStopsTxt(csv: string): StationRecord[] {
  const lines = csv.split('\n').filter(Boolean);
  // Skip header row
  const dataLines = lines.slice(1);
  const records: StationRecord[] = [];

  for (const line of dataLines) {
    const cols = line.split(',');
    if (cols.length < 6) continue;
    const original = cols[2]?.trim();
    const lat = parseFloat(cols[4]);
    const lon = parseFloat(cols[5]);
    if (!original) continue;
    records.push({
      original,
      normalized: normalizeStationName(original),
      lat: isNaN(lat) ? undefined : lat,
      lon: isNaN(lon) ? undefined : lon,
    });
  }

  return records;
}

// ─── Levenshtein distance (lightweight fuzzy engine) ─────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Use flat array for performance
  const dp: number[] = Array((m + 1) * (n + 1));

  for (let i = 0; i <= m; i++) dp[i * (n + 1)] = i;
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i * (n + 1) + j] = Math.min(
        dp[(i - 1) * (n + 1) + j] + 1,         // deletion
        dp[i * (n + 1) + (j - 1)] + 1,          // insertion
        dp[(i - 1) * (n + 1) + (j - 1)] + cost  // substitution
      );
    }
  }
  return dp[m * (n + 1) + n];
}

/** Similarity score from 0.0 (no match) to 1.0 (identical) */
function similarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Core Matcher ────────────────────────────────────────────────────────────

const EXACT_SCORE   = 1.00;
const PARTIAL_SCORE = 0.85;
const FUZZY_THRESHOLD = 0.60; // minimum similarity to surface a suggestion

/**
 * Find the best match for a user-supplied station name within a station index.
 *
 * Matching order:
 *  1. Exact (normalized equality)
 *  2. Partial (one contains the other)
 *  3. Fuzzy (Levenshtein similarity ≥ FUZZY_THRESHOLD)
 *
 * Returns null if nothing clears the fuzzy threshold.
 */
export function findBestMatch(
  input: string,
  index: StationRecord[]
): MatchResult | null {
  const inputNorm = normalizeStationName(input);

  if (!inputNorm) return null;

  // ── Step 1: Exact ──────────────────────────────────────────────────────────
  const exact = index.find((s) => s.normalized === inputNorm);
  if (exact) {
    console.debug('[StationMatcher] exact:', input, '→', exact.original);
    return { station: exact, score: EXACT_SCORE, method: 'exact' };
  }

  // ── Step 2: Partial ────────────────────────────────────────────────────────
  // a) normalized input is contained within a station name
  const partialA = index.find((s) => s.normalized.includes(inputNorm));
  if (partialA) {
    console.debug('[StationMatcher] partial(a):', input, '→', partialA.original);
    return { station: partialA, score: PARTIAL_SCORE, method: 'partial' };
  }
  // b) station name is contained within the normalized input
  const partialB = index.find((s) => inputNorm.includes(s.normalized));
  if (partialB) {
    console.debug('[StationMatcher] partial(b):', input, '→', partialB.original);
    return { station: partialB, score: PARTIAL_SCORE, method: 'partial' };
  }

  // ── Step 3: Fuzzy ──────────────────────────────────────────────────────────
  let bestScore = 0;
  let bestStation: StationRecord | null = null;

  for (const station of index) {
    const score = similarity(inputNorm, station.normalized);
    if (score > bestScore) {
      bestScore = score;
      bestStation = station;
    }
  }

  if (bestStation && bestScore >= FUZZY_THRESHOLD) {
    console.debug(
      `[StationMatcher] fuzzy(${bestScore.toFixed(2)}):`,
      input, '→', bestStation.original
    );
    return { station: bestStation, score: bestScore, method: 'fuzzy' };
  }

  console.debug('[StationMatcher] no match for:', input);
  return null;
}

/**
 * Resolve a user input to the canonical station name from the index.
 * Returns the original canonical name on match, null on failure.
 */
export function resolveStationName(
  input: string,
  index: StationRecord[]
): string | null {
  const match = findBestMatch(input, index);
  return match ? match.station.original : null;
}

/**
 * Get top-N autocomplete suggestions for a partial query.
 * Ranked by: exact prefix > partial match > fuzzy score.
 */
export function getAutocompleteSuggestions(
  query: string,
  index: StationRecord[],
  limit = 6
): StationRecord[] {
  if (!query.trim()) return [];

  const queryNorm = normalizeStationName(query);
  if (!queryNorm) return [];

  const scored: Array<{ record: StationRecord; score: number }> = [];

  for (const station of index) {
    const sn = station.normalized;

    // Exact prefix match — highest priority
    if (sn.startsWith(queryNorm)) {
      scored.push({ record: station, score: 2.0 });
    }
    // Substring match
    else if (sn.includes(queryNorm) || queryNorm.includes(sn)) {
      scored.push({ record: station, score: 1.5 });
    }
    // Fuzzy fallback — only include if above threshold
    else {
      const fuzz = similarity(queryNorm, sn);
      if (fuzz >= FUZZY_THRESHOLD) {
        scored.push({ record: station, score: fuzz });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.record);
}
