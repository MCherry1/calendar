// Build script: bundles TypeScript source into a single calendar.js
// matching the original IIFE pattern for Roll20 compatibility.

import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'iife',
  globalName: 'Calendar',
  outfile: 'calendar.js',
  target: 'es2020',
  // Roll20 uses var-style globals
  define: {},
  // Keep readable output (Roll20 users may inspect/edit)
  minify: false,
  // Add the header comment
  banner: {
    js: [
      '// Calendar',
      '// By Matthew Cherry (github.com/mcherry1/calendar)',
      '// Roll20 API script',
      '// Call `!cal` to start.',
      '//',
      '// ⚠ AUTO-GENERATED — do not edit directly.',
      '// Edit TypeScript source in src/ and run: npm run build',
    ].join('\n'),
  },
});

console.log('Built calendar.js');
