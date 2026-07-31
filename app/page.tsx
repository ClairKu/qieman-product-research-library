import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "且慢产品研究页面库｜2026-07",
  description:
    "产品研究与数据看板的统一生产入口，包含投顾页改版、产品全景、AI 原生转型、OAP 规划与运营趋势。",
};

type PageItem = {
  title: string;
  href: string;
  kind: "本站生产页" | "已有生产页" | "飞书文档";
  topic: string;
  note?: string;
};

const pages: PageItem[] = [
  {
    title: "且慢投顾模块现况盘点报告 · 2026年7月",
    href: "/pages/advisor-revamp/01-投顾模块现况盘点报告.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢 APP 投顾模块｜现况盘点与改版方向",
    href: "/pages/product-research/且慢APP投顾模块现况与改版方向-2026-07-23.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢投顾模块现况盘点报告 | 2026-07",
    href: "/pages/docs-advisor-revamp/01-投顾模块现况盘点报告.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢投顾页改版方向与方案设计 | 2026-07",
    href: "/pages/docs-advisor-revamp/02-投顾页改版方向与方案设计.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢投顾页改版：方向与方案设计（V0.9 对齐稿）",
    href: "/pages/advisor-revamp/02-改版方向与方案设计.html",
    kind: "本站生产页",
    topic: "投顾页改版",
    note: "项目源文件版本",
  },
  {
    title: "且慢产品现况网络调研报告 · 2026年7月",
    href: "/pages/advisor-revamp/00-且慢产品现况网络调研报告.html",
    kind: "本站生产页",
    topic: "产品研究",
  },
  {
    title: "且慢投顾页改版 · 现况盘点报告",
    href: "/pages/docs-advisor-redesign/01-现状盘点报告.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢投顾页改版 · 方向与方案对照",
    href: "/pages/docs-advisor-redesign/02-改版方向与方案对照.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢投顾页改版 · 推荐方案定稿与备选 · 2026年7月",
    href: "/pages/advisor-revamp/03-推荐方案定稿与备选.html",
    kind: "本站生产页",
    topic: "投顾页改版",
  },
  {
    title: "且慢投顾页改版DEMO · 方案B编排式产品页（预埋C）",
    href: "/pages/advisor-revamp/03-投顾页交互DEMO.html",
    kind: "本站生产页",
    topic: "交互原型",
  },
  {
    title: "且慢投顾页改版 · 产品规划与计划书 v0.1",
    href: "/pages/advisor-revamp/04-产品规划与计划书.html",
    kind: "本站生产页",
    topic: "产品规划",
  },
  {
    title: "工具能力对比 · 聚源 Gildata MCP vs 盈米且慢 MCP（以 010350 诊断为样本）",
    href: "https://mcp.edgeone.site/share/usAyeOT8Io1w33SRb0bbH",
    kind: "已有生产页",
    topic: "工具评测",
  },
  {
    title: "且慢 App 首页金刚位分析报告（修正版）| 截至2026-07-23",
    href: "https://ontology.yingmi-inc.com/a/e5qhqu6j5p?k=1FyXYxD8FOybCMdrKX71uT8J5KtbJ0s8",
    kind: "已有生产页",
    topic: "产品研究",
  },
  {
    title: "且慢投顾页点击与转化分析｜2026-07-24",
    href: "/pages/product-research/且慢投顾页点击与转化分析-2026-07-24.html",
    kind: "本站生产页",
    topic: "数据分析",
  },
  {
    title: "完整功能全景｜且慢 APP 全景",
    href: "/pages/qieman-app-panorama/map.html",
    kind: "本站生产页",
    topic: "产品全景",
  },
  {
    title: "且慢 App 深度产品分析报告 · 2026-07-24",
    href: "https://ontology.yingmi-inc.com/a/634fdzap43?k=Uism1cxnNVIql-cZAw0OwQvbcWib_ghN",
    kind: "已有生产页",
    topic: "产品研究",
  },
  {
    title: "使用情况与证据｜且慢 APP 全景",
    href: "/pages/qieman-app-panorama/usage.html",
    kind: "本站生产页",
    topic: "产品全景",
  },
  {
    title: "深度产品判断与路线图｜且慢 APP 全景",
    href: "/pages/qieman-app-panorama/roadmap.html",
    kind: "本站生产页",
    topic: "产品全景",
  },
  {
    title: "且慢 APP AI 原生转型三案｜2026-07-24",
    href: "/pages/product-research/且慢APP-AI原生转型三案-2026-07-24.html",
    kind: "本站生产页",
    topic: "AI 转型",
  },
  {
    title: "OAP 进展与规划汇报｜2026-07-24",
    href: "/pages/oap/oap-progress-and-roadmap-2026-07-24.html",
    kind: "本站生产页",
    topic: "AI 开放平台",
  },
  {
    title: "盈米AI开放平台用户｜增长趋势与区间经营分析",
    href: "/pages/oap/oap-metrics-trend-2026-07-28.html",
    kind: "本站生产页",
    topic: "AI 开放平台",
    note: "密码访问 · 2026",
  },
  {
    title: "盈米 AI 开放平台｜全站访问与点击分析",
    href: "/pages/oap/oap-service-site-traffic-analysis-2026-07-28.html",
    kind: "本站生产页",
    topic: "AI 开放平台",
    note: "UV / PV / 点击 / 来源 · 密码 2026",
  },
  {
    title: "盈米 AI 开放平台｜阶段复盘与 2026 下半年经营计划",
    href: "/pages/oap/oap-reporting-framework-2026-07-28.html",
    kind: "本站生产页",
    topic: "AI 开放平台",
    note: "管理层汇报成稿 · 密码 2026 · 2026-07-30",
  },
  {
    title: "盈米 AI 开放平台｜上线以来迭代复盘与下半年 OKR 汇报",
    href: "/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html",
    kind: "本站生产页",
    topic: "AI 开放平台",
    note: "版本节奏 · 问题复盘 · 决策建议 · 密码 2026",
  },
  {
    title: "王嘉烨｜2026下半年 AI开放平台目标计划与里程碑",
    href: "https://yingmi.feishu.cn/docx/QCTAd6QDTo6iKVxdA3LceZ4rnrf",
    kind: "飞书文档",
    topic: "AI 开放平台",
  },
  {
    title: "且慢投顾页改版：方向与方案设计（V0.9 对齐稿）",
    href: "/pages/desktop-v09/index.html",
    kind: "本站生产页",
    topic: "投顾页改版",
    note: "OneTab 中的桌面保存版本，按独立来源保留",
  },
];

