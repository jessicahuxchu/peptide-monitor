import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface ProductImageSource {
  id: string;
  platform: string;
  product: string;
  pageUrl: string;
  enabled?: boolean;
  imageUrl?: string;
  selectorHints?: string[];
  notes?: string;
}

interface ProductImageConfig {
  version: number;
  defaultUserAgent?: string;
  sources: ProductImageSource[];
}

interface SourceState {
  pageUrl: string;
  etag?: string;
  lastModified?: string;
  pageHash?: string;
  imageUrl?: string;
  imageEtag?: string;
  imageLastModified?: string;
  lastCheckedAt?: string;
  lastChangedAt?: string;
  status?: "ok" | "not_modified" | "missing_image" | "error";
  error?: string;
}

interface ProductImageState {
  version: number;
  updatedAt?: string;
  sources: Record<string, SourceState>;
}

export interface ProductImageChange {
  id: string;
  platform: string;
  product: string;
  pageUrl: string;
  imageUrl?: string;
  changed: boolean;
  reason:
    | "new_source"
    | "page_changed"
    | "image_changed"
    | "not_modified"
    | "missing_image"
    | "disabled"
    | "error";
  error?: string;
}

export interface ProductImageScanResult {
  ok: boolean;
  checkedAt: string;
  configPath: string;
  statePath: string;
  checked: number;
  changed: number;
  skipped: number;
  changes: ProductImageChange[];
}

const DEFAULT_CONFIG_PATH = path.join(
  process.cwd(),
  "data",
  "product-image-sources.json",
);
const DEFAULT_STATE_PATH = path.join(
  process.cwd(),
  "data",
  "runtime",
  "product-image-state.json",
);

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeHtmlForHash(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function attrValue(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1]?.trim() ?? null;
}

function resolveUrl(candidate: string | undefined, baseUrl: string): string | undefined {
  if (!candidate) return undefined;
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(firstString).find(Boolean);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return firstString(obj.url) ?? firstString(obj.contentUrl);
  }
  return undefined;
}

function extractJsonLdImages(html: string, pageUrl: string): string[] {
  const images: string[] = [];
  const scripts = html.match(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  );
  for (const script of scripts ?? []) {
    const raw = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      const parsed = JSON.parse(raw.trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const graph = Array.isArray(item?.["@graph"]) ? item["@graph"] : [item];
        for (const node of graph) {
          const type = node?.["@type"];
          const isProduct =
            type === "Product" || (Array.isArray(type) && type.includes("Product"));
          if (!isProduct) continue;
          const image = resolveUrl(firstString(node.image), pageUrl);
          if (image) images.push(image);
        }
      }
    } catch {
      // Ignore malformed merchant JSON-LD; many storefronts include comments/trailing data.
    }
  }
  return images;
}

