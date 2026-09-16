import assert from 'node:assert/strict';
import test from 'node:test';
import { dump, load } from 'js-yaml';
import { readFile, mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyzeStandard, parseManifest, renderStandard, validateMetadata } from '../scripts/workshop-standard.mjs';
import data from '../docs/assets/js/workshop-data.js';
import { analyzeRepo, ensureFolderLine, ensureSitemap, main, parseContentsOrder, parseIncluded } from '../scripts/standardize-workshops.mjs';

const metadata = { type: 'workshop', title: 'Workshop (Code)', description: 'A workshop', level: 'beginner', authors: ['Author'], contacts: ['@author'], duration_minutes: 30, tags: ['foundry'], language: 'ko', execution: ['local'], status: 'active', source: 'original', last_updated: '2026-09-16', validated_on: null };
const document = (values, body) => `---\n${dump(values)}---\n${body}`;
const lab = title => document({ title, duration_minutes: 15, last_updated: '2026-09-16' }, '# Lab\n\n## 개요\nIntro');

async function analyze(prefix = '', extra = {}) {
  const paths = [`${prefix}02-second/README.md`, `${prefix}01-first/README.md`];
  const contents = new Map([[paths[0], lab('Second')], [paths[1], lab('First')], ['shared-assets/README.md', '# Not a lab']]);
  const readme = document(metadata, `# Workshop\n\n## 개요\nIntroduction\n\n## 워크샵 학습 경로\n### Group 1\n| Lab |\n| --- |\n| [Second](${paths[0]}) |\n\n### Group 2\n| Lab |\n| --- |\n| [First](${paths[1]}) |\n`);
  return analyzeStandard({ readme, files: new Set(contents.keys()), read: async path => contents.get(path), repoUrl: 'https://github.com/owner/repo', ref: 'main', sha: 'a'.repeat(40), ...extra });
}

for (const prefix of ['', 'labs/']) test(`reads all learning path tables in declared order: ${prefix || 'root'}`, async () => {
  const model = await analyze(prefix);
  assert.deepEqual(model.steps.map(step => step.title), ['Second', 'First']);
  assert.ok(model.steps.every(step => step.source.includes('/' + 'a'.repeat(40) + '/')));
  const roundtrip = parseManifest(renderStandard({ ...model, repoUrl: 'https://github.com/owner/repo' }));
  assert.equal(roundtrip.metadata.title, 'Workshop (Code)');
  assert.equal(roundtrip.steps.length, 2);
  assert.ok(roundtrip.overview.includes('Introduction'));
});

test('rejects malformed metadata and missing learning path files', async () => {
  for (const change of [{ duration_minutes: '30' }, { validated_on: undefined }, { validated_on: '2026-02-30' }, { execution: ['shell'] }, { level: 'L200' }]) assert.throws(() => validateMetadata({ ...metadata, ...change }));
  await assert.rejects(analyze('', { files: new Set() }), /Missing file/);
  await assert.rejects(analyze('', { readme: document(metadata, '# Workshop\n\n## 개요\nIntro') }), /learning path/);
});

test('keeps legacy manifests and code fences intact', () => {
  const model = parseManifest('# Legacy\nrepo: https://github.com/owner/repo\n\nIntro\n```md\n## Not a step\n```\n\n## Step\nsource: https://raw.example/lab.md\nDescription');
  assert.equal(model.metadata, null);
  assert.equal(model.steps.length, 1);
  assert.deepEqual(model.steps[0].desc, ['Description']);
});

test('distinguishes missing verification from stale verification', () => {
  const now = new Date('2026-09-16T00:00:00Z');
  assert.ok(data.metadataBadges(metadata, now).includes('검증일 미등록'));
  assert.ok(!data.metadataBadges({ ...metadata, validated_on: '2026-08-12' }, now).includes('재검증 필요'));
  assert.ok(data.metadataBadges({ ...metadata, validated_on: '2026-01-01' }, now).includes('재검증 필요'));
});

