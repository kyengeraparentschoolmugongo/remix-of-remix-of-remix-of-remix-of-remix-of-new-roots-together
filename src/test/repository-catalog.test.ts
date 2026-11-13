import { describe, it, expect, vi } from 'vitest';
import manifest from '@/data/catalog/repositories.json';
import summary from '@/data/catalog/summary.json';
import { MORE_DOCUMENTS } from '@/data/more-documents';
import { loadRepositoryDocuments } from '@/lib/repository-catalog';
import { loadDocument } from '@/lib/document-catalog';
import { documentSlug } from '@/lib/document-metadata';
import { searchLibrary } from '@/lib/library-search';

describe('Unified repository catalog', () => {
  it('includes every one of the 50 menu repositories with all extracted references', async () => {
    const targets = [...new Set(Object.values(MORE_DOCUMENTS).flat().map(r => r.repo))];
    expect(targets).toHaveLength(50);
    expect(Object.keys(manifest.repositories).sort()).toEqual(targets.sort());
    let count = 0;
    for (const repo of targets) {
      const items = await loadRepositoryDocuments(repo);
      expect(items.length).toBe((manifest.repositories as Record<string, { count: number }>)[repo]?.count);
      count += items.length;
    }
    expect(count).toBe(54044);
    expect(summary.uniqueRecords).toBe(80669);
  }, 60000);
  it('browses and resolves a shared repository document without network or browser cache', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network disabled'));
    try {
      localStorage.clear();
      const items = await loadRepositoryDocuments('baby');
      const item = items[0];
      if (!item) throw new Error('Missing Baby document');
      const result = await loadDocument(documentSlug(item));
      expect(result?.item.pdfUrl).toBe(item.pdfUrl);
      expect(result?.related).toHaveLength(354);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
  it('finds repository-only documents in library-wide search before visiting their page', async () => {
    const items = await loadRepositoryDocuments('baby');
    const item = items.find(item => /english/i.test(item.pdfUrl));
    if (!item) throw new Error('Missing English example');
    const results = await searchLibrary('english');
    expect(results.total).toBeGreaterThan(12);
    expect(results.items).toHaveLength(12);
    const { resourceTitle } = await import('@/lib/resources');
    const exact = await searchLibrary(resourceTitle(item));
    expect(exact.items.some(result => result.pdfUrl === item.pdfUrl)).toBe(true);
  }, 60000);
});