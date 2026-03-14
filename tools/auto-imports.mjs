// auto-imports.mjs — Scans TypeScript modules in src/ and auto-generates
// import statements based on cross-module symbol references.
//
// For each module:
// 1. Finds all exported symbols (function/var declarations with export)
// 2. Finds all symbol references in other modules
// 3. Adds import { ... } from './module' at the top

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'src');

// Modules to process (in dependency order)
const moduleFiles = [
  'config.ts',
  'constants.ts',
  'state.ts',
  'color.ts',
  'date-math.ts',
  'parsing.ts',
  'events.ts',
  'rendering.ts',
  'ui.ts',
  'commands.ts',
  'today.ts',
  'weather.ts',
  'boot-register.ts',
  'moon.ts',
  'planes.ts',
  'init.ts',
];

// Step 1: Build symbol registry - what each module exports
const registry = {}; // { symbolName: 'module-file.ts' }
const moduleExports = {}; // { 'module.ts': Set<string> }

for (const file of moduleFiles) {
  const content = readFileSync(resolve(srcDir, file), 'utf-8');
  const exports = new Set();

  // Match: export function name(
  for (const m of content.matchAll(/^export\s+function\s+(\w+)\s*\(/gm)) {
    exports.add(m[1]);
  }
  // Match: export var name =
  for (const m of content.matchAll(/^export\s+var\s+(\w+)\s*=/gm)) {
    exports.add(m[1]);
  }

  moduleExports[file] = exports;
  for (const sym of exports) {
    if (!registry[sym]) registry[sym] = file;
    // If duplicate, keep first (config takes precedence)
  }
}

console.log('Symbol registry built:');
for (const [file, exports] of Object.entries(moduleExports)) {
  console.log(`  ${file}: ${exports.size} exports`);
}

// Step 2: For each module, find references to symbols from other modules
for (const file of moduleFiles) {
  const filePath = resolve(srcDir, file);
  let content = readFileSync(filePath, 'utf-8');
  const ownExports = moduleExports[file];

  // Find all identifier references in this module
  // We use a simple word-boundary regex approach
  const neededImports = {}; // { 'other-module.ts': Set<string> }

  for (const [sym, sourceFile] of Object.entries(registry)) {
    if (sourceFile === file) continue; // Don't import own exports
    if (ownExports.has(sym)) continue; // Don't import if we define it

    // Check if this symbol is referenced in the file
    // Use word-boundary matching to avoid false positives
    const regex = new RegExp(`\\b${sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (regex.test(content)) {
      if (!neededImports[sourceFile]) neededImports[sourceFile] = new Set();
      neededImports[sourceFile].add(sym);
    }
  }

  // Step 3: Generate import statements
  if (Object.keys(neededImports).length === 0) continue;

  const importLines = [];
  for (const [sourceFile, symbols] of Object.entries(neededImports)) {
    const modName = './' + sourceFile.replace(/\.ts$/, '.js');
    const syms = [...symbols].sort().join(', ');
    importLines.push(`import { ${syms} } from '${modName}';`);
  }

  // Remove any existing import lines (in case we run this multiple times)
  content = content.replace(/^import\s+\{[^}]+\}\s+from\s+'[^']+';?\s*\n/gm, '');

  // Add imports at the top (after any header comment)
  const headerMatch = content.match(/^(\/\/[^\n]*\n)*/);
  const headerEnd = headerMatch ? headerMatch[0].length : 0;
  const before = content.slice(0, headerEnd);
  const after = content.slice(headerEnd);

  content = before + importLines.join('\n') + '\n\n' + after;

  writeFileSync(filePath, content, 'utf-8');
  console.log(`\nAdded imports to ${file}:`);
  for (const line of importLines) {
    console.log(`  ${line}`);
  }
}

console.log('\nDone. Import statements added to all modules.');