test('handles legacy Contents at EOF and multiple new registrations', () => {
  assert.deepEqual(parseContentsOrder('# Title\n## Contents\n1. Setup\n2. Run\n'), ['Setup', 'Run']);
  let text = '## Category\n' + ['First', 'Second', 'Third', 'Fourth'].map(title => `\n### ${title}\nincluded: true\nhttps://github.com/owner/${title}\n`).join('');
  for (const item of parseIncluded(text).reverse()) text = ensureFolderLine(text, item, item.title.toLowerCase());
  assert.deepEqual(parseIncluded(text).map(item => item.folder), ['first', 'second', 'third', 'fourth']);
});

test('updates sitemap dates only when content changes', () => {
  const xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://microsoft.github.io/azure-solution-hub/workshop.html?slug=example</loc><lastmod>2020-01-01</lastmod></url></urlset>';
  assert.equal(ensureSitemap(xml, 'example'), xml);
  assert.ok(!ensureSitemap(xml, 'example', true).includes('2020-01-01'));
  assert.ok(ensureSitemap(xml, 'new').includes('slug=new'));
});

test('rejects private repositories before fetching their content', async () => {
  let requests = 0;
  await assert.rejects(analyzeRepo('owner', 'private', { fetcher: async () => {
    requests++;
    return { ok: true, json: async () => ({ private: true, visibility: 'private' }) };
  } }), /공개 리포/);
  assert.equal(requests, 1);
});

test('routes registered Markdown internally and notebooks to GitHub', async () => {
  const analyzed = await analyze();
  const model = { ...analyzed, repo: 'https://github.com/owner/repo' };
  const base = model.steps[0].source;
  assert.equal(data.resolveLink('../01-first/README.md#verify', base, model).key, '1');
  assert.equal(data.resolveLink('../README.md', base, model).key, 'overview');
  assert.equal(data.resolveLink('https://github.com/owner/repo/blob/main/01-first/README.md', base, model).key, '1');
  assert.equal(data.resolveLink('run.ipynb', base, model).href, `https://github.com/owner/repo/blob/${'a'.repeat(40)}/02-second/run.ipynb`);
  assert.equal(data.resolveLink('#verify', base, model).href, '#verify');
  assert.equal(data.resolveLink('https://example.com/reference', base, model).external, true);
});

