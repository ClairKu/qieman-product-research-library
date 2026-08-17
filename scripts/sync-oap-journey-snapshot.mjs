import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = process.argv[2];
if (!snapshotPath) throw new Error("Usage: node scripts/sync-oap-journey-snapshot.mjs /absolute/path/to/latest.json");

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
if (snapshot.schema_version !== "oap-qieman-user-dashboard-v1") throw new Error("Unsupported report snapshot schema");
if (snapshot.meta?.timezone !== "Asia/Shanghai") throw new Error("Unexpected report snapshot timezone");
const journey = snapshot.journey_metrics;
if (journey?.schema_version !== "oap-journey-metrics-v1" || !Array.isArray(journey.rows) || !journey.rows.length) throw new Error("Missing journey metrics");
const cutoff = String(snapshot.meta.data_cutoff || "").slice(0, 10);
const latest = journey.rows.at(-1);
if (journey.as_of !== cutoff || latest.date !== cutoff || Math.abs(latest.cumulativeCalls - snapshot.usage.total_calls) >= 20 || Math.abs(latest.cumulativeUsers - snapshot.usage.approved_users) >= 20) {
  throw new Error("Annual goals and journey metrics do not close");
}

const number = (value) => new Intl.NumberFormat("en-US").format(value);
const files = [
  path.join(root, "public/pages/oap/oap-journey-metrics-2026-08-02.html"),
  path.join(root, "docs/pages/oap/oap-journey-metrics-2026-08-02.html"),
];

for (const htmlPath of files) {
  let html = fs.readFileSync(htmlPath, "utf8");
  const reportMatch = html.match(/(<script id="report-data" type="application\/json">)([\s\S]*?)(<\/script>)/);
  const metricsMatch = html.match(/(<script id="metrics-data" type="application\/json">)([\s\S]*?)(<\/script>)/);
  if (!reportMatch || !metricsMatch) throw new Error(`Embedded data not found: ${htmlPath}`);

  const report = JSON.parse(reportMatch[2]);
  const metrics = JSON.parse(metricsMatch[2]);
  const embeddedAsOf = metrics.asOf;
  const embeddedByDate = new Map(metrics.rows.map((row) => [row.date, row]));
  journey.rows.forEach((row) => {
    const embedded = embeddedByDate.get(row.date);
    if (embedded && row.date < embeddedAsOf && (Math.abs(embedded.cumulativeCalls - row.cumulativeCalls) >= 20 || (row.dailyCallingUsers !== null && embedded.dailyCallingUsers !== row.dailyCallingUsers))) {
      throw new Error(`Journey definition mismatch on ${row.date}`);
    }
  });
  const merged = new Map(metrics.rows.map((row) => [row.date, row]));
  journey.rows.forEach((row) => merged.set(row.date, row));
  metrics.rows = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
  for (let index = 1; index < metrics.rows.length; index += 1) {
    const previous = Date.parse(`${metrics.rows[index - 1].date}T00:00:00Z`);
    const current = Date.parse(`${metrics.rows[index].date}T00:00:00Z`);
    if (current - previous !== 86_400_000) throw new Error(`Journey date gap: ${metrics.rows[index].date}`);
  }
  metrics.asOf = cutoff;
  metrics.rangeLabel = `${metrics.rows[0].date}—${cutoff}`;
  metrics.latestActive30dUsers = snapshot.usage.active_30d_users;
  metrics.latestApprovedUsers = snapshot.usage.approved_users;
  metrics.latestTotalCalls = snapshot.usage.total_calls;
  metrics.active30dAsOf = cutoff;
  metrics.active30dDefinition = "最近 30 个完整自然日内产生 OAP 调用的去重用户";
  metrics.sourceRecordCounts = {
    cumulativeCalls: metrics.rows.filter((row) => Number.isFinite(row.cumulativeCalls)).length,
    dailyCallingUsers: metrics.rows.filter((row) => Number.isFinite(row.dailyCallingUsers)).length,
    dailyNewUsers: metrics.rows.filter((row) => Number.isFinite(row.dailyNewUsers)).length,
    cumulativeUsers: metrics.rows.filter((row) => Number.isFinite(row.cumulativeUsers)).length,
  };
  metrics.note = `2026-08-01 起日序列与年度目标采用同一次 OAP 生产数仓只读聚合（排除内部测试 API Key）；数据截至 ${cutoff} 23:59:59 完整自然日。`;

  report.meta.cutoff = cutoff;
  const dayCount = metrics.rows.length;
  const trendSource = report.sources?.find((source) => source.label === "OAP 运营趋势日序列");
  if (trendSource) trendSource.detail = `https://clairku.github.io/qieman-product-research-library/pages/oap/oap-metrics-trend-2026-07-28.html｜${dayCount} 天｜2026-08-01 起与年度目标采用同次只读聚合｜数据截止 ${cutoff}`;

  html = html
    .replace(reportMatch[0], `${reportMatch[1]}${JSON.stringify(report)}${reportMatch[3]}`)
    .replace(metricsMatch[0], `${metricsMatch[1]}${JSON.stringify(metrics)}${metricsMatch[3]}`)
    .replace(/(<strong id="latest-users">)[^<]*(<\/strong>)/, `$1${number(snapshot.usage.approved_users)}$2`)
    .replace(/(<strong id="latest-calls">)[^<]*(<\/strong>)/, `$1${number(snapshot.usage.total_calls)}$2`)
    .replace(/(<span id="latest-active-label">)[^<]*(<\/span>)/, "$1近 30 日活跃$2")
    .replace(/(<strong id="latest-active">)[^<]*(<\/strong>)/, `$1${number(snapshot.usage.active_30d_users)}$2`)
    .replace(/(<b id="data-cutoff">)[^<]*(<\/b>)/, `$1${cutoff}$2`)
    .replace(/(<span class="sr-only" id="data-refresh-status" role="status" aria-live="polite">)[^<]*(<\/span>)/, `$1当前数据截至 ${cutoff}$2`);
  fs.writeFileSync(htmlPath, html);
}

console.log(`Synced OAP journey metrics to ${cutoff}: calls=${snapshot.usage.total_calls}, users=${snapshot.usage.approved_users}, active30d=${snapshot.usage.active_30d_users}`);
