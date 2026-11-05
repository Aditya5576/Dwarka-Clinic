/**
 * Dependency-free Levenshtein distance and fuzzy search utility
 * Optimized for Dr. Baldawa's Dwarka Clinic clinical prescriber & pharmacy formulary.
 *
 * Tolerates 1-2 typographical errors and character transpositions (e.g.
 * "Novnib" -> "Novanib-T", "Salycilic" -> "Salicylic Acid Peel", "Kenacot" -> "Intralesional Kenacort").
 */

/**
 * Calculates standard Levenshtein edit distance between strings a and b.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP optimization
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a[i - 1];

    for (let j = 1; j <= n; j++) {
      const bChar = b[j - 1];
      const cost = aChar === bChar ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      );
    }

    // Swap row references
    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j];
    }
  }

  return prevRow[n];
}

export interface FuzzyMatchResult {
  matches: boolean;
  score: number;
}

/**
 * Evaluates whether target text matches the query pattern, tolerating 1-2 typos.
 * Returns match status and a ranking score (higher = better match).
 */
export function fuzzyMatch(query: string, target: string): FuzzyMatchResult {
  const q = query.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  if (!q) {
    return { matches: true, score: 0 };
  }
  if (!t) {
    return { matches: false, score: 0 };
  }

  // 1. Exact match
  if (t === q) {
    return { matches: true, score: 2000 };
  }

  // 2. Exact prefix match
  if (t.startsWith(q)) {
    return { matches: true, score: 1500 - (t.length - q.length) };
  }

  // 3. Substring match
  const subIdx = t.indexOf(q);
  if (subIdx !== -1) {
    return { matches: true, score: 1000 - subIdx * 5 };
  }

  // 4. Token-level fuzzy matching
  const qTokens = q.split(/[^a-z0-9]+/).filter(Boolean);
  const tTokens = t.split(/[^a-z0-9]+/).filter(Boolean);

  if (qTokens.length === 0) {
    return { matches: true, score: 0 };
  }

  let totalScore = 0;
  let allTokensMatched = true;

  for (const qTok of qTokens) {
    let bestTokenScore = 0;
    let tokenMatched = false;

    for (const tTok of tTokens) {
      // Direct token equality
      if (tTok === qTok) {
        tokenMatched = true;
        bestTokenScore = Math.max(bestTokenScore, 400);
        break;
      }

      // Token prefix or substring
      if (tTok.startsWith(qTok)) {
        tokenMatched = true;
        bestTokenScore = Math.max(bestTokenScore, 300);
        continue;
      }
      if (tTok.includes(qTok)) {
        tokenMatched = true;
        bestTokenScore = Math.max(bestTokenScore, 200);
        continue;
      }

      // Levenshtein edit distance check on tokens
      const lev = levenshteinDistance(qTok, tTok);
      const maxAllowedDistance = qTok.length >= 6 ? 2 : qTok.length >= 3 ? 1 : 0;

      if (lev <= maxAllowedDistance) {
        tokenMatched = true;
        const score = 150 - lev * 30;
        bestTokenScore = Math.max(bestTokenScore, score);
      } else if (tTok.length > qTok.length) {
        // Also check if prefix of target token has low edit distance
        const tSub = tTok.slice(0, qTok.length + 1);
        const subLev = levenshteinDistance(qTok, tSub);
        if (subLev <= maxAllowedDistance) {
          tokenMatched = true;
          const score = 120 - subLev * 30;
          bestTokenScore = Math.max(bestTokenScore, score);
        }
      }
    }

    if (!tokenMatched) {
      allTokensMatched = false;
      break;
    }

    totalScore += bestTokenScore;
  }

  if (allTokensMatched) {
    return { matches: true, score: totalScore };
  }

  // 5. Fallback full string Levenshtein for short single words (e.g. without punctuation)
  if (qTokens.length === 1 && q.length >= 4) {
    // Check against each token directly
    for (const tTok of tTokens) {
      const lev = levenshteinDistance(q, tTok);
      if (lev <= 2) {
        return { matches: true, score: 100 - lev * 25 };
      }
    }
  }

  return { matches: false, score: 0 };
}

/**
 * Filters and ranks items based on fuzzy matching against the extracted key string.
 */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  keyExtractor: (item: T) => string
): T[] {
  if (!query || !query.trim()) {
    return items;
  }

  const scored: { item: T; score: number }[] = [];

  for (const item of items) {
    const key = keyExtractor(item);
    const result = fuzzyMatch(query, key);
    if (result.matches) {
      scored.push({ item, score: result.score });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.item);
}

