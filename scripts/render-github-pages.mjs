import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const workerUrl = new URL(`../dist/server/index.js?render=${Date.now()}`, import.meta.url);
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("https://clairku.github.io/", {
    headers: {
      accept: "text/html",
      host: "clairku.github.io",
      "x-forwarded-host": "clairku.github.io",
      "x-forwarded-proto": "https",
    },
  }),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

let html = await response.text();
html = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<link rel="modulepreload"[^>]*>/gi, "")
  .replaceAll('href="/assets/', 'href="assets/')
  .replaceAll('href="/pages/', 'href="pages/')
  .replaceAll(
    "https://clairku.github.io/og.png",
    "https://clairku.github.io/qieman-product-research-library/og.png",
  );

const assetsDir = path.join(root, "dist", "client", "assets");
const cssFiles = (await readdir(assetsDir)).filter(
  (name) => name.startsWith("index-") && name.endsWith(".css"),
);
const stylesheet = html.match(/href="assets\/(index-[^"]+\.css)"/)?.[1];
if (!stylesheet || !cssFiles.includes(stylesheet)) {
  throw new Error("Rendered stylesheet was not found in the build output.");
}

await mkdir(path.join(root, "docs", "assets"), { recursive: true });
await cp(path.join(assetsDir, stylesheet), path.join(root, "docs", "assets", stylesheet));
await writeFile(path.join(root, "docs", "index.html"), html, "utf8");

const page = await readFile(path.join(root, "docs", "index.html"), "utf8");
if (!page.includes("盈米AI开放平台用户") || page.includes("<script")) {
  throw new Error("GitHub Pages catalog validation failed.");
}
