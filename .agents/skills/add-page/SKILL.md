---
name: add-page
description: Add a page to a TurbineKit web app — a public page (localized, in the sitemap and llms.txt, with SEO metadata) or a signed-in app page. Use whenever a new URL people visit is needed.
---

# Add a page

Pages live under `apps/web/src/app/[locale]/`, in a route group:
`(core)` for the public site, `(app)` for signed-in pages, `(auth)` for
sign-in flows, `(legal)` for legal pages (skill `add-legal-page`).

## A public page

1. **Messages.** In `apps/web/messages/en.json`, add the page's title and
   description under `Pages.<key>`, and its text under its own namespace
   (`About`). Do the same in every other locale file.
2. **Route list.** Add `<key>` to `PAGE_KEYS` and an entry to `publicPages`
   in `apps/web/src/lib/routes.ts`. The sitemap, `llms.txt` and the
   Markdown copies come from it.
3. **The page**, `apps/web/src/app/[locale]/(core)/<path>/page.tsx`. Copy
   the shape of `(core)/pricing/page.tsx`:
   - `generateMetadata` returns `createMetadata({ title, description, path,
     locale })` (`@/lib/metadata`): canonical URL, hreflang and the share
     image.
   - The page renders `<JsonLd data={webPageSchema(…)} />` and one `<h1>`.
   - It is a server component that reads no request data, so it stays
     static. If a part needs the request, put that part in `<Suspense>`.
4. **Server-only text.** If only server components read the namespace, add
   it to `SERVER_ONLY_NAMESPACES` in `apps/web/src/lib/client-messages.ts`.
5. **Navigation.** Add a link in `src/components/site-header.tsx` or
   `site-footer.tsx`, with `Link` from `@/i18n/navigation`.

## A signed-in page

1. `apps/web/src/app/[locale]/(app)/<path>/page.tsx`. Add `/<path>` to
   `appPaths` in `src/lib/routes.ts`: the proxy then sends signed-out
   visitors to sign-in, and robots.txt disallows it.
2. `generateMetadata` returns `{ title }` only: the `(app)` layout already
   sets noindex.
3. Put everything that reads the session in `<Suspense>`:

   ```tsx
   export default function NotesPage() {
   	return (
   		<Suspense fallback={<Skeleton className="h-40" />}>
   			<Notes />
   		</Suspense>
   	);
   }

   async function Notes() {
   	const caller = sessionCaller(await requireSession());
   	const notes = await listNotes(getDb(), caller, { limit: 50 });
   	return <NoteList notes={notes.data} />;
   }
   ```

4. A sidebar entry: `ITEMS` in `src/components/app/app-sidebar.tsx`, with
   its label under `App.nav` in the messages (the label's type comes from
   there).
5. `params` and `searchParams` are read inside `<Suspense>` too: Next.js
   shares one prefetched shell between all links to a route.

## Check

```sh
pnpm typecheck && pnpm test && pnpm lint
```

Open the page in both locales (`/about` and `/fr/about`) with `pnpm dev`. For
a public page, check `/sitemap.xml` and `/llms.txt` list it.