function extractMetaImage(html: string, pageUrl: string): string | undefined {
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const keys = new Set(["og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
  for (const tag of metas) {
    const property = attrValue(tag, "property") ?? attrValue(tag, "name");
    if (!property || !keys.has(property.toLowerCase())) continue;
    const content = resolveUrl(attrValue(tag, "content") ?? undefined, pageUrl);
    if (content) return content;
  }
  return undefined;
}

function scoreImageTag(tag: string, source: ProductImageSource): number {
  const text = [
    attrValue(tag, "alt"),
    attrValue(tag, "title"),
    attrValue(tag, "src"),
    attrValue(tag, "data-src"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hints = [
    source.product,
    source.platform,
    ...(source.selectorHints ?? []),
  ].map((v) => v.toLowerCase());
  let score = 0;
  for (const hint of hints) {
    for (const token of hint.split(/[^a-z0-9]+/).filter((v) => v.length >= 3)) {
      if (text.includes(token)) score += 2;
    }
  }
  if (/product|main|featured|cdn|image/.test(text)) score += 1;
  if (/logo|icon|sprite|placeholder|avatar/.test(text)) score -= 5;
  return score;
}

function extractImgTagImage(
  html: string,
  pageUrl: string,
  source: ProductImageSource,
): string | undefined {
  const tags = html.match(/<img\b[^>]*>/gi) ?? [];
  const ranked = tags
    .map((tag) => {
      const candidate =
        attrValue(tag, "data-src") ??
        attrValue(tag, "data-image") ??
        attrValue(tag, "src");
      return {
        score: scoreImageTag(tag, source),
        url: resolveUrl(candidate ?? undefined, pageUrl),
      };
    })
    .filter((item): item is { score: number; url: string } => Boolean(item.url))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score >= 0 ? ranked[0].url : undefined;
}

function extractProductImage(html: string, source: ProductImageSource): string | undefined {
  if (source.imageUrl) return resolveUrl(source.imageUrl, source.pageUrl);
  return (
    extractJsonLdImages(html, source.pageUrl)[0] ??
    extractMetaImage(html, source.pageUrl) ??
    extractImgTagImage(html, source.pageUrl, source)
  );
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function fetchPage(
  source: ProductImageSource,
  previous: SourceState | undefined,
  userAgent: string,
) {
  const headers: Record<string, string> = {
    accept: "text/html,application/xhtml+xml",
    "user-agent": userAgent,
  };
  if (previous?.etag) headers["if-none-match"] = previous.etag;
  if (previous?.lastModified) headers["if-modified-since"] = previous.lastModified;

  return fetch(source.pageUrl, { headers, redirect: "follow" });
}

async function fetchImageHeaders(imageUrl: string, userAgent: string) {
  try {
    const res = await fetch(imageUrl, {
      method: "HEAD",
      headers: { "user-agent": userAgent },
      redirect: "follow",
    });
    return {
      etag: res.headers.get("etag") ?? undefined,
      lastModified: res.headers.get("last-modified") ?? undefined,
    };
  } catch {
    return {};
  }
}

export async function runProductImageScan(options?: {
  configPath?: string;
  statePath?: string;
}): Promise<ProductImageScanResult> {
  const configPath =
    options?.configPath ?? process.env.PRODUCT_IMAGE_CONFIG_PATH ?? DEFAULT_CONFIG_PATH;
  const statePath =
    options?.statePath ?? process.env.PRODUCT_IMAGE_STATE_PATH ?? DEFAULT_STATE_PATH;
  const config = await readJsonFile<ProductImageConfig>(configPath, {
    version: 1,
    sources: [],
  });
  const state = await readJsonFile<ProductImageState>(statePath, {
    version: 1,
    sources: {},
  });
  const checkedAt = new Date().toISOString();
  const userAgent =
    process.env.PRODUCT_IMAGE_USER_AGENT ??
    config.defaultUserAgent ??
    "PeptideMonitor/1.0";
  const changes: ProductImageChange[] = [];

  for (const source of config.sources) {
    if (source.enabled === false || !source.pageUrl) {
      changes.push({
        id: source.id,
        platform: source.platform,
        product: source.product,
        pageUrl: source.pageUrl,
        changed: false,
        reason: "disabled",
      });
      continue;
    }

    const previous = state.sources[source.id];
    try {
      const response = await fetchPage(source, previous, userAgent);
      if (response.status === 304 && previous) {
        state.sources[source.id] = {
          ...previous,
          status: "not_modified",
          lastCheckedAt: checkedAt,
        };
        changes.push({
          id: source.id,
          platform: source.platform,
          product: source.product,
          pageUrl: source.pageUrl,
          imageUrl: previous.imageUrl,
          changed: false,
          reason: "not_modified",
        });
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const imageUrl = extractProductImage(html, source);
      const pageHash = sha256(`${normalizeHtmlForHash(html)}\nimage:${imageUrl ?? ""}`);
      const imageHeaders = imageUrl
        ? await fetchImageHeaders(imageUrl, userAgent)
        : {};
      const isNew = !previous;
      const imageChanged =
        Boolean(imageUrl) &&
        (imageUrl !== previous?.imageUrl ||
          imageHeaders.etag !== previous?.imageEtag ||
          imageHeaders.lastModified !== previous?.imageLastModified);
      const pageChanged = previous?.pageHash !== pageHash;
      const changed = isNew || imageChanged || pageChanged;
      const reason: ProductImageChange["reason"] = !imageUrl
        ? "missing_image"
        : isNew
          ? "new_source"
          : imageChanged
            ? "image_changed"
            : pageChanged
              ? "page_changed"
              : "not_modified";

      state.sources[source.id] = {
        pageUrl: source.pageUrl,
        etag: response.headers.get("etag") ?? undefined,
        lastModified: response.headers.get("last-modified") ?? undefined,
        pageHash,
        imageUrl,
        imageEtag: imageHeaders.etag,
        imageLastModified: imageHeaders.lastModified,
        lastCheckedAt: checkedAt,
        lastChangedAt: changed ? checkedAt : previous?.lastChangedAt,
        status: imageUrl ? "ok" : "missing_image",
      };
      changes.push({
        id: source.id,
        platform: source.platform,
        product: source.product,
        pageUrl: source.pageUrl,
        imageUrl,
        changed,
        reason,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      state.sources[source.id] = {
        ...(previous ?? { pageUrl: source.pageUrl }),
        pageUrl: source.pageUrl,
        lastCheckedAt: checkedAt,
        status: "error",
        error,
      };
      changes.push({
        id: source.id,
        platform: source.platform,
        product: source.product,
        pageUrl: source.pageUrl,
        imageUrl: previous?.imageUrl,
        changed: false,
        reason: "error",
        error,
      });
    }
  }

  state.version = 1;
  state.updatedAt = checkedAt;
  await mkdir(path.dirname(statePath), { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  const activeChanges = changes.filter((item) => item.reason !== "disabled");
  return {
    ok: activeChanges.every((item) => item.reason !== "error"),
    checkedAt,
    configPath,
    statePath,
    checked: activeChanges.length,
    changed: activeChanges.filter((item) => item.changed).length,
    skipped: changes.length - activeChanges.length,
    changes,
  };
}
