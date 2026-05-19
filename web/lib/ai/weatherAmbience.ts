/**
 * Client for the calendar worker's /api/ai/weather endpoint.
 *
 * Given the structured weather + time-of-day a campaign currently has,
 * returns 2-3 sentences of evocative scene description from Workers AI.
 *
 * The worker caches identical inputs at the edge for 24h, so repeat
 * renders of the same date are free. The client adds a small in-memory
 * cache per session so re-rendering the same day within a session
 * doesn't even hit the network.
 */

import type { WeatherInfo, TimeOfDayInfo } from '../core/bridge';

export interface WeatherAmbienceArgs {
  weather: WeatherInfo;
  time: TimeOfDayInfo;
  /** Optional cache tag (e.g., campaign id + serial) — folded into the
   *  worker's cache key. Same tag + same weather inputs → same output. */
  cacheTag?: string;
}

interface WireResponse {
  text?: string;
  model?: string;
  error?: string;
}

// Per-session in-memory cache. Bypasses the network for revisits within
// the same tab. Cleared on reload.
const sessionCache = new Map<string, string>();

function cacheKey(args: WeatherAmbienceArgs): string {
  const w = args.weather;
  return [
    w.location,
    w.tempLabel,
    w.precipBand,
    w.windBand,
    w.fogLevel,
    args.time.bucketKey,
    args.cacheTag ?? '',
    w.narrative,
  ].join('|');
}

/**
 * Returns the ambience text for the given weather snapshot, or null
 * if generation isn't available (AI binding missing, network down, etc).
 *
 * The URL is constructed from `import.meta.env.BASE_URL` so it works
 * both when the calendar runs standalone (calendar.mcherry.workers.dev)
 * and when it's reverse-proxied through partybuff.com/calendar/.
 */
export async function fetchWeatherAmbience(
  args: WeatherAmbienceArgs,
): Promise<string | null> {
  if (!args.weather.available) return null;

  const key = cacheKey(args);
  const hit = sessionCache.get(key);
  if (hit) return hit;

  // Parse the bridge's default location label ("A temperate inland plain")
  // back into its parts so the prompt has them separately. Bridge will
  // surface these as structured fields in a later pass; for now we read
  // them off the existing default until a location picker exists.
  const { climate, geography, terrain } = inferLocationParts(args.weather.location);

  const body = {
    locationName: args.weather.location,
    climate,
    geography,
    terrain,
    tempLabel: args.weather.tempLabel,
    precipBand: args.weather.precipBand,
    windBand: args.weather.windBand,
    fogLevel: args.weather.fogLevel,
    narrative: args.weather.narrative,
    timeOfDayBucket: args.time.bucketLabel,
    cacheTag: args.cacheTag,
  };

  const url = `${import.meta.env.BASE_URL}api/ai/weather`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as WireResponse;
    const text = json.text?.trim() ?? '';
    if (!text) return null;
    sessionCache.set(key, text);
    return text;
  } catch {
    return null;
  }
}

/**
 * The bridge currently uses a single canned location ("A temperate inland
 * plain"). When a real location picker lands the bridge will surface
 * climate/geography/terrain directly. Until then, parse the canned label
 * with a best-effort heuristic so the AI prompt still gets useful hints.
 */
function inferLocationParts(label: string): {
  climate?: string;
  geography?: string;
  terrain?: string;
} {
  const lower = label.toLowerCase();
  const climates = ['arctic', 'tundra', 'temperate', 'subtropical', 'tropical', 'desert'];
  const geographies = ['coastal', 'inland', 'maritime', 'highland'];
  const terrains = ['plain', 'plains', 'forest', 'desert', 'mountains', 'hills', 'swamp', 'urban', 'tundra'];
  return {
    climate: climates.find((c) => lower.includes(c)),
    geography: geographies.find((g) => lower.includes(g)),
    terrain: terrains.find((t) => lower.includes(t)),
  };
}