test('preserves generation/commit and upload/deploy workflow responsibilities', async () => {
  const standardize = load(await readFile(new URL('../.github/workflows/standardize-workshops.yml', import.meta.url), 'utf8'));
  const deploy = load(await readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8'));
  assert.ok(standardize.on.push.paths.includes('docs/workshops/workshops.md'));
  assert.ok('workflow_dispatch' in standardize.on);
  assert.equal(standardize.permissions.contents, 'write');
  assert.ok(standardize.jobs.standardize.steps.some(step => step.run?.includes('git push')));
  assert.deepEqual(deploy.on.push.branches, ['main']);
  assert.ok('workflow_dispatch' in deploy.on);
  assert.deepEqual(deploy.on.workflow_run.workflows, [standardize.name]);
  assert.deepEqual(deploy.on.workflow_run.branches, ['main']);
  assert.ok(deploy.jobs.deploy.if.includes("conclusion == 'success'"));
  assert.ok(!deploy.jobs.deploy.steps.some(step => step.run?.includes('npm')));
  assert.ok(deploy.jobs.deploy.steps[0].with.ref.includes("'main'"));
  assert.ok(deploy.jobs.deploy.steps[0].with.ref.includes('github.sha'));
});

test('collects split steps without duplicating lab frontmatter', async () => {
  const path = 'labs/01-first/README.md';
  const child = 'labs/01-first/01-run.md';
  const readme = document(metadata, `# Workshop\n\n## 개요\nIntro\n\n## 워크샵 학습 경로\n| Lab |\n| --- |\n| [First](${path}) |`);
  const contents = new Map([
    [path, lab('First') + '\n\n## 학습 단계\n| Step |\n| --- |\n| [Run](01-run.md) |'],
    [child, '# Run\n\nInstructions\n\n[Previous](README.md)'],
  ]);
  const options = { readme, files: new Set(contents.keys()), read: async key => contents.get(key), repoUrl: 'https://github.com/owner/repo', ref: 'main', sha: 'a'.repeat(40) };
  const model = await analyzeStandard(options);
  assert.deepEqual(model.steps.map(step => step.id), [path, child]);
  assert.equal(model.steps[1].parent, path);
  contents.set(child, lab('Invalid child'));
  await assert.rejects(analyzeStandard(options), /must not repeat frontmatter/);
});

async function sandbox(context, invalid = false) {
  const root = await mkdtemp(join(tmpdir(), 'workshop-tests-'));
  context.after(() => rm(root, { recursive: true, force: true }));
  const docs = join(root, 'docs');
  await mkdir(join(docs, 'workshops', 'legacy'), { recursive: true });
  const registration = '# Workshops\n\n## AI\n\n### Legacy\nincluded: true\nfolder: legacy\nhttps://github.com/owner/legacy\n\n### Standard\nincluded: true\nhttps://github.com/owner/standard\n' + (invalid ? '\n### Private\nincluded: true\nhttps://github.com/owner/private\n' : '');
  await writeFile(join(docs, 'workshops', 'workshops.md'), registration);
  await writeFile(join(docs, 'workshops', 'legacy', 'index.md'), '# Legacy\nrepo: https://github.com/owner/legacy\n\nHandwritten overview\n\n## Lab\nsource: https://example.com/lab.md\n');
  await writeFile(join(docs, 'sitemap.xml'), '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  await writeFile(join(docs, 'llms.txt'), '# Site\n\n## Hands-on Workshops\n');
  const contents = new Map([
    ['README.md', document(metadata, '# Workshop\n\n## 개요\nIntro\n\n## 워크샵 학습 경로\n| Lab |\n| --- |\n| [First](01-first/README.md) |')],
    ['01-first/README.md', lab('First')],
  ]);
  const fetcher = async url => {
    if (url.includes('/legacy')) throw new Error('Manual manifest must not be fetched');
    const result = url.endsWith('/private') ? { private: true, visibility: 'private' }
      : url.includes('/git/trees/') ? { tree: [...contents.keys()].map(path => ({ type: 'blob', path })) }
      : url.includes('/commits/') ? { sha: 'a'.repeat(40) }
      : { private: false, visibility: 'public', default_branch: 'main' };
    return { ok: true, json: async () => result, text: async () => contents.get(url.split('/' + 'a'.repeat(40) + '/')[1]) };
  };
  return { root, docs, registration, fetcher };
}

test('regeneration is idempotent and leaves manual content untouched', async context => {
  const options = await sandbox(context);
  const files = ['workshops/workshops.md', 'workshops/legacy/index.md', 'workshops/standard/index.md', 'workshops/catalog.json', 'sitemap.xml', 'llms.txt'];
  const manual = await readFile(join(options.docs, files[1]), 'utf8');
  await main(options);
  const before = await Promise.all(files.map(path => readFile(join(options.docs, path), 'utf8')));
  await main(options);
  assert.deepEqual(await Promise.all(files.map(path => readFile(join(options.docs, path), 'utf8'))), before);
  assert.equal(before[1], manual);
  assert.equal(JSON.parse(before[3]).workshops.length, 1);
});

test('a later repository failure prevents all generated writes', async context => {
  const options = await sandbox(context, true);
  await assert.rejects(main(options), /공개 리포/);
  assert.equal(await readFile(join(options.docs, 'workshops/workshops.md'), 'utf8'), options.registration);
  await assert.rejects(access(join(options.docs, 'workshops/standard/index.md')));
  await assert.rejects(access(join(options.docs, 'workshops/catalog.json')));
});