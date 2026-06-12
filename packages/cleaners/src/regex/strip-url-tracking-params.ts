const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "utm_id", "utm_source_platform", "utm_creative_format", "utm_marketing_tactic",
  "fbclid", "gclid", "msclkid", "twclid", "ttclid", "li_fat_id",
  "mc_cid", "mc_eid", "_ga", "_gl",
]);

function cleanUrl(url: string): string {
  try {
    const u = new URL(url);
    const toDelete = [...u.searchParams.keys()].filter((k) =>
      TRACKING_PARAMS.has(k),
    );
    if (toDelete.length === 0) return url;
    toDelete.forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url;
  }
}

export function stripUrlTrackingParams(md: string): string {
  return md.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (full, text, url) => {
    const clean = cleanUrl(url as string);
    return clean === url ? full : `[${text as string}](${clean})`;
  });
}
