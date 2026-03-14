// find-missing-imports.mjs — Finds symbols referenced but not imported/defined in each module.
// Uses esbuild's error output to identify missing references.

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'src');

const moduleFiles = [
  'config.ts', 'constants.ts', 'state.ts', 'color.ts', 'date-math.ts',
  'parsing.ts', 'events.ts', 'rendering.ts', 'ui.ts', 'commands.ts',
  'today.ts', 'weather.ts', 'boot-register.ts', 'moon.ts', 'planes.ts', 'init.ts',
];

// Step 1: Build symbol registry
const registry = {}; // symbolName -> first file that exports it
for (const file of moduleFiles) {
  const content = readFileSync(resolve(srcDir, file), 'utf-8');
  for (const m of content.matchAll(/^export\s+(?:function|var)\s+(\w+)/gm)) {
    if (!registry[m[1]]) registry[m[1]] = file;
  }
}

// Step 2: For each module, find ALL identifier references and check if they're
// defined locally (exported from this file) or imported
for (const file of moduleFiles) {
  const filePath = resolve(srcDir, file);
  let content = readFileSync(filePath, 'utf-8');

  // Get locally defined symbols
  const localDefs = new Set();
  for (const m of content.matchAll(/^export\s+(?:function|var)\s+(\w+)/gm)) {
    localDefs.add(m[1]);
  }
  // Also count non-exported function/var defs
  for (const m of content.matchAll(/^(?:function|var)\s+(\w+)/gm)) {
    localDefs.add(m[1]);
  }

  // Get imported symbols
  const imported = new Set();
  for (const m of content.matchAll(/import\s+\{([^}]+)\}\s+from/g)) {
    for (const sym of m[1].split(',')) {
      imported.add(sym.trim());
    }
  }

  // Find missing: referenced in code, exists in registry, not local, not imported
  const missing = {};
  for (const [sym, sourceFile] of Object.entries(registry)) {
    if (sourceFile === file) continue;
    if (localDefs.has(sym)) continue;
    if (imported.has(sym)) continue;

    // Check if symbol is actually used (word boundary, not in string/comment)
    const regex = new RegExp(`(?<![.'"])\\b${sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');

    // Simple check: is it used outside of import statements and comments?
    const codeLines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('import ') && !trimmed.startsWith('//') && !trimmed.startsWith('*');
    }).join('\n');

    if (regex.test(codeLines)) {
      if (!missing[sourceFile]) missing[sourceFile] = [];
      missing[sourceFile].push(sym);
    }
  }

  if (Object.keys(missing).length === 0) continue;

  // Add missing imports
  const existingImports = {};
  const importRegex = /^import\s+\{([^}]+)\}\s+from\s+'([^']+)';?\s*$/gm;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const from = match[2];
    existingImports[from] = {
      symbols: new Set(match[1].split(',').map(s => s.trim())),
      fullMatch: match[0]
    };
  }

  let modified = false;
  for (const [sourceFile, syms] of Object.entries(missing)) {
    const modPath = './' + sourceFile.replace(/\.ts$/, '.js');
    if (existingImports[modPath]) {
      // Add to existing import
      const existing = existingImports[modPath];
      for (const sym of syms) existing.symbols.add(sym);
      const newImport = `import { ${[...existing.symbols].sort().join(', ')} } from '${modPath}';`;
      content = content.replace(existing.fullMatch, newImport);
      existing.fullMatch = newImport;
      modified = true;
    } else {
      // Add new import line
      const newImport = `import { ${syms.sort().join(', ')} } from '${modPath}';`;
      // Insert after existing imports
      const lastImportIdx = content.lastIndexOf('import {');
      if (lastImportIdx >= 0) {
        const lineEnd = content.indexOf('\n', lastImportIdx);
        content = content.slice(0, lineEnd + 1) + newImport + '\n' + content.slice(lineEnd + 1);
      } else {
        // No imports yet, add at start (after header comment)
        const headerMatch = content.match(/^(\/\/[^\n]*\n)*/);
        const pos = headerMatch ? headerMatch[0].length : 0;
        content = content.slice(0, pos) + newImport + '\n' + content.slice(pos);
      }
      modified = true;
    }
    console.log(`  ${file} += { ${syms.join(', ')} } from ${sourceFile}`);
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
  }
}

console.log('\nDone fixing missing imports.');
