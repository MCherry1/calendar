/**
 * Calendar worker entry.
 *
 * Routing model:
 *   1. Normalize the path — strip /calendar prefix if present so internal
 *      routing is uniform whether we're hit standalone
 *      (calendar.mcherry.workers.dev/calendar/...) or proxied through
 *      partybuff.com/calendar/...
 *   2. /api/ai/weather       → POST endpoint for Workers AI ambient narration
 *   3. everything else        → static assets via env.ASSETS.fetch, with
 *                               the wrangler.toml SPA fallback handling
 *                               client-side routes
 */

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIBinding {
  run(
    model: string,
    options: { messages: AIMessage[]; max_tokens?: number; temperature?: number },
  ): Promise<{ response?: string } | unknown>;
}

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  AI?: AIBinding;
}

const PREFIX = '/calendar';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ── Path normalization: collapse standalone + proxied forms ──
    let path = url.pathname;
    if (path === '/' || path === '' || path === PREFIX) {
      return Response.redirect(new URL(`${PREFIX}/`, url).toString(), 308);
    }
    if (path.startsWith(`${PREFIX}/`)) {
      path = path.slice(PREFIX.length) || '/';
    }

    // ── API routes ──
    if (path === '/api/ai/weather') {
      return handleWeatherAi(request, env);
    }

    // ── Static asset fallback ──
    const rewritten = new URL(path + url.search, url);
    return env.ASSETS.fetch(new Request(rewritten, request));
  },
};

// ────────────────────────────────────────────────────────────────────
// Weather ambience endpoint
// ────────────────────────────────────────────────────────────────────

interface WeatherAmbienceInput {
  locationName: string;
  climate?: string;
  geography?: string;
  terrain?: string;
  tempLabel: string;
  precipBand?: number;
  windBand?: number;
  fogLevel?: string;
  narrative: string;
  timeOfDayBucket: string;
  /** When set, used as part of the cache key so the same date+location
   *  produces the same ambience across re-renders. Optional. */
  cacheTag?: string;
}

const AMBIENCE_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const AMBIENCE_SYSTEM = `You are a tabletop RPG atmosphere writer. Given a weather snapshot, time of day, and broad location type, write 2-3 sentences of sensory atmosphere that COMPLEMENT (do not repeat) the mechanical weather summary.

Hard constraints:
- Focus on universally-observable sensations: sky, air quality, light, temperature on skin, distant sounds, smell, mood.
- DO NOT describe specific terrain features. You do not know the party's exact location. No roads, no trails, no buildings, no settlements, no trees, no rivers, no specific structures or landmarks. The party could be camped in a forest, on a road, indoors, or beside a lake — the description must work for any of those.
- DO NOT repeat the mechanical summary verbatim. Add a sensory layer the summary doesn't already have.
- No metagame language. Describe the scene impersonally — no "you", no "your", no addressing players.
- Match the time of day naturally (dawn light differs from midnight).
- Output ONLY the description itself. No preamble, no meta-commentary, no quotation marks, no labels.`;

async function handleWeatherAi(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('method_not_allowed', 405);
  }
  if (!env.AI) {
    return jsonError('ai_binding_unavailable', 503);
  }

  let body: WeatherAmbienceInput;
  try {
    body = (await request.json()) as WeatherAmbienceInput;
  } catch {
    return jsonError('invalid_json', 400);
  }

  // Soft validation — return a useful 400 for missing fields rather than a
  // generic server error from inside the AI call.
  if (!body || typeof body.locationName !== 'string' || !body.locationName.trim()) {
    return jsonError('missing_location', 400);
  }
  if (typeof body.tempLabel !== 'string' || !body.tempLabel.trim()) {
    return jsonError('missing_temp_label', 400);
  }
  if (typeof body.timeOfDayBucket !== 'string' || !body.timeOfDayBucket.trim()) {
    return jsonError('missing_time_of_day', 400);
  }

  // Cache: deterministic input → identical output is the whole point. Use
  // the platform Cache API (free, edge-local) keyed by a SHA-256 of the
  // normalized input. 24h TTL — long enough to feel free, short enough
  // that we can iterate the prompt without users being stuck on old text.
  const cacheKey = await buildCacheKey(body);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    const clone = new Response(cached.body, cached);
    clone.headers.set('x-pb-cache', 'HIT');
    return clone;
  }

  // Call Workers AI
  const userPrompt = buildUserPrompt(body);
  let text = '';
  try {
    const result = (await env.AI.run(AMBIENCE_MODEL, {
      messages: [
        { role: 'system', content: AMBIENCE_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 220,
      temperature: 0.75,
    })) as { response?: string };
    text = String(result.response ?? '').trim();
  } catch (err) {
    return jsonError('ai_call_failed', 502, { detail: (err as Error).message });
  }

  if (!text) {
    return jsonError('ai_empty_response', 502);
  }

  const response = new Response(
    JSON.stringify({ text, model: AMBIENCE_MODEL, cache: 'MISS' }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=86400',
        'x-pb-cache': 'MISS',
      },
    },
  );
  // Cache API requires the response to have a cacheable status + cache-control.
  // Fire-and-forget the cache write; don't make the user wait on it.
  cache.put(cacheKey, response.clone()).catch(() => {
    /* cache write failure is non-fatal */
  });
  return response;
}

function buildUserPrompt(c: WeatherAmbienceInput): string {
  const lines: string[] = [];
  lines.push(`Location: ${c.locationName}`);
  const setting = [c.climate, c.geography, c.terrain].filter(Boolean).join(', ');
  if (setting) lines.push(`Setting: ${setting}`);
  lines.push(`Time of day: ${c.timeOfDayBucket}`);
  lines.push(`Temperature: ${c.tempLabel}`);
  if (typeof c.precipBand === 'number' && c.precipBand > 0) {
    lines.push(`Precipitation intensity: ${c.precipBand} of 5`);
  }
  if (typeof c.windBand === 'number' && c.windBand > 0) {
    lines.push(`Wind intensity: ${c.windBand} of 5`);
  }
  if (c.fogLevel && c.fogLevel !== 'none') {
    lines.push(`Fog: ${c.fogLevel}`);
  }
  if (c.narrative) lines.push(`Mechanical summary: ${c.narrative}`);
  return lines.join('\n');
}

async function buildCacheKey(body: WeatherAmbienceInput): Promise<Request> {
  // Normalize input to a stable string before hashing so insignificant
  // differences (key ordering, irrelevant fields) don't bust the cache.
  const normalized = JSON.stringify({
    loc: body.locationName,
    cli: body.climate ?? '',
    geo: body.geography ?? '',
    ter: body.terrain ?? '',
    t: body.tempLabel,
    p: body.precipBand ?? 0,
    w: body.windBand ?? 0,
    f: body.fogLevel ?? 'none',
    tod: body.timeOfDayBucket,
    nar: body.narrative ?? '',
    tag: body.cacheTag ?? '',
  });
  const buf = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  // The cache key URL is synthetic — Cache API just hashes it; the host
  // doesn't have to resolve to anything real.
  return new Request(`https://pb-cache.invalid/ai/weather/${hex}`);
}

function jsonError(
  code: string,
  status: number,
  extra: Record<string, unknown> = {},
): Response {
  return new Response(JSON.stringify({ error: code, ...extra }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
