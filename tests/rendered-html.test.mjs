import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://qieman-pages.example/", {
      headers: {
        accept: "text/html",
        host: "qieman-pages.example",
        "x-forwarded-host": "qieman-pages.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the 22-page production catalog", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /且慢产品研究页面库/);
  assert.match(html, /22/);
  assert.match(html, /18/);
  assert.match(html, /已有生产页/);
  assert.match(html, /飞书文档/);
  assert.match(html, /https:\/\/qieman-pages\.example\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("catalog keeps all 22 OneTab entries and 18 hosted pages", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const hrefs = [...source.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);
  const hosted = hrefs.filter((href) => href.startsWith("/pages/"));

  assert.equal(hrefs.length, 22);
  assert.equal(hosted.length, 18);
  assert.equal(new Set(hrefs).size, 22);

  await Promise.all(
    hosted.map((href) =>
      access(new URL(`../public${decodeURIComponent(href)}`, import.meta.url)),
    ),
  );
});

test("published copies contain no local or placeholder URLs", async () => {
  const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const desktopCopy = await readFile(
    new URL("../public/pages/desktop-v09/index.html", import.meta.url),
    "utf8",
  );
  const oapCopy = await readFile(
    new URL(
      "../public/pages/oap/oap-progress-and-roadmap-2026-07-24.html",
      import.meta.url,
    ),
    "utf8",
  );
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  assert.doesNotMatch(pageSource, /invalid\.invalid|file:\/\/\/|127\.0\.0\.1/);
  assert.doesNotMatch(desktopCopy, /file:\/\/\//);
  assert.doesNotMatch(oapCopy, /href="(?:\.\.\/)+/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
  await assert.rejects(
    access(new URL("../app/_sites-preview/preview.css", import.meta.url)),
  );
  await access(new URL("../public/og.png", import.meta.url));
  await access(root);
});

test("GitHub Pages artifact is standalone and keeps all hosted routes", async () => {
  const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  const hosted = [...html.matchAll(/href="(pages\/[^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(hosted.length, 18);
  assert.equal(new Set(hosted).size, 18);
  assert.doesNotMatch(html, /<script\b|localhost:|invalid\.invalid|href="\/pages\//);
  assert.match(
    html,
    /https:\/\/clairku\.github\.io\/qieman-product-research-library\/og\.png/,
  );

  await Promise.all(
    hosted.map((href) =>
      access(new URL(`../docs/${decodeURIComponent(href)}`, import.meta.url)),
    ),
  );
  await access(new URL("../docs/assets/index-ZS8EjuPg.css", import.meta.url));
  await access(new URL("../docs/og.png", import.meta.url));
  await access(new URL("../docs/.nojekyll", import.meta.url));
});
