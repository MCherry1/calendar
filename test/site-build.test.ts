import { describe, it } from 'node:test';
import { ok as assert } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

describe('Showcase Site Build', () => {
  it('builds dist-site with the expected sections', () => {
    execFileSync('node', ['build-site.mjs'], {
      cwd: repoRoot,
      stdio: 'pipe'
    });

    const html = readFileSync(resolve(repoRoot, 'dist-site/index.html'), 'utf8');
    const js = readFileSync(resolve(repoRoot, 'dist-site/assets/main.js'), 'utf8');
    const css = readFileSync(resolve(repoRoot, 'dist-site/assets/styles.css'), 'utf8');

    assert(html.includes('Animated Hero Sky'));
    assert(html.includes('calendar-gallery'));
    assert(html.includes('Copy Scene URL'));
    assert(js.includes('buildSkyScene'));
    assert(css.includes('.calendar-gallery'));
    assert(css.includes('.hero-panel'));
  });
});
