# Handout Folder Refactor

## Overview

Replace the current flat 4-handout system with a structured multi-handout hierarchy. Each moon gets its own handout with cell-fill calendars, each plane gets its own handout, and unified calendars aggregate all entities.

## Roll20 Constraints

1. **Cannot create folders via API.** `Campaign().journalfolder` is read-only. Handouts are created at root level; the GM must drag them into folders once.
2. **Cannot force-open handouts.** Can only send clickable links: `[Open](http://journal.roll20.net/handout/ID)`.
3. **`handout.set('notes', html)` is a server-side async write.** Does not block the browser, but consumes server time.
4. **Handout notes must be set after creation**, not during `createObj`.

## Folder Structure (naming convention)

The script creates handouts with structured names. The GM manually creates folders and drags them in once. The script whispers setup instructions on first init.

```
Journal (manual folders)
├── Calendar/
│   ├── Calendar - Events                          (rolling year of event calendars)
│   ├── Lunar/
│   │   ├── Calendar - Lunar - 0 Unified           (dot-based multi-moon overlay)
│   │   ├── Calendar - Lunar - Olarune             (cell-fill: yellow=full, black=new, purple=eclipse)
│   │   ├── Calendar - Lunar - Therendor
│   │   └── ... (one per moon)
│   ├── Planar/
│   │   ├── Calendar - Planar - 0 Unified          (current planes overlay approach)
│   │   ├── Calendar - Planar - Daanvi
│   │   ├── Calendar - Planar - Fernia
│   │   └── ... (one per plane)
│   ├── Weather/
│   │   └── Calendar - Weather                     (prev 10 days + next 10 days)
│   └── Mechanics/
│       ├── Calendar - Mech - Weather              (weather mechanics reference)
│       ├── Calendar - Mech - Moons                (moon lore reference)
│       ├── Calendar - Mech - Planes               (planar cycle reference)
│       └── Calendar - Mech - Events               (event system guide)
```

Naming rules:
- All start with `Calendar - ` prefix for easy identification
- Subsystem prefix: `Lunar -`, `Planar -`, `Mech -`
- Unified calendars use `0 Unified` to sort first alphabetically
- Individual entity handouts use the entity's canonical name

## Handout Content Specs

### Individual Moon Handouts

**Layout:** Rolling year window (1 prev month, current month, N-2 following)

