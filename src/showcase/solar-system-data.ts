// Standalone moon orbital data for the showcase site.
// Duplicates the essential data from moon.ts to avoid importing
// Roll20-dependent modules that esbuild cannot bundle for the browser.

export type MoonOrbitalInfo = {
  name: string;
  color: string;
  diameter: number;       // miles
  avgOrbitalDistance: number;  // miles from planet
};

// Source: EBERRON_MOON_CORE_DATA in moon.ts
// Matches the Keith Baker Dragonshards "Moons of Eberron" article.
var EBERRON_MOONS: MoonOrbitalInfo[] = [
  { name: 'Zarantyr',  color: '#F5F5FA', diameter: 1250, avgOrbitalDistance: 14300 },
  { name: 'Olarune',   color: '#FFC68A', diameter: 1000, avgOrbitalDistance: 18000 },
  { name: 'Therendor', color: '#D3D3D3', diameter: 1100, avgOrbitalDistance: 39000 },
  { name: 'Eyre',      color: '#C0C0C0', diameter: 1200, avgOrbitalDistance: 52000 },
  { name: 'Dravago',   color: '#E6E6FA', diameter: 2000, avgOrbitalDistance: 77500 },
  { name: 'Nymm',      color: '#FFD96B', diameter: 900,  avgOrbitalDistance: 95000 },
  { name: 'Lharvion',  color: '#F5F5F5', diameter: 1350, avgOrbitalDistance: 125000 },
  { name: 'Barrakas',  color: '#F0F8FF', diameter: 1500, avgOrbitalDistance: 144000 },
  { name: 'Rhaan',     color: '#9AC0FF', diameter: 800,  avgOrbitalDistance: 168000 },
  { name: 'Sypheros',  color: '#696969', diameter: 1100, avgOrbitalDistance: 183000 },
  { name: 'Aryth',     color: '#FF4500', diameter: 1300, avgOrbitalDistance: 195000 },
  { name: 'Vult',      color: '#A9A9A9', diameter: 1800, avgOrbitalDistance: 252000 }
];

export function getMoonOrbitalData(worldId: string): MoonOrbitalInfo[] {
  if (worldId === 'eberron') return EBERRON_MOONS;
  return [];
}
