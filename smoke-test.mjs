import { JSDOM } from 'jsdom';
import fs from 'node:fs';

const scriptSrc = fs.readFileSync('./dist/release-history-viewer.js', 'utf8');

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'https://facetsdemo.console.facets.cloud/'
});

const { window } = dom;

window.onerror = (msg, src, line, col, err) => {
  console.error('WINDOW ONERROR:', msg, 'line', line, 'col', col);
  if (err && err.stack) console.error(err.stack);
};

try {
  const scriptEl = window.document.createElement('script');
  scriptEl.textContent = scriptSrc;
  window.document.body.appendChild(scriptEl);
} catch (e) {
  console.error('SYNC THROW WHILE APPENDING SCRIPT:', e);
}

setTimeout(() => {
  const defined = window.customElements.get('release-history-viewer');
  console.log('customElements.get("release-history-viewer") ->', defined ? 'DEFINED (' + defined.name + ')' : 'UNDEFINED');
  process.exit(defined ? 0 : 1);
}, 500);
