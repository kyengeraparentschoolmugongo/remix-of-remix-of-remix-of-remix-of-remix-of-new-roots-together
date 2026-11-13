import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { MORE_DOCUMENTS } from '../src/data/more-documents';
import { treeToDocuments } from '../src/lib/github-repo-documents';

// Extraction only: the running app never calls GitHub's listing API.
const target = '/tmp/fresh-repository-snapshot';
await mkdir(target, { recursive: true });
const repos = [...new Map(Object.values(MORE_DOCUMENTS).flat().map(repo => [repo.repo, repo])).values()];
const results = [];
for (const repo of repos) {
  const file = `${target}/${repo.repo}.json`;
  let body;
  try {
    if (process.argv.includes('--refresh')) throw new Error('Refresh requested');
    body = JSON.parse(await readFile(file, 'utf8'));
    if (body.truncated || !Array.isArray(body.tree)) throw new Error('Invalid cached tree');
  } catch {
    const getTree = async (ref: string, recursive: boolean) => {
      const response = await fetch(`https://api.github.com/repos/Fresh-Teacher/${encodeURIComponent(repo.repo)}/git/trees/${ref}${recursive ? '?recursive=1' : ''}`, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'fresh-catalog-extraction' },
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error(`${repo.repo}: ${response.status} ${await response.text()}`);
      return response.json();
    };
    try {
      body = await getTree('HEAD', true);
      if (body.truncated) throw new Error('Truncated tree');
    } catch {
      // Large repositories can exceed GitHub's recursive-tree response limit.
      const root = await getTree('HEAD', false);
      const tree: { path: string; type: string }[] = [];
      const visit = async (entries: { path: string; type: string; sha: string }[], prefix = '') => {
        for (const entry of entries) {
          const path = prefix + entry.path;
          if (entry.type === 'blob') tree.push({ path, type: 'blob' });
          else if (entry.type === 'tree') {
            const child = await getTree(entry.sha, false);
            if (child.truncated || !Array.isArray(child.tree)) throw new Error(`${repo.repo}: incomplete subtree`);
            await visit(child.tree, path + '/');
          }
        }
      };
      if (root.truncated || !Array.isArray(root.tree)) throw new Error(`${repo.repo}: incomplete root`);
      await visit(root.tree);
      body = { sha: root.sha, tree, truncated: false };
    }
    if (body.truncated || !Array.isArray(body.tree)) throw new Error(`${repo.repo}: incomplete tree; refusing partial catalog`);
    await writeFile(file, JSON.stringify(body));
  }
  const items = treeToDocuments(repo.repo, body.tree);
  results.push({ ...repo, commit: body.sha, items });
  console.log(`${repo.repo}: ${items.length} documents`);
}
await writeFile(`${target}/snapshot.json`, JSON.stringify({ extractedAt: new Date().toISOString(), repositories: results }));
console.log(`Collected ${results.length} repositories, ${results.reduce((sum, repo) => sum + repo.items.length, 0)} references`);