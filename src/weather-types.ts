/* ============================================================================
 * Weather System — Core Type Definitions
 * ==========================================================================*/

/** A single trait formula produced by _composeFormula. */
export interface TraitFormula {
  base: number;
  die: number;
  min: number;
  max: number;
}

/** Full day formula for all three traits plus the arc multiplier. */
export interface DayFormula {
  temp: TraitFormula;
  wind: TraitFormula;
  precip: TraitFormula;
  arcMult: number;
}

/** Resolved trait values for a single period or the daily summary. */
export interface PeriodValues {
  temp: number;
  wind: number;
  precip: number;
}

/** A weather location descriptor. */
export interface WeatherLocation {
  name?: string;
  climate: string;
  geography: string;
  terrain: string;
  sig?: string;
}

/** Visibility descriptor returned by _deriveConditions. */
export interface VisibilityInfo {
  tier: 'none' | 'A' | 'B' | 'C';
  beyond: number | null;
}

/** Categorized mechanics from _deriveConditions. */
export interface WeatherMechanics {
  visibility: string[];
  movement: string[];
  combat: string[];
  exposure: string[];
  other: string[];
}

/** Full derived conditions object returned by _deriveConditions. */
export interface DerivedConditions {
  precipType: string;
  fog: string;
  visibility: VisibilityInfo;
  difficultTerrain: boolean;
  mechanics: WeatherMechanics;
}
