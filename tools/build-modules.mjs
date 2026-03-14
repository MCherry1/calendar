// build-modules.mjs — Transforms raw calendar.js sections into TypeScript modules.
//
// Strategy:
// 1. Merge related sections into module groups
// 2. Add `export` to all top-level function/var declarations
// 3. Write each module to src/
// 4. Create an index.ts that imports all modules in dependency order
//    and re-exports the public API
//
// Cross-module references are handled by having index.ts import everything
// into a single scope. Each module file can reference other modules'
// exports because esbuild resolves them at bundle time.

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const rawDir = resolve(root, 'src', 'raw');
const srcDir = resolve(root, 'src');

function readRaw(name) {
  return readFileSync(resolve(rawDir, name), 'utf-8');
}

function addExports(code) {
  // Add export to top-level function declarations
  // Match: `function name(` at start of line (not inside closures)
  code = code.replace(/^function\s+(\w+)\s*\(/gm, 'export function $1(');

  // Add export to top-level var declarations
  // Match: `var NAME =` at start of line
  code = code.replace(/^var\s+(\w+)\s*=/gm, 'export var $1 =');

  return code;
}

// Define module groups: merge related raw sections
const moduleGroups = [
  {
    file: 'constants.ts',
    sections: ['constants.ts'],
    header: '// Section 1: Constants\n'
  },
  {
    file: 'state.ts',
    sections: ['state.ts'],
    header: '// Sections 2-3: Default State Factory + State & Settings\n'
  },
  {
    file: 'color.ts',
    sections: ['color.ts'],
    header: '// Section 4: Color Utilities\n'
  },
  {
    file: 'date-math.ts',
    sections: ['date-math.ts'],
    header: '// Section 5: Date / Serial Math\n'
  },
  {
    file: 'parsing.ts',
    sections: ['parsing.ts'],
    header: '// Section 6: Parsing & Fuzzy Matching\n'
  },
  {
    file: 'events.ts',
    sections: ['events.ts', 'range.ts', 'occurrences.ts', 'event-lists.ts'],
    header: '// Sections 7+9+10+12: Events Model + Range Engine + Occurrences + Event Lists\n'
  },
  {
    file: 'rendering.ts',
    sections: ['rendering.ts', 'show-send.ts', 'buttoned.ts'],
    header: '// Sections 8+11+14: Rendering + Show/Send + Buttoned Tables\n'
  },
  {
    file: 'ui.ts',
    sections: ['ui.ts', 'themes.ts', 'gm-buttons.ts'],
    header: '// Sections 13+15+16: Roll20 State Interaction & UI + Themes + GM Buttons\n'
  },
  {
    file: 'commands.ts',
    sections: ['commands.ts'],
    header: '// Section 17: Commands & Routing\n'
  },
  {
    file: 'today.ts',
    sections: ['today.ts'],
    header: '// Today — Combined detail from all subsystems\n'
  },
  {
    file: 'weather.ts',
    sections: ['weather.ts'],
    header: '// Section 18: Weather System\n'
  },
  {
    file: 'boot-register.ts',
    sections: ['boot-19.ts'],
    header: '// Section 19: Boot\n'
  },
  {
    file: 'moon.ts',
    sections: ['moon.ts'],
    header: '// Section 20: Moon System\n'
  },
  {
    file: 'planes.ts',
    sections: ['planes.ts'],
    header: '// Section 21: Planar System\n'
  },
  {
    file: 'init.ts',
    sections: ['init.ts'],
    header: '// Initialization + Test Exports\n'
  },
];

for (const group of moduleGroups) {
  let content = group.header + '\n';
  for (const sec of group.sections) {
    content += readRaw(sec) + '\n\n';
  }
  content = addExports(content);
  writeFileSync(resolve(srcDir, group.file), content, 'utf-8');
  console.log(`Wrote ${group.file}`);
}

console.log('\nModule files written to src/');
console.log('Next step: create index.ts and fix cross-module references');
