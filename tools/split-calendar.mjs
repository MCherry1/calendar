// Mechanical splitter: reads calendar.js and writes each section to a separate file.
// This is a one-time migration tool.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const src = resolve(root, 'src');

const lines = readFileSync(resolve(root, 'calendar.js'), 'utf-8').split('\n');

// Define section boundaries (line numbers are 1-based from the file)
const sections = [
  // config.ts is already extracted manually
  { name: 'constants',  start: 368, end: 660,   file: 'constants.ts' },
  { name: 'state',      start: 661, end: 1228,  file: 'state.ts' },     // sections 2+3
  { name: 'color',      start: 1229, end: 1356, file: 'color.ts' },     // section 4
  { name: 'date-math',  start: 1357, end: 1583, file: 'date-math.ts' }, // section 5
  { name: 'parsing',    start: 1584, end: 1846, file: 'parsing.ts' },   // section 6
  { name: 'events',     start: 1847, end: 2048, file: 'events.ts' },    // section 7 only
  { name: 'rendering',  start: 2049, end: 2526, file: 'rendering.ts' }, // section 8
  { name: 'range',      start: 2527, end: 2768, file: 'range.ts' },     // section 9
  { name: 'occurrences',start: 2769, end: 3073, file: 'occurrences.ts' },// section 10
  { name: 'show-send',  start: 3074, end: 3145, file: 'show-send.ts' }, // section 11
  { name: 'event-lists',start: 3146, end: 3193, file: 'event-lists.ts' },// section 12
  { name: 'ui',         start: 3194, end: 3878, file: 'ui.ts' },        // section 13
  { name: 'buttoned',   start: 3879, end: 4143, file: 'buttoned.ts' },  // section 14
  { name: 'themes',     start: 4144, end: 4187, file: 'themes.ts' },    // section 15
  { name: 'gm-buttons', start: 4188, end: 4684, file: 'gm-buttons.ts' },// section 16
  { name: 'commands',   start: 4685, end: 4854, file: 'commands.ts' },  // section 17
  { name: 'today',      start: 4855, end: 5584, file: 'today.ts' },     // today view
  { name: 'weather',    start: 5585, end: 8933, file: 'weather.ts' },   // section 18
  { name: 'boot-19',    start: 8934, end: 8954, file: 'boot-19.ts' },   // section 19
  { name: 'moon',       start: 8955, end: 12544, file: 'moon.ts' },     // section 20
  { name: 'planes',     start: 12545, end: 14038, file: 'planes.ts' },  // section 21
  { name: 'init',       start: 14039, end: 14195, file: 'init.ts' },    // initialization + test exports
];

for (const sec of sections) {
  // lines array is 0-based, section line numbers are 1-based
  const content = lines.slice(sec.start - 1, sec.end).join('\n');
  const outPath = resolve(src, 'raw', sec.file);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, content + '\n', 'utf-8');
  console.log(`Wrote ${sec.file} (${sec.end - sec.start + 1} lines)`);
}

console.log('\nDone. Raw sections written to src/raw/');