const counts = {
  total: pages.length,
  hosted: pages.filter((page) => page.kind === "本站生产页").length,
  existing: pages.filter((page) => page.kind === "已有生产页").length,
  feishu: pages.filter((page) => page.kind === "飞书文档").length,
};

export default function Home() {
  return (
    <main>
      <header className="hero">
        <div className="hero__inner">
          <p className="eyebrow">Qieman · Product Research Library</p>
          <h1>且慢产品研究页面库</h1>
          <p className="lede">
            将 OneTab 清单中的本地报告、产品原型与已有线上材料统一成稳定入口。
            页面按原清单顺序保留，重复标题不合并，便于回溯版本来源。
          </p>
          <div className="metrics" aria-label="页面统计">
            <div><strong>{counts.total}</strong><span>页面总数</span></div>
            <div><strong>{counts.hosted}</strong><span>本站新发布</span></div>
            <div><strong>{counts.existing}</strong><span>已有生产页</span></div>
            <div><strong>{counts.feishu}</strong><span>飞书文档</span></div>
          </div>
        </div>
      </header>

      <section className="content" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OneTab · 2026-07-26</p>
            <h2 id="catalog-title">全部页面</h2>
          </div>
          <p>点击后在新窗口打开；本站生产页使用同一稳定域名。</p>
        </div>

        <ol className="catalog">
          {pages.map((page, index) => (
            <li key={`${page.title}-${index}`} className="card">
              <a href={page.href} target="_blank" rel="noreferrer">
                <div className="card__topline">
                  <span className="number">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`status status--${page.kind === "本站生产页" ? "hosted" : page.kind === "已有生产页" ? "existing" : "feishu"}`}>
                    {page.kind}
                  </span>
                </div>
                <h3>{page.title}</h3>
                <div className="card__meta">
                  <span>{page.topic}</span>
                  {page.note ? <span>{page.note}</span> : null}
                </div>
                <span className="open-label">打开页面 ↗</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <footer>
        <p>来源：Clair 提供的 OneTab 分享页 · 整理与发布：2026-07-26</p>
        <p>部分页面含内部研究与规划信息，默认按私有生产站管理。</p>
      </footer>
    </main>
  );
}
