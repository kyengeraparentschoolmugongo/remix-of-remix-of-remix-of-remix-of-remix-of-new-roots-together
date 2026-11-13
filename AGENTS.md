<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Imported application
- Render homepage doors and shelves directly with session restoration before paint; keep navigation in LibraryShell and use resized asset pointers to avoid legacy tree repair and oversized image decoding.
- Global quick search uses the same static search engine as the full results page, with a cancellable debounced dialog so rankings stay consistent without external listing requests.
- Full-library results are ordered and type-filtered before pagination; the gallery uses controlled search state, and file-size sorting stays in category galleries to avoid library-wide remote HEAD requests.
- Search preloads on user intent and caches bounded normalized query rankings; document links preserve query, page, ordering, type, and layout for return navigation.
- Repository listings, shared document lookup, and library-wide search use generated static catalogs only; refresh with the extraction and merge scripts so browsing never consumes GitHub API quota.
- Preserve the repository app in TanStack file routes and its bundled legacy catalogs; keep the target runtime and pinned framework versions to retain hosting compatibility.
- Import media through project-scoped asset pointers and rewrite every source asset URL so the app does not depend on another project’s storage.
