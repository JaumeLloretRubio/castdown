/**
 * Site crawler — Playwright + Readability + Turndown.
 * Produces a ZIP whose internal structure mirrors the URL paths,
 * with internal links rewritten to relative .md paths.
 */
import { PassThrough, Readable } from "node:stream";
import archiver from "archiver";
import { Configuration, PlaywrightCrawler, RequestQueue } from "crawlee";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { assertPublicUrl } from "./ssrf.js";

// Crawlee persists request queues to disk by default, which means a URL
// processed once never gets re-processed — fatal for an API where each
// /crawl call must be independent. Disable persistence globally.
Configuration.getGlobalConfig().set("persistStorage", false);
Configuration.getGlobalConfig().set("purgeOnStart", true);

export interface CrawlOpts {
  url: string;
  depth: number;
  format: "zip" | "flat" | "tree";
  max_pages: number;
  render_js: boolean;
}

interface CrawledPage {
  url: string;
  path: string; // relative md path inside zip
  markdown: string;
  title: string;
}

export async function crawlSite(opts: CrawlOpts): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  filename: string;
}> {
  // SSRF guard: reject the seed up-front so a blocked target fails fast with
  // a clear error rather than a generic crawl failure.
  const rootUrl = await assertPublicUrl(opts.url);
  const pages: CrawledPage[] = [];
  const seen = new Set<string>();

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Fresh request queue per invocation so URLs aren't deduplicated across
  // different /crawl calls. Name is unique by timestamp+random.
  const queueName = `crawl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const requestQueue = await RequestQueue.open(queueName);

  const crawler = new PlaywrightCrawler({
    requestQueue,
    maxRequestsPerCrawl: opts.max_pages,
    maxConcurrency: Number(process.env.CRAWLER_MAX_CONCURRENCY ?? 2),
    maxRequestRetries: 1,
    navigationTimeoutSecs: 30,
    requestHandlerTimeoutSecs: 60,
    launchContext: {
      launchOptions: { headless: true },
    },
    // Re-validate every navigation (redirects + enqueued links) so a public
    // seed can't redirect or link into an internal address.
    preNavigationHooks: [
      async ({ request }) => {
        await assertPublicUrl(request.url);
      },
    ],
    async requestHandler({ page, request, enqueueLinks }) {
      if (seen.has(request.loadedUrl ?? request.url)) return;
      seen.add(request.loadedUrl ?? request.url);

      const html = await page.content();
      const dom = new JSDOM(html, { url: request.url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      const title = article?.title || dom.window.document.title || request.url;
      const contentHtml = article?.content || html;
      const markdown = turndown.turndown(contentHtml);

      pages.push({
        url: request.loadedUrl ?? request.url,
        path: urlToPath(request.loadedUrl ?? request.url, rootUrl),
        markdown: `# ${title}\n\n${markdown}\n`,
        title,
      });

      if (request.userData.depth < opts.depth) {
        await enqueueLinks({
          strategy: "same-hostname",
          userData: { depth: request.userData.depth + 1 },
        });
      }
    },
  });

  await crawler.run([{ url: opts.url, userData: { depth: 0 } }]);
  await requestQueue.drop().catch(() => {});

  // Rewrite internal links → relative md paths
  const urlToMdPath = new Map(pages.map((p) => [normalizeUrl(p.url), p.path]));
  for (const p of pages) {
    p.markdown = rewriteLinks(p.markdown, p.path, urlToMdPath);
  }

  if (opts.format === "zip") {
    return { ...streamZip(pages, rootUrl), filename: `${rootUrl.hostname}.zip` };
  }
  // flat / tree → JSON listing (placeholder)
  const json = JSON.stringify({ count: pages.length, pages: pages.map((p) => ({ path: p.path, title: p.title })) });
  return {
    stream: Readable.from([json]),
    contentType: "application/json",
    filename: `${rootUrl.hostname}.json`,
  };
}

function urlToPath(url: string, root: URL): string {
  const u = new URL(url);
  let path = u.pathname;
  if (path === "" || path === "/") path = "/index";
  if (path.endsWith("/")) path += "index";
  path = path.replace(/\/+/g, "/").replace(/[^\w\-/.]/g, "_");
  return path.replace(/^\//, "") + ".md";
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function rewriteLinks(md: string, fromPath: string, map: Map<string, string>): string {
  return md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (full, text, href) => {
    const target = map.get(normalizeUrl(href));
    if (!target) return full;
    const rel = relativePath(fromPath, target);
    return `[${text}](${rel})`;
  });
}

function relativePath(from: string, to: string): string {
  const fromParts = from.split("/").slice(0, -1);
  const toParts = to.split("/");
  let common = 0;
  while (common < fromParts.length && common < toParts.length - 1 && fromParts[common] === toParts[common]) {
    common++;
  }
  const ups = fromParts.length - common;
  return "../".repeat(ups) + toParts.slice(common).join("/");
}

function streamZip(pages: CrawledPage[], root: URL): { stream: NodeJS.ReadableStream; contentType: string } {
  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // index.md listing
  const indexMd = [
    `# ${root.hostname}`,
    ``,
    `Crawled ${pages.length} pages from ${root.toString()}.`,
    ``,
    ...pages.map((p) => `- [${p.title}](${p.path})`),
    ``,
  ].join("\n");
  archive.append(indexMd, { name: "index.md" });

  for (const p of pages) {
    archive.append(p.markdown, { name: p.path });
  }
  archive.finalize();

  return { stream: passthrough, contentType: "application/zip" };
}
