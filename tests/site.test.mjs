import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const output = path.resolve('dist');
const html = readFileSync(path.join(output, 'index.html'), 'utf8');
const base = '/portfolio-ci-cd/';

test('production page has useful metadata', () => {
  assert.match(html, /<title>\s*[^<]+<\/title>/i);
  assert.match(html, /name=["']viewport["']/i);
  assert.match(html, /name=["']description["']/i);
});

test('portfolio sections remain available', () => {
  for (const id of ['about', 'skills', 'projects', 'contact']) {
    const pattern = new RegExp(`id=["']${id}["']`, 'i');
    assert.match(html, pattern, `Missing section: ${id}`);
  }
});

test('referenced local files exist in the build', () => {
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(match => match[1]);
  let checked = 0;
  for (const ref of refs) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref)) continue;
    let clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    if (clean.startsWith('/')) {
      assert.ok(clean.startsWith(base), `Wrong base: ${ref}`);
      clean = clean.slice(base.length);
    }
    const target = path.resolve(output, decodeURIComponent(clean));
    assert.ok(target.startsWith(output + path.sep));
    assert.ok(existsSync(target), `Missing asset: ${ref}`);
    checked++;
  }
  assert.ok(checked > 0, 'No local asset references checked');
});