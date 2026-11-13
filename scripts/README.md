# Refreshing the repository catalog

Run from the project root:

```sh
bun scripts/snapshot-repositories.ts --refresh
bun scripts/merge-repository-catalog.ts
bunx vitest run src/test/repository-catalog.test.ts src/test/static-catalog.test.ts --testTimeout=60000
```

The extractor stages complete GitHub trees under `/tmp/fresh-repository-snapshot` and refuses truncated responses. Without `--refresh`, it resumes using staged trees after a failed request. The merge must only run after extraction succeeds for all 50 targets. Catalog updates are tracked in Git and take effect on the published site after publishing.

Counts in the extraction regression test describe the November 2026 snapshot; update those concrete counts after verifying a later extraction's totals.

All original records and URLs remain intact. Repository records use encoded raw GitHub URLs and preserve existing URL-derived document slugs. Records with different URLs or metadata are not treated as identical files. Search deduplicates exact URLs, not file contents.

Browsing and search no longer call GitHub's listing API; opening or downloading a document still requests its original file host. This change does not add service-worker caching or guarantee offline access.