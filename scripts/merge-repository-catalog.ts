import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import MiniSearch from 'minisearch';
import { documentKey } from '../src/lib/document-metadata';
import { resourceTitle, type ResourceRecord } from '../src/lib/resources';
import { searchTokens } from '../src/lib/document-search';
import { isDocumentFile } from '../src/lib/document-formats';

const root = 'src/data/catalog';
const read = async (path: string) => JSON.parse(await readFile(path, 'utf8'));
const save = async (path: string, data: unknown) => writeFile(path, JSON.stringify(data));
const snapshot = await read('/tmp/fresh-repository-snapshot/snapshot.json');
if (snapshot.repositories.length !== 50) throw new Error('Expected all 50 repositories');
const keys = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
const shards: Record<string, Record<string, ResourceRecord>> = {};
const indices: Record<string, Record<string, { id: string; path: string; kind: string; data: string }>> = {};
const records = new Map<string, string>();
for (const key of keys) {
  shards[key] = await read(`${root}/documents/${key}.json`);
  indices[key] = await read(`${root}/document-index/${key}.json`);
  for (const [id, item] of Object.entries(shards[key] ?? {})) records.set(JSON.stringify(item), id);
  // Rebuild repository entries on refresh rather than retaining removed files.
  for (const [id, entry] of Object.entries(indices[key] ?? {})) if (entry.kind === 'repositories') delete indices[key]?.[id];
}
await mkdir(`${root}/pages/repositories`, { recursive: true });
const repositories: Record<string, { label: string; data: string; count: number; commit: string }> = {};
for (const repo of snapshot.repositories) {
  const ids: string[] = [];
  for (const item of repo.items as ResourceRecord[]) {
    const serialized = JSON.stringify(item);
    const id = records.get(serialized) ?? createHash('sha256').update(serialized).digest('hex').slice(0, 20);
    const bucket = shards[id.slice(0, 2)];
    if (!bucket) throw new Error('Missing bucket');
    if (bucket[id] && JSON.stringify(bucket[id]) !== serialized) throw new Error('Record hash collision');
    bucket[id] = item;
    records.set(serialized, id);
    ids.push(id);
    const key = documentKey(item.pdfUrl);
    const index = indices[key.slice(0, 2)];
    if (!index) throw new Error('Missing index');
    const existing = index[key];
    if (existing && shards[existing.id.slice(0, 2)]?.[existing.id]?.pdfUrl !== item.pdfUrl) throw new Error('URL hash collision');
    index[key] ??= { id, path: `more/${repo.repo}`, kind: 'repositories', data: `${repo.repo}.json` };
  }
  repositories[repo.repo] = { label: repo.label, data: `${repo.repo}.json`, count: ids.length, commit: repo.commit };
  await save(`${root}/pages/repositories/${repo.repo}.json`, { title: repo.label, documentIds: ids });
}
// Only retain records referenced by an existing page or the refreshed repositories.
const { readdir } = await import('node:fs/promises');
const active = new Set<string>();
for (const kind of ['legacy', 'resources', 'repositories']) {
  for (const file of await readdir(`${root}/pages/${kind}`)) {
    const page = await read(`${root}/pages/${kind}/${file}`);
    for (const id of page.documentIds) active.add(id);
  }
}
for (const key of keys) {
  for (const id of Object.keys(shards[key] ?? {})) if (!active.has(id)) delete shards[key]?.[id];
  await save(`${root}/documents/${key}.json`, shards[key]);
  await save(`${root}/document-index/${key}.json`, indices[key]);
}
await save(`${root}/repositories.json`, { extractedAt: snapshot.extractedAt, repositories });
const summary = await read(`${root}/summary.json`);
await save(`${root}/summary.json`, { ...summary, uniqueRecords: active.size, repositoryPages: 50, repositoryReferences: snapshot.repositories.reduce((n: number, r: { items: unknown[] }) => n + r.items.length, 0) });
// Compact, separately downloaded full-library search index; results hydrate only their document shards.
const searchOptions = { fields: ['title', 'description'], storeFields: ['recordId'], tokenize: searchTokens, processTerm: (term: string) => term };
const rows = [];
for (const index of Object.values(indices)) for (const [key, entry] of Object.entries(index)) {
  const item = shards[entry.id.slice(0, 2)]?.[entry.id];
  if (item && isDocumentFile(item.pdfUrl)) rows.push({ id: key, recordId: entry.id, title: resourceTitle(item), description: item.description });
}
for (let part = 0; part < 4; part++) {
  const search = new MiniSearch(searchOptions);
  search.addAll(rows.filter(row => parseInt(row.id.slice(0, 2), 16) % 4 === part));
  await save(`${root}/search-index-${part}.json`, search);
}
console.log(`Merged ${Object.keys(repositories).length} repositories; ${active.size} unique records; ${rows.length} searchable URLs`);