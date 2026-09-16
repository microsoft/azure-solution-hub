(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WorkshopData = api;
})(typeof window === 'object' ? window : globalThis, function () {
  function stripFrontmatter(text) {
    return String(text || '').replace(/^\uFEFF?---[ \t]*\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/, '');
  }

  function parseManifest(text) {
    const model = { title: '', repo: '', metadata: null, overview: '', steps: [] };
    const overview = [];
    let current = null;
    let fence = '';
    for (const line of text.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/)) {
      const trimmed = line.trim();
      const marker = trimmed.match(/^(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = '';
        (current ? current.desc : overview).push(line);
        continue;
      }
      if (!fence) {
        if (!current && /^#\s+/.test(trimmed)) { model.title = trimmed.slice(2).trim(); continue; }
        const heading = trimmed.match(/^##\s+(.+)$/);
        if (heading) {
          current = { title: heading[1], source: '', desc: [] };
          model.steps.push(current);
          continue;
        }
        if (!current && /^repo\s*:/i.test(trimmed)) { model.repo = trimmed.slice(trimmed.indexOf(':') + 1).trim(); continue; }
        if (!current && /^metadata\s*:/i.test(trimmed)) {
          model.metadata = JSON.parse(trimmed.slice(trimmed.indexOf(':') + 1));
          if (model.metadata.schema_version !== 2) throw new Error('Unsupported workshop manifest version');
          continue;
        }
        if (current && /^source\s*:/i.test(trimmed)) { current.source = trimmed.slice(trimmed.indexOf(':') + 1).trim(); continue; }
        if (current && /^step\s*:/i.test(trimmed)) {
          const metadata = JSON.parse(trimmed.slice(trimmed.indexOf(':') + 1));
          current.id = metadata.id;
          current.parent = metadata.parent || '';
          current.duration_minutes = metadata.duration_minutes;
          current.notebooks = metadata.notebooks || [];
          continue;
        }
      }
      (current ? current.desc : overview).push(line);
    }
    model.overview = overview.join('\n').trim();
    return model;
  }

  function metadataBadges(metadata, now = new Date()) {
    const levels = { beginner: '입문', intermediate: '중급', advanced: '고급' };
    const execution = { codespaces: 'Codespaces', local: '로컬', portal: 'Portal' };
    const badges = [levels[metadata.level], `${metadata.duration_minutes}분`, ...(metadata.execution || []).map(value => execution[value])].filter(Boolean);
    if (!metadata.validated_on) badges.push('검증일 미등록');
    else {
      badges.push(`검증 ${metadata.validated_on}`);
      if ((now.getTime() - Date.parse(`${metadata.validated_on}T00:00:00Z`)) / 86400000 > 90) badges.push('재검증 필요');
    }
    if (metadata.status === 'draft') badges.push('초안');
    if (metadata.status === 'archived') badges.push('보관됨');
    return badges;
  }

  let catalogPromise;
  function loadCatalog() {
    if (!catalogPromise) catalogPromise = fetch('workshops/catalog.json', { cache: 'no-cache' })
      .then(response => response.ok ? response.json() : null)
      .then(data => data && data.schema_version === 1 && Array.isArray(data.workshops) ? data.workshops : [])
      .catch(() => []);
    return catalogPromise;
  }

  function findMetadata(catalog, folder, repo) {
    return catalog.find(item => item.slug === folder && item.repo === repo)?.metadata || null;
  }

  function resolveLink(href, baseUrl, model) {
    if (href.startsWith('#')) return { href };
    const root = baseUrl.match(/^(https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/)/)?.[1];
    const url = new URL(href.startsWith('/') && !href.startsWith('//') && root ? root + href.slice(1) : href, baseUrl);
    if (!['https:', 'http:'].includes(url.protocol)) return { href: url.href };
    const canonical = value => {
      const target = new URL(value);
      target.hash = '';
      target.search = '';
      if (target.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/blob\//.test(target.pathname)) {
        target.hostname = 'raw.githubusercontent.com';
        target.pathname = target.pathname.replace('/blob/', '/');
      }
      const metadata = model.metadata;
      if (metadata) {
        const prefix = model.repo.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/';
        const branchPrefix = prefix + metadata.ref + '/';
        if (decodeURI(target.href).startsWith(branchPrefix)) return decodeURI(target.href).replace(branchPrefix, prefix + metadata.source_commit + '/').replace(/\/$/, '/README.md');
      }
      return decodeURI(target.href).replace(/\/$/, '/README.md');
    };
    const target = canonical(url.href);
    const index = model.steps.findIndex(step => step.source && canonical(step.source) === target);
    if (index >= 0) return { href: url.href, key: String(index), hash: url.hash };
    const overviewSource = model.metadata?.overview_source || (root && root + 'README.md');
    if (overviewSource && canonical(overviewSource) === target) return { href: url.href, key: 'overview', hash: url.hash };
    if (url.hostname === 'raw.githubusercontent.com' && /\.(md|ipynb)$/i.test(url.pathname)) {
      const parts = url.pathname.split('/');
      parts.splice(3, 0, 'blob');
      url.hostname = 'github.com';
      url.pathname = parts.join('/');
    }
    return { href: url.href, external: true };
  }

  return { stripFrontmatter, parseManifest, metadataBadges, loadCatalog, findMetadata, resolveLink };
});