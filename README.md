# Pakistan Electricity & Utility Calculator

Independent website for checking electricity bills online in Pakistan (primary) and estimating bills from units (secondary). Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Every page is statically prerendered; there is no database, no backend and no paid service.

## Scripts

| Command             | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Development server                        |
| `npm run build`     | Production build                          |
| `npm start`         | Serve the production build                |
| `npm run lint`      | ESLint                                    |
| `npm run typecheck` | Generate route types and run `tsc`        |
| `npm test`          | Engine, data, route, SEO and UI tests     |
| `npm run verify:providers` | Re-check official bill pages against config (submits nothing) |
| `npm run check:launch` | List missing production values (domain, indexing, contact email) for the current env |
| `node scripts/audit-site.mjs <url>` | SEO audit of a running build |

## Launch

See **[docs/SEO-LAUNCH.md](docs/SEO-LAUNCH.md)** for production environment variables, domain/DNS, Search Console, monitoring and the launch checklist. The current page inventory is in [docs/PAGE-INVENTORY.md](docs/PAGE-INVENTORY.md).

## Environment

See `.env.example`. All variables are optional locally.

- `NEXT_PUBLIC_SITE_URL`: production origin, used for canonicals, Open Graph, sitemap and robots.
- `NEXT_PUBLIC_ENABLE_INDEXING`: set to `true` **only** on the live production deployment. Otherwise every page is `noindex` and `robots.txt` disallows all crawling. The build fails if it is `true` without a public https `NEXT_PUBLIC_SITE_URL`.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: optional Search Console HTML-tag token.
- `NEXT_PUBLIC_CONTACT_EMAIL`: public contact address shown on `/contact`. Required for launch (`npm run check:launch` reports it); a malformed value fails the build.

## Structure

```
src/
  app/                    Routes (one folder per page), sitemap.ts, robots.ts, OG image
    [providerPage]/       Provider bill-check and calculator pages from one config-driven route
  components/
    ui/                   Design-system primitives (Button, Field, Card, Alert, Badge, …)
    layout/               Header, navigation, footer, logo
    calculator/           Calculator form, result states, breakdown, page sections
    tools/                Unit, appliance and AC calculators and shared tool page sections
    home/                 Homepage sections
  config/                 Site config, routes, legal dates
  data/                   Providers, consumer categories, FAQ, sources, guides, calculator registry
  lib/
    tariffs/              Versioned tariff data, sources, validation
    bill-check/           Provider lookup config, identifier validation, adapters, registry
    calculator/           Pure engine: slabs, money, estimate, registry, form validation
    energy/               Pure unit/appliance/AC formulas, strict number parsing, verified rate options
    seo/                  Metadata builder and JSON-LD builders
```

## Bill checker

The bill checker validates a reference number, Customer ID or K-Electric account number against verified per-provider rules and opens the provider’s official bill page. It never retrieves, stores or transmits bills or identifiers. See **[docs/BILL-CHECK.md](docs/BILL-CHECK.md)** for the architecture, the verification record and how to re-verify a provider.

## Tariff data and calculation

Bill estimates use verified official tariff data in `src/lib/tariffs/data`, which is versioned, validated and kept separate from the UI. See **[docs/CALCULATION.md](docs/CALCULATION.md)** for the architecture, rounding policy, assumptions, provider support and the step-by-step process for monthly FCA, quarterly QTA and rebasing updates.

## Electricity tools

The TOU bill calculator (5 kW and above) uses the verified time-of-use tariff. Unit, appliance and AC calculators use standard formulas and the user's own figures, with an optional rate list from the verified tariff data. See **[docs/TOOLS.md](docs/TOOLS.md)** for formulas, validation and rounding, and **[docs/SOLAR-RESEARCH.md](docs/SOLAR-RESEARCH.md)** for why solar tools are deferred.

## Content rules

No fabricated tariffs, results, statistics, reviews or affiliations. Official links in `src/data` record the date they were verified. Update `LEGAL_LAST_UPDATED` whenever a legal page changes, and update the privacy policy **before** adding analytics or advertising.
