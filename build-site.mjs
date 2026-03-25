import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'esbuild';

var root = resolve('.');
var distDir = resolve(root, 'dist-site');
var assetsDir = resolve(distDir, 'assets');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(assetsDir, { recursive: true });

await build({
  entryPoints: [resolve(root, 'site/main.ts')],
  bundle: true,
  format: 'esm',
  outfile: resolve(assetsDir, 'main.js'),
  platform: 'browser',
  target: ['es2020'],
  sourcemap: false,
  minify: false
});

writeFileSync(resolve(distDir, 'index.html'), readFileSync(resolve(root, 'site/index.html')));
writeFileSync(resolve(assetsDir, 'styles.css'), readFileSync(resolve(root, 'site/styles.css')));

// Copy standalone pages
var extraPages = ['style-samples.html'];
for (var page of extraPages) {
  var src = resolve(root, 'site', page);
  if (existsSync(src)) writeFileSync(resolve(distDir, page), readFileSync(src));
}

console.log('Built showcase site in ' + distDir);
