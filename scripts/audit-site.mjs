/**
 * SEO audit of a running build (`next start`).
 *
 *   node scripts/audit-site.mjs http://localhost:3000 [--inventory docs/PAGE-INVENTORY.md]
 *
 * Crawls from "/" and every sitemap URL, then checks: status codes, one H1,
 * heading order, title/description, canonical, robots meta, Open Graph URL,
 * JSON-LD validity and types, internal links, external-link safety, leaked
 * localhost URLs, sitemap ↔ indexability consistency and real 404s.
 * Exit code 1 on any problem. Optionally writes the indexable-page inventory.
 */
import fs from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const inventoryPath = process.argv.includes("--inventory") ? process.argv[process.argv.indexOf("--inventory") + 1] : null;
const problems = [];
const problem = (msg) => problems.push(msg);
const pick = (html, re) => html.match(re)?.[1];
const decode = (s) => s?.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// --- robots.txt and sitemap ---------------------------------------------
const robots = await (await fetch(`${base}/robots.txt`)).text();
const indexingOn = /Allow: \//.test(robots) && !/Disallow: \/\s*$/m.test(robots);
const sitemapRes = await fetch(`${base}/sitemap.xml`);
const sitemapXml = await sitemapRes.text();
if (!sitemapRes.ok || !/^<\?xml[^>]*\?>\s*<urlset[^>]*>[\s\S]*<\/urlset>\s*$/.test(sitemapXml.trim())) problem("sitemap.xml is not a well-formed urlset");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (new Set(sitemapUrls).size !== sitemapUrls.length) problem("sitemap has duplicate URLs");
const origins = new Set(sitemapUrls.map((u) => new URL(u).origin));
if (origins.size !== 1) problem(`sitemap mixes origins: ${[...origins].join(", ")}`);
const siteOrigin = [...origins][0];
if (indexingOn && !siteOrigin?.startsWith("https://")) problem(`indexing is on but sitemap origin is not https: ${siteOrigin}`);
if (indexingOn && !robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`)) problem("robots.txt does not advertise the sitemap");
const sitemapPaths = new Set(sitemapUrls.map((u) => new URL(u).pathname));

// --- crawl -----------------------------------------------------------------
const pages = new Map();
const queue = ["/", ...sitemapPaths];
const seen = new Set();
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await fetch(base + path, { redirect: "manual" });
  const type = res.headers.get("content-type") ?? "";
  if (res.status !== 200) { problem(`${path} returned ${res.status}`); continue; }
  if (!type.includes("text/html")) continue;
  const html = await res.text();
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1].replace(/<[^>]+>/g, "").trim()));
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  const robotsMeta = pick(html, /<meta name="robots" content="([^"]+)"/) ?? "index, follow";
  const page = {
    path,
    title: decode(pick(html, /<title>([^<]*)<\/title>/)),
    description: decode(pick(html, /<meta name="description" content="([^"]*)"/)),
    canonical: pick(html, /<link rel="canonical" href="([^"]+)"/),
    ogUrl: pick(html, /<meta property="og:url" content="([^"]+)"/),
    robots: robotsMeta,
    indexable: !/noindex/.test(robotsMeta),
    h1: h1s[0],
    jsonLdTypes: [],
  };
  pages.set(path, page);
  if (h1s.length !== 1) problem(`${path}: ${h1s.length} H1 elements`);
  if (levels.some((l, i) => i > 0 && l > levels[i - 1] + 1)) problem(`${path}: skipped heading level`);
  if (!page.title) problem(`${path}: missing title`);
  if (!page.description) problem(`${path}: missing description`);
  if (/localhost|127\.0\.0\.1/.test(html) && indexingOn) problem(`${path}: contains a localhost URL`);
  if (/vercel\.app/.test(html)) problem(`${path}: contains a vercel.app URL`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const d of [data].flat()) page.jsonLdTypes.push(d["@type"]);
      if (/AggregateRating|"Review"|ratingValue/.test(m[1])) problem(`${path}: forbidden rating/review schema`);
    } catch { problem(`${path}: invalid JSON-LD`); }
  }
  for (const m of html.matchAll(/<a [^>]*href="(https?:[^"]+)"[^>]*>/g)) {
    if (!/rel="noopener noreferrer"/.test(m[0]) && !m[1].startsWith(base)) problem(`${path}: external link without noopener: ${m[1]}`);
  }
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const href = m[1];
    if (!href.startsWith("/_next") && !seen.has(href) && !queue.includes(href)) queue.push(href);
  }
}

// --- consistency -----------------------------------------------------------
for (const page of pages.values()) {
  if (indexingOn && page.indexable) {
    const expected = page.path === "/" ? siteOrigin : `${siteOrigin}${page.path}`;
    if (page.canonical !== expected) problem(`${page.path}: canonical ${page.canonical} ≠ ${expected}`);
    if (page.ogUrl !== expected) problem(`${page.path}: og:url ${page.ogUrl} ≠ ${expected}`);
    if (!sitemapPaths.has(page.path) && page.path !== "/") problem(`${page.path}: indexable but missing from sitemap`);
  }
  if (sitemapPaths.has(page.path) && indexingOn && !page.indexable) problem(`${page.path}: in sitemap but noindex`);
  if (page.canonical && !/^https?:\/\//.test(page.canonical)) problem(`${page.path}: relative canonical`);
  if (page.canonical && /[?#]/.test(page.canonical)) problem(`${page.path}: canonical has query/fragment`);
}
const titles = [...pages.values()].filter((p) => p.indexable).map((p) => p.title);
for (const t of new Set(titles.filter((t, i) => titles.indexOf(t) !== i))) problem(`duplicate title: ${t}`);
for (const path of ["/does-not-exist", "/xyz-bill-check", "/lesco-bill-checker", "/guides/nope"]) {
  const res = await fetch(base + path);
  if (res.status !== 404) problem(`${path} returned ${res.status}, expected 404`);
}

// --- report ----------------------------------------------------------------
const indexable = [...pages.values()].filter((p) => p.indexable).sort((a, b) => a.path.localeCompare(b.path));
console.log(`indexing: ${indexingOn ? "ON" : "OFF"} | origin: ${siteOrigin} | pages crawled: ${pages.size} | indexable: ${indexable.length} | sitemap URLs: ${sitemapUrls.length}`);
console.log(problems.length ? `PROBLEMS (${problems.length}):\n- ${problems.join("\n- ")}` : "No problems found.");

if (inventoryPath) {
  const esc = (s) => (s ?? "").replace(/\|/g, "\\|");
  const rows = indexable.map((p) =>
    `| \`${p.path}\` | ${esc(p.title)} | ${esc(p.description)} | ${esc(p.h1)} | ${p.canonical === (p.path === "/" ? siteOrigin : siteOrigin + p.path) ? "self" : esc(p.canonical)} | ${p.jsonLdTypes.join(", ") || "none"} |`,
  );
  const noindex = [...pages.values()].filter((p) => !p.indexable).map((p) => `- \`${p.path}\` (${p.robots})`);
  fs.writeFileSync(
    inventoryPath,
    `# Page inventory\n\nGenerated by \`scripts/audit-site.mjs\` from a production build (origin \`${siteOrigin}\`, indexing ${indexingOn ? "on" : "off"}). Regenerate after changing pages or metadata.\n\n## Indexable pages (${indexable.length})\n\n| URL | Title | Description | H1 | Canonical | Structured data |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n\n## Crawled but not indexable (${noindex.length})\n\n${noindex.join("\n") || "None."}\n`,
  );
  console.log(`inventory written to ${inventoryPath}`);
}
process.exitCode = problems.length ? 1 : 0;
