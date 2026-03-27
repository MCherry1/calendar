import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

describe('Showcase DOM contract', () => {
  it('keeps required #id hooks in index.html for every _must() call in site/main.ts', () => {
    const mainSource = readFileSync('site/main.ts', 'utf8');
    const indexHtml = readFileSync('site/index.html', 'utf8');

    const mustIds = Array.from(mainSource.matchAll(/_must<[^>]+>\('([^']+)'\)/g)).map((m) => m[1]);
    const htmlIds = new Set(Array.from(indexHtml.matchAll(/\sid="([^"]+)"/g)).map((m) => m[1]));

    const missing = mustIds.filter((id) => !htmlIds.has(id));

    assert.equal(
      missing.length,
      0,
      `site/main.ts requires missing element id(s): ${missing.join(', ')}`
    );
  });
});
