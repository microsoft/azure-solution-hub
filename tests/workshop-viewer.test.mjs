import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import helpers from '../docs/assets/js/workshop-data.js';

const source = await readFile(new URL('../docs/assets/js/workshop.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function viewer() {
  const elements = new Map();
  const pending = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', handlers: {},
      addEventListener(event, handler) { this.handlers[event] = handler; },
      querySelectorAll() { return []; },
      scrollIntoView() {},
    });
    return elements.get(id);
  };
  const manifest = '# Fixture\nrepo: https://github.com/test/repo\n\nOverview\n\n## First\nsource: https://raw.example/first.md\n\n## Second\nsource: https://raw.example/second.md';
  vm.runInNewContext(source, {
    URL, URLSearchParams,
    location: { search: '?slug=fixture', href: 'https://site.example/workshop.html?slug=fixture' },
    document: { getElementById: element },
    window: { WorkshopData: helpers, marked: { parse: text => text }, addEventListener() {} },
    fetch: url => url === 'workshops/fixture/index.md'
      ? Promise.resolve({ ok: true, text: async () => manifest })
      : new Promise((resolve, reject) => pending.set(url, { resolve, reject })),
  });
  await flush();
  return {
    element,
    click(key) { element('wsNav').handlers.click({ target: { closest: () => ({ getAttribute: () => key }) } }); },
    async resolve(name, text) {
      pending.get(`https://raw.example/${name}.md`).resolve({ ok: true, text: async () => text });
      await flush();
    },
    async reject(name) { pending.get(`https://raw.example/${name}.md`).reject(new Error('Network')); await flush(); },
  };
}

test('removes only leading frontmatter, including BOM and CRLF', async () => {
  const page = await viewer();
  page.click('0');
  await page.resolve('first', '\uFEFF---\r\ntitle: Lab\r\n---\r\n# Lab\n\n---\nBody');
  assert.equal(page.element('wsContent').innerHTML, '# Lab\n\n---\nBody');
});

test('a late response cannot replace the selected step', async () => {
  const page = await viewer();
  page.click('0');
  page.click('1');
  await page.resolve('second', 'Second');
  await page.resolve('first', 'First');
  assert.equal(page.element('wsContent').innerHTML, 'Second');
});

test('a late error cannot replace the overview', async () => {
  const page = await viewer();
  page.click('0');
  page.click('overview');
  await page.reject('first');
  assert.equal(page.element('wsContent').innerHTML, 'Overview');
});