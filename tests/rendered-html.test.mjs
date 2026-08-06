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

test("server-renders the 26-page production catalog", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /且慢产品研究页面库/);
  assert.match(html, /26/);
  assert.match(html, /22/);
  assert.match(html, /已有生产页/);
  assert.match(html, /飞书文档/);
  assert.match(html, /https:\/\/qieman-pages\.example\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("catalog keeps all 26 entries and 22 hosted pages", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const hrefs = [...source.matchAll(/href:\s*"([^"]+)"/g)].map((match) => match[1]);
  const hosted = hrefs.filter((href) => href.startsWith("/pages/"));

  assert.equal(hrefs.length, 26);
  assert.equal(hosted.length, 22);
  assert.equal(new Set(hrefs).size, 26);

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

test("completed OAP management report is directly accessible", async () => {
  const report = await readFile(
    new URL(
      "../public/pages/oap/oap-reporting-framework-2026-07-28.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(report, /const payload=\{"salt":|type="password"|请输入访问密码/);
  assert.match(report, /阶段复盘与 2026 下半年经营计划/);
  assert.match(report, /9,145,099|DECISION 01|月活与服务复用/);
});

test("OAP H2 OKR iteration review is directly accessible", async () => {
  const report = await readFile(
    new URL(
      "../public/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(report, /const payload=\{"salt":|type="password"|请输入访问密码/);
  assert.match(report, /上线以来迭代复盘与 2026 下半年 OKR 汇报/);
  assert.match(report, /9,145,099|8,292 名用户|20 个种子应用/);
});

test("OAP journey and metrics visualization is directly accessible", async () => {
  const report = await readFile(
    new URL(
      "../public/pages/oap/oap-journey-metrics-2026-08-02.html",
      import.meta.url,
    ),
    "utf8",
  );

  assert.doesNotMatch(report, /const payload=\{"salt":|请输入访问密码/);
  assert.match(report, /<h1>关键历程，用户增长持续攀升<\/h1>/);
  assert.match(report, /05 用户增长 YINGMI AI · OAP JOURNEY \/ 2025\.03—2026\.08/);
  assert.match(report, /从能力开放、生态上架到超级入口接入，从需求验证到规模放大与商业化条件储备/);
  assert.match(report, /智谱采购盈米 MCP/);
  assert.match(report, /山西证券 AI 项目投标/);
  assert.match(report, /9,145,099/);
  await access(
    new URL(
      "../docs/pages/oap/oap-journey-metrics-2026-08-02.html",
      import.meta.url,
    ),
  );
});

test("GitHub Pages artifact is standalone and keeps all hosted routes", async () => {
  const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  const hosted = [...html.matchAll(/href="(pages\/[^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(hosted.length, 22);
  assert.equal(new Set(hosted).size, 22);
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
  const stylesheet = html.match(/href="(assets\/index-[^"]+\.css)"/)?.[1];
  assert.ok(stylesheet);
  await access(new URL(`../docs/${stylesheet}`, import.meta.url));
  await access(new URL("../docs/og.png", import.meta.url));
  await access(new URL("../docs/.nojekyll", import.meta.url));
});
