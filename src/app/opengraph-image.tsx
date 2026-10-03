import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social-share image, generated at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0a1626",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#13263d" />
            <path d="M17.6 5.5 9.5 17.6h6.1l-1.2 8.9 8.1-12.1h-6.1l1.2-8.9Z" fill="#fbbf24" />
          </svg>
          <div style={{ display: "flex", fontSize: 30, color: "#c3ccd6" }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Calculate your electricity bill in Pakistan
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#6de3bf" }}>
            Independent estimates with a clear breakdown
          </div>
        </div>
      </div>
    ),
    size,
  );
}