**Rendering:** Cell fills (NOT dots)
- Yellow (#FFD700) background = full moon day
- Black (#222222) background = new moon day
- Purple (#9575CD) background = eclipse day
- Other days: phase-based grey gradient (existing `_moonPhaseCellColor`)

**Reuse:** `_singleMoonMiniCalEvents(moonName, start, end)` already generates per-day phase events with cell colors. `_singleMoonMiniCalHtml(moonName, serial)` renders a single month. Extend to multi-month rolling window.

**Header:** Colored band with moon name + title (existing pattern from `_singleMoonMiniCalHtml`)

**Text info below calendar:** Current phase, illumination %, next full/new date

### Unified Moon Handout ("0 Unified")

**Layout:** Same rolling year window

**Rendering:** Dot-based overlay (current multi-moon approach)
- Uses `_moonMiniCalEvents()` which produces `dotOnly` events for multi-moon systems
- Existing `moonHandoutHtml()` already does this

**Text info:** Today summary, notable moons, eclipse warnings

### Individual Plane Handouts

**Layout:** Rolling year window (1 prev month, current month, N-2 following)

**Rendering:** Cell fills for phase events
- Coterminous phases: plane-specific color fill
- Remote phases: hatched/dimmed fill (existing `planeFill` + `isRemote` flags)
- Header bars for long-duration events (existing `_planesHeaderBars`)

**Text info:** Current phase, days into phase, days until next transition, effects text

### Unified Planes Handout ("0 Unified")

**Layout:** Current month only (too many overlapping events for multi-month)

**Rendering:** Current `planesHandoutHtml()` approach with synthetic overlay

### Weather Handout

**Layout:** Previous 10 days + next 10 days (20-day window centered on today)

**Rendering:** Weather strip calendar with emoji + temp ranges (existing `_renderWeatherMonthStripWantedDays`)

### Events Handout

**Layout:** Rolling year window (existing `eventsHandoutHtml`)

No changes needed — current implementation already matches spec.

### Mechanics Handouts

**Content:** Static reference text, regenerated only on calendar system change.

- **Weather:** Temperature/wind/precip scales, extreme event types, fog/visibility rules
- **Moons:** Moon lore blurbs, orbital periods, Long Shadows explanation
- **Planes:** Planar cycle explanation, phase effects, canonical vs generated
- **Events:** How to add/remove/restore events, source priority, color system

## Performance: Stale Detection

### The Problem

12 moons + 13 planes + 4 unified + 1 weather + 4 mechanics = ~34 handouts.
Moon high-tier render is ~1.8s/month. Full refresh of everything = 20+ seconds.

### The Solution: Content Hashing

Each handout tracks a **render stamp** (already exists for moon page: `mp.renderStamp`).

```typescript
// State schema
persistentViews.handouts[kind] = {
  id: string,           // Roll20 handout ID
  renderStamp: string,  // hash of inputs that produced last render
  lastRefresh: number   // serial of last refresh
}
```

**Render stamp composition per handout type:**
- Individual moon: `serial:moonName:systemSeed:moonCount`
  - Only changes when: date changes month, moon system reseeded, calendar system changes
- Individual plane: `serial:planeName:overrideHash:anchorHash`
  - Only changes when: date crosses a phase boundary, override set/cleared
- Unified moon: `serial:systemSeed:moonCount:revealTier`
- Unified planes: `serial:overrideHash`
- Weather: `serial:locationHash:forecastHash`
- Events: `serial:eventCount:eventHash`
- Mechanics: `calendarSystem:variant` (almost never changes)

**On date step:**
1. Compute new render stamps for each handout
2. Compare to stored stamps
3. Only call `handout.set('notes', ...)` for changed handouts
4. Typical date step: only weather + any moon/plane crossing a phase = 1-3 handouts

**Batch with setTimeout:**
```typescript
function _refreshHandoutsBatched(kinds) {
  var queue = kinds.slice();
  function next() {
    if (!queue.length) return;
    var kind = queue.shift();
    refreshHandout(kind);
    if (queue.length) setTimeout(next, 50);
  }
  next();
}
```

This yields to the Roll20 event loop between handout writes, preventing any single long block.

## Chat Output Changes

**Current chat stays as-is** (with the minical we just added). Add "Open Handout" buttons that link to the relevant handouts:

```typescript
// Generate handout link button
function handoutButton(label, handoutKind) {
  var id = getHandoutId(handoutKind);
  if (!id) return '';
  return '[' + label + '](http://journal.roll20.net/handout/' + id + ')';
}
```

**Rule:** Chat never whispers more than a single month calendar. Multi-month views go to handouts exclusively. Subsystem panels (moon, weather, planes) add an "Open Handout" button that links to the detailed handout rather than redrawing large content inline.

## State Schema Changes

```typescript
// Extends existing persistentViews state
persistentViews: {
  moonPage: { ... },           // existing moon page state
  handouts: {
    // Existing 4 handouts (backward compatible)
    eventsId: string,
    moonsId: string,
    weatherId: string,
    planesId: string,

    // New individual handouts
    entities: {
      [key: string]: {         // e.g., "lunar-olarune", "planar-daanvi"
        id: string,            // Roll20 handout ID
        renderStamp: string,
        lastRefreshSerial: number
      }
    }
  },
  setupComplete: boolean,      // tracks whether GM has been shown folder instructions
  folderInstructionsDismissed: boolean
}
```

## GM Setup Flow

On first init (or when `setupComplete` is false):

1. Script creates all handouts at journal root
2. Whispers to GM:

```
📁 Calendar Handouts Created

I've created N handouts for your calendar system. For best organization,
create these folders in your Journal tab and drag the handouts in:

□ Calendar/
  □ Lunar/ — drag all "Calendar - Lunar - ..." handouts here
  □ Planar/ — drag all "Calendar - Planar - ..." handouts here
  □ Weather/ — drag "Calendar - Weather" here
  □ Mechanics/ — drag all "Calendar - Mech - ..." handouts here
  □ Keep "Calendar - Events" in the Calendar/ root

[✓ Done — Dismiss This Message](!cal setup dismiss)
```

3. Setup message appears once on init until dismissed

## Migration

- Existing `Calendar - Moons` handout becomes `Calendar - Lunar - 0 Unified`
- Existing `Calendar - Planes` becomes `Calendar - Planar - 0 Unified`
- Existing `Calendar - Weather` and `Calendar - Events` keep their names
- On upgrade: script finds old handouts by stored ID, renames them, creates new individual handouts
- Old IDs in state are migrated to new schema

## Implementation Phases

### Phase 1: Infrastructure
- Refactor `persistent-views.ts` to support dynamic handout registry
- Add render stamp tracking and stale detection
- Add batched refresh with setTimeout
- Add handout link button helper

### Phase 2: Individual Moon Handouts
- Create `_moonIndividualHandoutHtml(moonName)` using rolling year window + cell fills
- Register per-moon handouts in HANDOUT_SPECS dynamically
- Add "Open Handout" link buttons to moon chat panel

### Phase 3: Individual Plane Handouts
- Create `_planeIndividualHandoutHtml(planeName)` using rolling year window
- Register per-plane handouts dynamically
- Add "Open Handout" link buttons to planes chat panel

### Phase 4: Weather + Events Handout Updates
- Weather: change to 10-prev + 10-next day window
- Events: no content changes needed
- Add "Open Handout" link buttons to chat panels

### Phase 5: Mechanics Handouts
- Create static reference content for each subsystem
- Only refresh on calendar system change

### Phase 6: Chat Slimming + GM Setup
- Add "Open Handout" buttons throughout chat UI
- Enforce single-month-max rule for chat output
- Implement GM folder setup instructions on init
- Migration logic for existing installations

## Open Questions

1. Should individual moon handouts show the player reveal tier or always full (GM) detail?
   - Recommendation: Always full detail. Handouts are visible to all but represent the world state.

2. Should the mechanics handouts be editable by GMs (gmnotes for house rules)?
   - Recommendation: Yes. Put canonical content in `notes`, leave `gmnotes` empty for GM additions.

3. What happens when the calendar system changes (e.g., Eberron → Greyhawk)?
   - Moon/plane entity lists change completely. Delete old entity handouts, create new ones.
   - Whisper folder reorganization instructions again.
