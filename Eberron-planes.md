# Eberron-planes

## Purpose

This file tracks planar-state behavior, UI indicators, and generated-event controls for the calendar system.

---

## Planar state model

Each plane can be in one of these states:

- **Coterminous** (strong influence)
- **Remote** (weak influence)
- **Waxing** (moving toward coterminous)
- **Waning** (moving toward remote)

### UI status encoding

- Green bubble = Coterminous
- Red bubble = Remote
- Up arrow = Waxing
- Down arrow = Waning

---

## Toggle behavior

Two independent controls are required:

1. **Planar system enabled** (master on/off)
2. **Generated planar events enabled** (event generator only)

This allows static planar-state display without forcing auto-generated events.

---

## Manifest-zone integration notes

- Manifest zones are selected separately from location but remain **location-bound**.
- Changing location clears active manifest zones.
- Aryth-full reminder should be visible in moon-aware summary/Today output.

---

## Open implementation items

- [ ] Add dedicated generated-event toggle in state + UI.
- [ ] Ensure plane-state badges/arrows are consistent across all views.
- [ ] Confirm Fernia/Risia effects flow through manifest-zone mechanics, not ad hoc weather-only paths.
