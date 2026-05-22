# Calendar Web App — Interactive Design

Design document for turning the calendar from a *non-interactive preview* into
the genuinely interactive tool of Party Buff.

## Status and scope

This builds on `party-buff/docs/CAMPAIGN-SETTINGS-AND-CALENDAR.md` ("the
settings doc"). That doc is **accepted** — it owns the campaign-settings
contract, the world-as-single-source decision, the date-as-headline /
month-ribbon / demoted-year-grid layout, and the player/DM view-edit split at
the *page-layout* level. This document does **not** re-litigate any of that.

This document covers the part the settings doc explicitly deferred: the
*interactive system* underneath that layout — the full Roll20 feature
inventory, the gap against today's preview web app, and the design for
exploration, player-private notes, per-viewer layer control, the GM-only
layer, the two-role model, and the data model.

Two D&D roles only: **player** and **GM** (the membership table's `dm`/`co_dm`
both map to "GM"; `viewer` maps to a more restricted "player" — see §5). A
player is promotable to GM by the campaign owner. Players never mutate shared
state.

---

## Part 1 — Roll20 script feature inventory

The Roll20 API script (`src/*.ts`, bundled to `calendar.js`) is the real
engine. It is a chat-command tool: a GM types `!cal …` and the script whispers
HTML panels back. Everything below *works today in Roll20* and is the
authoritative list of what "interactive" means for this tool.

### 1.1 Core date engine
- A serial-day model (`date-math.ts`): every date is an integer day-count from
  a world epoch. All systems are pure functions of a serial.
- Multi-world calendars (`worlds/`): Eberron, Faerûn/Harptos, Greyhawk,
  Exandria, Dragonlance, Mystara, Birthright, Gregorian — each with its own
  month count, month lengths, weekday count, intercalary/festival days, leap
  rules, era label, and canonical "current" date.
- Smart date parsing (`parsing.ts`): natural-language date specs ("next month",
  "3rd Far of Sypheros", ordinal-weekday like "first Sul of Olarune").
- Time-of-day (`time-of-day.ts`): six buckets (Middle of Night → Nighttime),
  hour-of-day, a seasonal sunrise/sunset table, and daylight status per serial.

### 1.2 Events subsystem (`events.ts`)
- Holiday/event database, seeded per world from default-event source packs;
  per-source enable/suppress; per-event color.
- Recurrence: fixed month/day, year-specific one-offs, "all months", and
  **ordinal-weekday** rules (first/second/.../last/every weekday of a month).
- Range queries: occurrences in any serial range; month and year renders with
  event dots; event lists for arbitrary ranges.
- A GM can add, remove, recolor, and suppress events.

### 1.3 Moon / lunar subsystem (`moon.ts`, ~5,000 lines — the largest system)
- Per-world moon sets (Eberron has 12 moons), each with synodic period,
  semi-major axis, eccentricity, inclination, ascending node, color, lore.
- Phase at any serial: illuminated fraction, waxing/waning, phase label;
  calibrated full/new thresholds; aggregate night-light intensity.
- **Eclipse system** (DESIGN §7.8): true-disk solar eclipses, lunar
  eclipses/occultations (moon behind another moon), classified Total / Partial
  / Transit by apparent-disk overlap, timed to the day-buckets, grouped across
  midnight.
- **Long Shadows** (Eberron): the new-moon-near-midwinter mechanic that
  "claims" moons and forces them dark; cross-coupled to the Mabar plane.
- Sky position: altitude, azimuth, 16-point compass, sky-position category at a
  given time of day.
- GM phase anchors: a GM can pin a named moon's full/new to a date; festival
  nudges and plane pulls retime peaks.
- Plane coupling: each moon is associated with a plane (Therendor/Barrakas
  anti-phase coupling).

### 1.4 Planar subsystem (`planes.ts`, ~2,900 lines)
- Per-world plane sets (Eberron has 13 planes), each cyclic or fixed.
- Cyclic planes orbit coterminous → neutral → remote → neutral with computed
  phase from anchor date + cycle parameters; per-phase mechanical effects text.
- "Moontied" generated shifts: short off-cycle conjunctions driven by
  associated-moon full/new (Dolurrh ↔ Aryth).
- Generated-event forecasting with deterministic seeds.
- GM phase overrides.

### 1.5 Weather subsystem (`weather.ts`, ~4,200 lines — the second largest)
- Deterministic, seeded weather: temperature (banded °F), wind (0–5),
  precipitation (0–5), fog, snow accumulation, derived narrative conditions.
- Location model: climate × geography × terrain, plus manifest-zone weather
  shifts; per-day-period (time-of-day) breakdowns.
- 10-day forecast lifecycle with history retention; extreme-event evaluation;
  D&D 5e mechanical effects (heat/armor rules etc.).
- Cross-system: Zarantyr (moon) influences weather; planar phases shift weather.

### 1.6 The Three-Tier Knowledge System (DESIGN §4) — the script's signature feature
Every predictive subsystem (weather, moon, planes) has **reveal tiers**:
- `low` = Common Knowledge (obvious, observable)
- `medium` = Skilled Forecast (skill/training)
- `high` = Expert Forecast (divination-grade)

Reveals are stored per-serial, **upgrade-only**, and gate how far into the
future and how precisely a player may see. This is the in-fiction "your party
rolled a Survival check, here's a 3-day forecast" mechanic. It is distinct from
the GM/Player *view toggle* (which is about GM lore vs. player-safe text). See
§6 for how this maps to the web app — it is the single most important
Roll20-only concept the preview app has dropped.

### 1.7 GM/Player view modes and panels
- Per-subsystem GM vs. player panels; a verbose/terse display mode toggle.
- "Today" combined panel aggregating every subsystem for the current date.
- Player-facing "minical" month strips with moon dots and event dots.

### 1.8 Persistent views (`persistent-views.ts`) — **Roll20-platform-specific**
- Live-updating Roll20 *handout* objects (lunar/planar/weather/events) and a
  bound Roll20 *page* that redraws moon phases. Uses `createObj`, the Roll20
  `state` bag, page/token objects.
- **Currently disabled** in the script (`HANDOUTS_TEMPORARILY_DISABLED = true`)
  in favor of editable Markdown in `Handouts/`.
- This entire module is Roll20-VTT plumbing. It does **not** port. Its *intent*
  — "an always-current shared reference players can glance at" — is delivered
  natively by the web app being a live page. See §7.

### 1.9 Setup / onboarding (`setup.ts`)
- A draft-based onboarding wizard: pick calendar system, season set, color
  theme, starting date, event sources. Stored in `state.setup`.
- In Party Buff this is **superseded** by the campaign-creation + world-package
  flow in the settings doc. It does not port as-is.

### 1.10 Other
- Color theming, contrast math (`color.ts`).
- Season sets; festival strips (Harptos).
- Deterministic seeds (`In Depth Design Information/Deterministic Seeds.md`):
  weather and planar generation are reproducible from a seed string — important
  for the data model (§8).

---

## Part 2 — Gap: Roll20 engine vs. today's preview web app

The web app (`web/`) wraps the engine through `web/lib/core/bridge.ts` and
renders React. The bridge is a clean, typed seam and is the right foundation.
But the app is a **preview**: it reads the engine and renders *one* state. What
is missing:

| Capability | Roll20 | Preview web app | Gap |
|---|---|---|---|
| View current date / moons / weather / planes / events | ✅ | ✅ (`TodayCard`, `bridge`) | none — bridge already wraps all five |
| Year-at-a-glance month grids | ✅ | ✅ (`getMonthGrid`/`getYearGrid`, `MonthCard`) | none |
| Roam to arbitrary past/future dates | ✅ (`!cal … on <date>`) | ⚠️ year-nav only, no date inspection | **exploration** — §4 |
| Eclipses surfaced in UI | ✅ | ❌ bridge does not expose eclipse data | **add bridge call** — §3, §6 |
| Three-tier reveal / forecast knowledge | ✅ | ❌ entirely absent | **biggest gap** — §6.3 |
| Layer toggles actually wired | partial (display modes) | ❌ `LayerToggleBar` half-built; 3 of 5 toggles `enabled:false` | **finish + redesign** — §6 |
| Advance the shared date / hour | ✅ (`!cal set`, `step`) | ❌ no advance controls at all | **GM advance bar** — §5 (layout in settings doc §2.4) |
| GM phase anchors / plane overrides | ✅ | ❌ | **GM tools** — §7.4 (later phase) |
| Per-event add/remove/recolor (GM) | ✅ | ❌ | **GM event editing** — §7 |
| Player-private notes & events | ❌ (Roll20 has no such thing) | ❌ | **net-new feature** — §4.2 |
| GM-only hidden events/dates | partial (whispered to GM) | ❌ | **GM layer** — §7 |
| Always-current shared reference | ✅ (handouts) | ✅ implicitly (it's a live page) | handouts don't port; intent met natively |
| Per-viewer state (each player sees their own thing) | ❌ (one Roll20 `state`) | ❌ (one shared blob) | **architecture gap** — §8 |

The headline finding: the preview app treats the calendar as **one document
everyone sees identically**. The interactive app must treat it as **one shared
spine plus many per-viewer overlays** (layer choices, private notes, knowledge
tier). That reframing drives Parts 4–8.

---

## Part 3 — Architecture: shared spine + per-viewer overlays

Three data planes, by *who owns them* and *who sees them*:

1. **Shared campaign state** — the date everyone is on, GM-authored party
   events, the world/anchors/seeds. One per campaign. Only a GM writes it.
2. **GM-only layer** — events/notes a GM places that only GMs see. Stored with
   the shared campaign but visibility-gated.
3. **Per-viewer personal layer** — each user's private notes/events, their
   layer-toggle choices, their knowledge tier, their view preferences. One per
   `(user, campaign)`. The user owns it; nobody else reads it.

Everything the user *sees* on a given day is the **composition** of: the shared
spine + (if GM) the GM layer + their own personal layer, filtered by their
active layer toggles. The engine (`bridge.ts`) computes the deterministic
systems (moons/weather/planes/eclipses) from the world + serial; the three data
planes supply events and notes on top.

Bridge work this requires (small, additive — the seam is already good):
- `getEclipsesToday(worldId, serial)` and an eclipse field on month-grid cells
  — the engine has the data; the bridge just doesn't export it yet.
- A `revealTier` parameter threaded into the weather/moon/plane bridge calls so
  the engine's existing tier logic drives what the UI may show (§6.3).
- `getPlanesToday` already exists; ensure it carries `daysUntilNextPhase` for
  the "what's coming" exploration affordance.

---

## Part 4 — Exploration (players roam freely)

Players are *encouraged* to explore. Exploration is **read-only on shared
state** and unrestricted in time.

### 4.1 Roaming
- The month ribbon (settings doc §2.3, Zone 2) and the Year view (Zone 3) are
  the roaming surface. Stepping the ribbon or paging the year **never** touches
  `calendar_state` — it changes a local `viewSerial` only. The campaign's real
  "today" stays put and stays outlined.
- **Clicking any day opens a Day Detail panel** (a popover or side sheet) for
  that date: the full set of systems for that serial — date label, weekday,
  moons + phases, eclipses, planar phases, weather, events, and the viewer's
  own notes. This is the `TodayCard` content, parameterized by an arbitrary
  serial instead of only the campaign serial. For a player this is pure
  inspection; for a GM the same panel grows a "Set as current date" action
  (settings doc §2.4, recommended preview-on-click / commit-on-confirm).
- A **"jump to date"** control (date picker honoring the world's calendar
  structure) so a player can inspect a distant festival without clicking
  through months. A **"back to today"** affordance always returns the view to
  the campaign's real current date.
- Roaming respels the known core limitation (settings doc §2.6, `bridge.ts`):
  moon-sequence generation has iteration caps far from epoch. Until the core
  fix lands, the Day Detail panel must degrade gracefully — if moon data is
  empty, show "Lunar data unavailable this far from the present" rather than a
  blank or a fake 50%-illumination moon.

### 4.2 Player-private notes & events (net-new — Roll20 has nothing here)
Players may annotate *any* date with their **own** notes and events. These are:
- **Private by default** — visible only to the authoring player. They never
  appear on the shared party calendar and never clutter another viewer's view.
- **Free-form**: a note is `{ id, serial, title, body, color, kind }` where
  `kind ∈ {note, event}`. `event` kind shows as a dot on the ribbon/grid (in
  the author's view only); `note` is text-only.
- **Editable by the author** anywhere in time — past or future. A player
  planning "we should be in Sharn by Olarune 12" can pin that themselves.
- Stored in the **personal layer** (§8.2), keyed `(user, campaign)`. Switching
  campaigns shows that campaign's personal notes; nobody else's API can read
  them.
- Surfaced via a `notes` layer toggle (§6) so a player can hide their own
  annotations too.

**Deliberately deferred — sharing.** A player marking a personal note "share
with the party" (promoting it into shared state) is a natural extension but
introduces a write path from players into shared data, which the two-role model
forbids. Recommendation: ship private-only first; if sharing is wanted, model
it as "player proposes, GM accepts" (a GM-gated inbox), never a direct player
write. Open question for the owner (§9).

---

## Part 5 — Roles: player vs. GM

Two roles. Map the existing membership table: `dm` + `co_dm` → **GM**;
`player` → **player**; `viewer` → **player, further restricted** (read-only,
knowledge tier forced to player-safe, may still keep private notes — a viewer
is "a player who isn't at the table"). Promotion (player → GM) is the campaign
owner's action on the existing `CampaignManage` roster; the calendar just reads
the resolved role.

| Action | Player | GM |
|---|---|---|
| View date, ribbon, year, every system | ✅ | ✅ |
| Roam past/future, open Day Detail | ✅ | ✅ |
| Toggle their own layers | ✅ | ✅ |
| Set their own knowledge tier | ✅ (capped — §6.3) | ✅ |
| Add/edit their **private** notes & events | ✅ | ✅ |
| Advance / set the shared campaign date & hour | ❌ | ✅ |
| Add/edit **shared party** events | ❌ | ✅ |
| Add/edit **GM-only** events & notes | ❌ | ✅ |
| GM moon anchors / plane overrides | ❌ | ✅ |
| Change world / anchors / seeds | ❌ (settings doc: owner-only) | ✅ owner/GM via Campaign Settings |

**Two separate axes — keep them separate** (settings doc §2.7 #4 confirms):
1. **Role** (player/GM) — an *edit-permission* gate. Drives whether the advance
   bar and shared/GM editing surfaces exist.
2. **Knowledge tier** (low/medium/high) — an *in-fiction information* gate
   (§6.3). A GM previewing "what my players see" lowers the tier; that does not
   strip their advance controls.

The read-only player UI is a convenience, not a security boundary. **Server-side
write gating is mandatory** — see §8.4. This is the must-fix bug the settings
doc already flagged (§1.7 #2): today *any* member can PATCH `calendar_state`.

---

## Part 6 — Per-viewer view filters / layer toggles

The Roll20 calendar's central failure was **information overload**: 12 moons,
13 planes, weather, eclipses, events, all rendered at once, made the output
unreadable. Per-viewer layer control is the fix and must be designed as a
first-class feature, not an afterthought toggle bar.

### 6.1 The layer set
Each layer is independently toggleable, per viewer, persisted per device:

- **Events** — shared party events (+ GM-only events when the viewer is a GM).
- **My notes** — the viewer's personal notes/events (§4.2).
- **Lunar phases** — full/new peaks as glyphs on grid cells.
- **Moons (detail)** — per-moon phase rows in Day Detail / hero block.
- **Eclipses** — eclipse markers (new bridge data, §3).
- **Planar conjunctions** — coterminous/remote markers and plane rows.
- **Weather** — weather summary + (optionally) a temperature heat tint on cells.

This is a superset of today's `LayerPrefs` (which has `weather`, `events`,
`lunarPhases`, `planarPhases`, `birthdays`). Rename/extend: drop `birthdays`
(it depended on an entity-graph integration that isn't in scope), split
lunar into "phase glyphs" vs. "moon detail", add `eclipses` and `myNotes`.

### 6.2 Designing against overload — beyond on/off
Plain on/off toggles are necessary but not sufficient; with 12 moons even
"lunar on" can overload. Layered defenses:

1. **Sane defaults, not everything-on.** A fresh viewer sees Events, My notes,
   Lunar phases, Weather **on**; Eclipses and Planar **off**. The owner picks
   the world default per the world package, but the *viewer's* personal
   default leans quiet. Overload is the failure mode — bias toward quiet.
2. **Density-aware rendering.** On the small ribbon months and the year grid,
   layers render as **at most one glyph per category per cell** ("a moon
   peaks", "an eclipse happens", "≥1 event") — never one glyph per moon. The
   *count* and the *detail* live in Day Detail, which the user opts into by
   clicking. The big current-month grid may show slightly more; Day Detail
   shows everything. Progressive disclosure by zoom level.
3. **Focus subjects.** For worlds with many moons/planes, let the viewer pick a
   *subset* to track ("I only care about Aryth and Sypheros"). Stored in the
   personal layer as `focusedMoons` / `focusedPlanes`; empty = all. This is the
   real antidote to 12-moon overload — most players care about one or two.
4. **Layer presets.** Two or three named presets the viewer can one-click:
   *"Just the date"* (events + notes only), *"Player"* (sensible middle),
   *"Everything"* (all layers, focus cleared). Presets make it cheap to recover
   from an overloaded view.
5. **Toggle bar placement.** The toggle bar is a compact, collapsible strip
   near the ribbon — not a wall of buttons. It shows which layers are on at a
   glance and collapses to a single "Layers (4)" chip when not in use.

### 6.3 Knowledge tier as a layer-adjacent control
The three-tier system (§1.6) is *not* a layer — it is an orthogonal control,
but it belongs in the same UI cluster because it also governs "how much do I
see." Design:
- A small **tier selector** (Common / Skilled / Expert) per viewer, persisted
  in the personal layer.
- It feeds the `revealTier` bridge parameter (§3). At `low`, forecasts past
  ~2 days for moons / today+forecast-window for weather are shown as
  uncertainty bands or hidden, exactly as the engine already computes.
- **Capping.** A player must not be able to self-grant Expert knowledge of the
  future and metagame. So: a **player's tier is capped by a campaign setting
  the GM controls** (e.g. "players may forecast up to: Skilled"). Within the
  cap the player chooses freely; a GM is uncapped. Default cap: Skilled.
  This preserves the in-fiction mechanic without a Roll20-style per-roll grant,
  while keeping the GM in charge of metagame exposure. Open question (§9):
  does the owner want the richer "GM grants a reveal after a check" flow, or is
  a static per-campaign cap enough? Recommendation: ship the cap; the
  grant-flow is a later enhancement.

### 6.4 Why per-viewer and not per-campaign
Layer choices, focus subjects, and tier are **personal preferences** — they are
not table-shared, switching campaigns must not reset them, and one player's
choices must never affect another's view. This matches the settings doc's
two-tier rule (§1.6 of that doc) exactly: personal prefs live per-user,
per-device. See §8.2/§8.3 for whether "per-device" should become "per-user".

---

## Part 7 — The GM-only hidden layer

GMs can place events and notes that **only GMs see** — a coup planned three
weeks out, an NPC's secret birthday, "the cult attacks here."

- Same shape as a shared event, plus `visibility: 'gm'`. The `entity` table
  already has a `visibility` column with exactly `{dm, all}` — reuse it.
- GM-only items render on the ribbon/grid/Day Detail **only when the viewer's
  resolved role is GM**. They are filtered server-side out of any payload sent
  to a player — never sent then hidden in the client.
- A GM gets a clear visual distinction (e.g. a dashed/locked marker, a "GM"
  tag) so they can tell at a glance which items their players can also see.
- The GM/Player *view toggle* (settings doc §2.4) lets a GM flip their own view
  to "what players see" — which simply drops the GM layer from the composition
  for that session. This is a client-side preview only; it does not change
  permissions.

GM editing surfaces (shared events, GM-only events, moon anchors, plane
overrides) are a **later phase** — they are the Roll20 `!cal moon full …` /
`!cal events add …` commands re-homed as forms. They are listed here for
completeness and to make sure the data model (§8) leaves room for them, but the
first interactive release can ship with: roam + Day Detail + private notes +
layers + the advance bar, and treat shared/GM event *editing* as fast-follow.

Note on handouts (§1.8): the Roll20 persistent-views/handout machinery does
**not** port. Its purpose — an always-current shared reference — is met simply
by the web app being a live, shared page. Drop the concept; do not recreate
handouts.

---

## Part 8 — Data model assessment

**Recommendation: modernize. Do not carry the Roll20 `state` model into the
browser as the persistence shape.** Keep the Roll20 *engine* (it is excellent,
deterministic, well-tested); discard the Roll20 *state container* as a
persistence design.

### 8.1 What the Roll20 `state` model is, and why it doesn't fit
The Roll20 script keeps one giant mutable `state.CALENDAR` object: calendar
config, every event, weather records + per-serial reveals + history, moon
sequences, planar overrides, persistent-view bookkeeping, setup drafts. It is:
- **Single-tenant** — one campaign per sandbox. The bridge already documents
  this as a caveat (`bridge.ts`: "only one campaign can be active per page
  load"; the engine reads a global `state`).
- **Single-viewer** — there is exactly one `state`; "what the GM sees" vs.
  "what a player sees" is computed at *render* time, never stored per user.
- **Mutation-heavy and unbounded** — weather history, reveal logs and moon
  sequences accrete; the script has explicit pruning code. That is fine for a
  long-lived sandbox; it is wrong for a JSON blob synced over HTTP.
- **Roll20-platform-coupled** — `persistent-views.ts` stores Roll20 object ids;
  `setup.ts` stores a wizard draft. Neither is meaningful in Party Buff.

The owner is right not to want Roll20-era legacy. The `state` *shape* is legacy.

### 8.2 What the browser app should persist — three stores, by owner

The transport stays as the settings doc decided: the per-campaign
`/api/campaigns/:id/state/:key` endpoint. The change is **what blobs exist**.

1. **`calendar_state`** (shared, GM-writable) — the spine. Keep it **minimal
   and fast-moving**: `{ currentSerial, currentHour }` plus the GM moon
   anchors / plane overrides map. Note `worldId` and `viewMode` should leave
   this blob: `worldId` is owned by `campaign_settings.world` (settings doc
   §1.5); `viewMode` is a personal preference, not shared state. This blob is
   PATCHed every scene by the GM, so it must stay tiny.

2. **`campaign_events`** (shared + GM-only, GM-writable) — a **new** allow-list
   key, OR (better) actual `entity` rows of `type: 'calendar_event'`. The
   entity table is purpose-built for this: per-row `visibility: 'dm' | 'all'`
   gives the GM-only layer (§7) for free, rows are individually
   queryable/indexable (`idx_entity_campaign_type`), and a campaign can have
   hundreds of events without bloating a single blob. **Recommendation: use
   `entity` rows, not a blob.** This is the cleanest modernization and it is
   already supported by the schema — no migration needed.

3. **Personal layer** (per-`(user, campaign)`, the owning user writes it) —
   the viewer's private notes/events (§4.2), layer toggles, focus subjects,
   knowledge tier, `viewMode`. **This has no home today.** Options:
   - (a) localStorage, per device — what the preview app does for `LayerPrefs`.
     Simple, zero server work, but private notes would not roam across the
     user's devices and would be lost on cache-clear. Acceptable for *toggles*;
     **not** acceptable for *notes* (notes are content, users expect them to
     persist).
   - (b) a server-side per-user-per-campaign store. The cleanest model: either
     `entity` rows of `type: 'personal_note'` with an `ownerUserId`-style
     scoping, or a new `user_campaign_state` table / blob keyed
     `(userId, campaignId)`.
   - **Recommendation:** notes go server-side (option b) so they roam and
     survive; pure UI toggles (layers, focus, tier, viewMode) stay localStorage
     (option a) per the settings doc's personal-prefs rule. Split by *whether
     it is content or a preference*: content persists server-side, preferences
     stay local. The entity table can host the notes — `type:
     'personal_note'`, scoped to the user — which avoids a new table.

   **Caveat — entity rows have no per-user owner column.** The `entity` table
   keys content to a *campaign*, not a *user*; its `visibility` is only
   `{dm, all}`. Personal notes need a third visibility ("owner only") and an
   owner reference. This is the one real schema gap. Cheapest fix: add an
   `ownerUserId` (nullable) column to `entity` and a `'private'` visibility
   value, with the worker enforcing that `'private'` rows are only ever served
   to their `ownerUserId`. Flagged as an open question (§9) — it is a schema
   migration and wants the owner's sign-off.

### 8.3 Per-device vs. per-user preferences
The settings doc keeps personal prefs in localStorage (per device). For
*toggles* that is fine. But knowledge tier and focus subjects feel like they
should follow the *user* across devices. Recommendation: keep them local for
v1 (consistent with the settings doc, zero server cost); if cross-device
roaming is wanted later, the home is a `user_prefs` blob keyed by user — out of
scope here, same conclusion the settings doc reached.

### 8.4 Server-side enforcement (must-fix)
The data model only holds up if the worker enforces it — the client UI is not
the boundary:
- `calendar_state` and `campaign_events` PATCH/writes: **GM-gated**
  (`canManage`-style check on membership role). Today any member can PATCH —
  this is the bug from settings doc §1.7 #2.
- GM-only (`visibility: 'dm'`) events: filtered out of any response to a
  non-GM. Never "send then hide".
- Personal notes (`'private'` rows): served only to their owner; writable only
  by their owner; a GM cannot read them either.
- Knowledge-tier cap: the *cap* lives in `campaign_settings` (GM-owned); the
  client should not be trusted to honor it for anything that gates
  future-information payloads — if a forecast endpoint is ever added, it
  enforces the cap server-side.

### 8.5 Keep the engine, lift it off the global
The engine's determinism (seeded weather/planar, pure serial→phase functions)
is a strength — it means the server stores almost nothing for moons/weather/
planes: just the world, the anchors, and the seeds (`campaign_settings.calendar`
already carries `weatherSeed`). Everything else is recomputed. That is the
*right* model for a browser app and is the opposite of the Roll20 accreting
`state`. The one engineering debt to schedule: `bridge.ts` notes the engine
still reads a **global `state`**, which blocks more than one campaign per page
load. For the calendar that is tolerable (one campaign open at a time), but the
multi-tenant move — passing campaign context explicitly instead of through a
global — should be on the roadmap, and the moon-sequence iteration caps
(§4.1) should be fixed with closed-form cycle arithmetic so roaming far from
epoch works.

---

## Part 9 — Open questions for the owner

1. **Private-note sharing.** Ship private-only (recommended), or also let a
   player promote a note to the shared party calendar via a GM-accepted inbox?
   Direct player→shared writes are off the table; "propose, GM accepts" is the
   only sharing model compatible with two roles.
2. **Knowledge-tier model.** Is a static per-campaign tier *cap* (GM sets
   "players may forecast up to Skilled") enough, or does the owner want the
   full Roll20 flow where a GM grants a specific reveal after a skill check?
   Recommendation: cap now, grant-flow later.
3. **`entity` schema for personal notes.** Adding an `ownerUserId` column and a
   `'private'` visibility value to the `entity` table is a migration. Approve
   that, or keep personal notes in localStorage for v1 (and accept they don't
   roam across devices / survive a cache clear)?
4. **Events: blob vs. entity rows.** Recommendation is to store calendar events
   as `entity` rows (`type: 'calendar_event'`) rather than inside a JSON blob —
   it gives the GM-only layer for free and scales. Confirm the owner is happy
   moving events off the Roll20-style "all events in one object" model.
5. **GM editing scope for v1.** Recommendation: first interactive release ships
   roam + Day Detail + private notes + layers + advance bar; shared/GM event
   *editing* and moon-anchor/plane-override tools are fast-follow. Confirm that
   phasing.
6. **`viewer` role.** Confirm a `viewer` is "a read-only player who may still
   keep private notes," with knowledge tier forced to the player cap.
7. **Focus subjects in UI.** Per-viewer moon/plane focus subsets (§6.2 #3) are
   the strongest overload fix for many-moon worlds. Confirm this is worth the
   UI surface, or whether layer on/off + density-aware rendering is enough for
   v1.

---

## Summary of decisions

- **Engine: keep. State container: modernize.** The Roll20 serial-date engine
  (moons, eclipses, weather, planes, events, deterministic seeds) is the
  asset and is already cleanly wrapped by `bridge.ts`. The Roll20 single-tenant,
  single-viewer, accreting `state` bag is *not* a persistence design — discard
  the shape, not the math.
- **Three data planes:** shared campaign spine (GM-writable), GM-only layer
  (GM-writable, visibility-gated), per-viewer personal layer (the user's own).
  Every view is a composition of these three, filtered by the viewer's layers.
- **Exploration is read-only and unrestricted in time.** Roaming changes a
  local `viewSerial`, never `calendar_state`. Clicking any day opens a Day
  Detail panel (the `TodayCard` parameterized by an arbitrary serial).
- **Player-private notes & events** are net-new, stored server-side
  (recommended) so they roam, scoped to `(user, campaign)`, never shown to
  anyone else.
- **Layer control is a first-class anti-overload system:** quiet defaults,
  density-aware one-glyph-per-category rendering, per-viewer focus subsets,
  one-click presets — not just on/off buttons.
- **Knowledge tier** (Roll20's three-tier system) is preserved as an
  orthogonal per-viewer control, capped for players by a GM-owned campaign
  setting.
- **GM-only hidden layer** reuses the `entity` table's `visibility` column;
  filtered server-side.
- **Two roles, server-enforced.** Players never write shared state; the
  read-only UI is convenience, the worker is the boundary. Must-fix: gate
  `calendar_state` writes to GMs.
- **Calendar events → `entity` rows**, not a JSON blob — scales and gives the
  GM-only layer for free.
