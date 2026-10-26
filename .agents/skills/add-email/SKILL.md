---
name: add-email
description: Add a transactional email to a TurbineKit project — a React Email template with text in every locale, typed props, and a send call. Use when the product must email people.
---

# Add an email

Emails are React Email templates in `packages/email/src/templates/`, with
their words in `packages/email/src/strings/<locale>.ts`.

## Steps

1. **Text.** Add a section to `strings/en.ts`, then to every other locale
   file (TypeScript checks they match):

   ```ts
   weeklyDigest: {
   	subject: "Your week on {product}",
   	preview: "{count} projects changed this week.",
   	heading: "Your week",
   	body: "Here is what changed in your projects.",
   	button: "Open {product}",
   },
   ```

   `{placeholders}` are filled by `fill(text, values)`.
2. **Template**, `templates/weekly-digest.tsx`. Copy `verify-email.tsx`: it
   wraps the content in `layout.tsx` and reads its words with
   `strings(locale)`.
3. **Register it** in `packages/email/src/index.ts`: its props in
   `TemplateProps`, and its subject and component in `TEMPLATES`.
4. **Send it** from server code:

   ```ts
   await sendEmail({
   	to: user.email,
   	template: "weekly-digest",
   	props: { count: 3 },
   	locale: user.locale,
   });
   ```

   From a request handler, send after the response when you can
   (`after(() => sendEmail(…))` from `next/server`).

## Check

- `pnpm email:dev` shows the template on http://localhost:3001.
- `pnpm test` (the email tests render every template in every locale).
- With `pnpm dev`, trigger it and read it in http://localhost:3000/api/dev/mailbox.
