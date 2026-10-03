type JsonLdProps = {
  data: Record<string, unknown> | readonly Record<string, unknown>[];
};

/**
 * Renders structured data. `<` is escaped so no string inside the payload
 * can close the script element (prevents HTML injection).
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
