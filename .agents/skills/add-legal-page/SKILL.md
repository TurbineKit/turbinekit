---
name: add-legal-page
description: Add a legal page to a TurbineKit site — an MDX text per locale under /legal/<slug>, with metadata and a footer link. Use for terms of sale, an acceptable use policy, a DPA, an imprint, and similar pages.
---

# Add a legal page

Legal pages are MDX files: `apps/web/content/legal/<slug>/<locale>.mdx`,
served at `/legal/<slug>`.

## Steps

1. **Slug.** Add it to `legalSlugs` in `apps/web/src/lib/legal.ts`.
2. **Text.** Write `content/legal/<slug>/en.mdx`. Copy the head of
   `privacy/en.mdx`:

   ```mdx
   import { site } from "@repo/site";

   export const updated = "2026-10-26";

   # Acceptable use policy

   {site.name} …
   ```

   `updated` is the date of the text: change it with the text. Use
   `{site.name}` and `{site.company.email}` rather than literal names.
   Then a file per other locale. A missing locale shows English.
3. **Metadata.** Add `Legal.<slug>.title` and `Legal.<slug>.description` to
   every `apps/web/messages/<locale>.json`.
4. **Link.** Add it to the footer, `apps/web/src/components/site-footer.tsx`,
   with its label under `Footer`.

## Check

`pnpm typecheck && pnpm test`, then open `/legal/<slug>` and
`/fr/legal/<slug>` with `pnpm dev`. Have the text reviewed by a lawyer.
