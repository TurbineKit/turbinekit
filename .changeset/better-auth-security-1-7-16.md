---
"create-turbinekit": patch
---

Security: better-auth 1.7.16 (was 1.7.13), from the [better-auth security release of November 3, 2026](https://better-auth.com/blog/security-release-2026-11-03). Two of its advisories apply to TurbineKit projects. With teams, a team admin could invite a member as owner with a padded role name, such as `" owner"` ([GHSA-c85h-5mrr-mgx4](https://github.com/better-auth/better-auth/security/advisories/GHSA-c85h-5mrr-mgx4)). Passkey sign-in did not check the origin of the passkey response ([GHSA-gv75-j3v8-3crm](https://github.com/better-auth/better-auth/security/advisories/GHSA-gv75-j3v8-3crm)). The other advisories are for plugins and settings that TurbineKit doesn't use (Expo, Electron, phone number, email OTP, Stripe plugin, MySQL, cookie cache, secondary storage, email change). No secret to rotate, no migration.

A project made with an earlier version: set `better-auth`, `auth` and every `@better-auth/*` package to `1.7.16` (the catalog in `pnpm-workspace.yaml`, and the pinned versions in `apps/web`, `packages/api` and `packages/auth`), then run `pnpm install`. With teams, run this query before you deploy. It finds padded roles from before the upgrade:

```sql
SELECT 'member' AS kind, id, organization_id, role FROM member
WHERE role ~ '^\s|\s$|,' OR role = ''
UNION ALL
SELECT 'invitation', id, organization_id, role FROM invitation
WHERE role ~ '^\s|\s$|,' OR role = '';
```

better-auth 1.7.16 reads `admin, owner` as owner, so don't trim these roles in place. Set each one to the role it should have, and check the owners that these members invited.
