import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy without nonces (Next.js "Without Nonces" pattern), so
 * pages stay statically rendered. 'unsafe-inline' is needed for Next.js's
 * inline bootstrap scripts and JSON-LD; everything else is limited to this
 * origin. The site loads no third-party scripts, styles, fonts or APIs (fonts
 * are self-hosted by next/font). Official bill pages open as normal links in a
 * new tab, which CSP does not restrict.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/*
 * HSTS is not set here: Vercel already sends Strict-Transport-Security on
 * HTTPS deployments (verified on the production URL), and adding a second,
 * different value could conflict. Re-check if hosting moves off Vercel.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // This folder is the project root; a lockfile in a parent folder must not be picked up.
  turbopack: { root: process.cwd() },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
