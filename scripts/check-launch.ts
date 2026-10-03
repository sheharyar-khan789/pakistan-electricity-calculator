/**
 * Launch readiness for the current environment (owner-run, read-only).
 *
 *   NEXT_PUBLIC_SITE_URL=https://example.com NEXT_PUBLIC_ENABLE_INDEXING=true \
 *   NEXT_PUBLIC_CONTACT_EMAIL=you@example.com npm run check:launch
 *
 * Prints blockers and warnings; exit code 1 if anything blocks a public launch.
 * It reads only NEXT_PUBLIC_* values and VERCEL_ENV, which are public anyway.
 */
import { checkLaunchReadiness } from "@/config/site";

const result = checkLaunchReadiness({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ENABLE_INDEXING: process.env.NEXT_PUBLIC_ENABLE_INDEXING,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  VERCEL_ENV: process.env.VERCEL_ENV,
});

console.log(`mode: ${result.mode}`);
for (const b of result.blockers) console.log(`BLOCKER  ${b}`);
for (const w of result.warnings) console.log(`WARNING  ${w}`);
if (result.blockers.length === 0) console.log("Ready for a public launch (see docs/SEO-LAUNCH.md for the remaining manual steps).");
process.exitCode = result.blockers.length ? 1 : 0;
