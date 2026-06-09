// scripts/build-html.mjs
// Usage: node scripts/build-html.mjs
// Reads index.template.html + partials/*.html, writes index.html

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function build() {
  let template = readFileSync(join(root, 'index.template.html'), 'utf8');

  const partials = {
    'pane-promotion': 'partials/pane-promotion.html',
    'pane-map-prompt': 'partials/pane-map-prompt.html',
    'pane-slide-document': 'partials/pane-slide-document.html',
  };

  for (const [name, relPath] of Object.entries(partials)) {
    const marker = `  <!-- @@PARTIAL:${name}@@ -->`;
    const content = readFileSync(join(root, relPath), 'utf8').trimEnd();
    template = template.replace(marker, content);
  }

  // Strip the build-template comment header (lines before <!DOCTYPE)
  const doctypeIdx = template.indexOf('<!DOCTYPE');
  if (doctypeIdx > 0) {
    template = template.slice(doctypeIdx);
  }

  writeFileSync(join(root, 'index.html'), template, 'utf8');
  console.log('index.html built successfully.');
}

build();
