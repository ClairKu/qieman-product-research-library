/**
 * Sync OAP Stargate dashboard metrics to a plaintext live JSON on GitHub Pages.
 *
 * The journey page (pages/oap/oap-journey-metrics-2026-08-02.html) fetches
 * pages/oap/oap-metrics-live.json on load (and via the refresh icon), so
 * public viewers always see the latest data — no password required.
 *
 * Data source (intranet only, run from a machine on the Yingmi office network):
 *   - Preferred: Redash REST API at https://zhu.yingmi-inc.com (REDASH_API_KEY env),
 *     data source 41 = TiDB-6.X DP, database ying99_oap — the same tables the
 *     Stargate /admin/dashboard reads.
 *   - Fallback: ontology CLI (~/.claude/skills/ontology/ontology) when no key is set.
 *
 * Usage:
 *   node scripts/sync-oap-live-metrics.mjs [--push] [--bake] [--from-file data.json]
 *     --push       git pull --rebase + commit + push after writing
 *     --bake       also rewrite the baked-in metrics inside the journey page HTML
 *     --from-file  skip querying; build from a {generatedAt,mau,newByDay,callsByDay} file
 *
 * Env: REDASH_API_KEY (preferred data path)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { lookup } from "node:dns/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const PAGE = "pages/oap/oap-journey-metrics-2026-08-02.html";
const LIVE = "pages/oap/oap-metrics-live.json";
const SKIP_KEY = "479c9d2e-4d05-4098-bd72-994c82e0fd22";
const REDASH_URL = process.env.REDASH_URL || "https://zhu.yingmi-inc.com";
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const argValue = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);

const SQL = {
  newByDay: `SELECT DATE(created_at) d, COUNT(*) n FROM ying99_oap.api_key WHERE id<>'${SKIP_KEY}' GROUP BY DATE(created_at) ORDER BY d`,
  callsByDay: `SELECT DATE(request_at) d, COUNT(*) c, COUNT(DISTINCT api_key_id) u FROM ying99_oap.api_key_usage_details WHERE api_key_id<>'${SKIP_KEY}' GROUP BY DATE(request_at) ORDER BY d`,
  mau: `SELECT COUNT(DISTINCT api_key_id) mau FROM ying99_oap.api_key_usage_details WHERE api_key_id<>'${SKIP_KEY}' AND request_at>=DATE_SUB(NOW(), INTERVAL 30 DAY)`,
};

function beijingNowISO() {
  const now = new Date(Date.now() + 8 * 3600e3);
  return `${now.toISOString().slice(0, 19)}+08:00`;
}

async function redashQuery(query) {
  const post = await fetch(`${REDASH_URL}/api/query_results`, {
    method: "POST",
    headers: { Authorization: `Key ${process.env.REDASH_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, data_source_id: 41, max_age: 0 }),
  });
  if (!post.ok) throw new Error(`redash POST ${post.status}: ${(await post.text()).slice(0, 200)}`);
  let body = await post.json();
  if (body.job) {
    const jobId = body.job.id;
    for (let i = 0; i < 120; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const job = (await (await fetch(`${REDASH_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Key ${process.env.REDASH_API_KEY}` },
      })).json()).job;
      if (job.status === 3) {
        body = await (await fetch(`${REDASH_URL}/api/query_results/${job.query_result_id}`, {
          headers: { Authorization: `Key ${process.env.REDASH_API_KEY}` },
        })).json();
        break;
      }
      if (job.status === 4 || job.status === 5) throw new Error(`redash job failed: ${job.error}`);
    }
  }
  if (!body.query_result) throw new Error("redash query timed out");
  return body.query_result.data.rows;
}

async function fetchViaRedash() {
  const [newRows, callRows, mauRows] = [
    await redashQuery(SQL.newByDay),
    await redashQuery(SQL.callsByDay),
    await redashQuery(SQL.mau),
  ];
  const day = (value) => String(value).slice(0, 10);
  return {
    generatedAt: beijingNowISO(),
    mau: mauRows[0].mau,
    newByDay: newRows.map((row) => [day(row.d), row.n]),
    callsByDay: callRows.map((row) => [day(row.d), row.c, row.u]),
  };
}

function fetchViaOntology() {
  const bin = `${process.env.HOME}/.claude/skills/ontology/ontology`;
  const prompt = `请用 redash（数据源 41，库 ying99_oap）执行以下三个 SQL 并把结果整理成一个 JSON，用 \`\`\`json 代码块原样输出全文，不要截断、不要分析、不要生成文件：
SQL1: ${SQL.newByDay}
SQL2: ${SQL.callsByDay}
SQL3: ${SQL.mau}
输出格式：{"generatedAt":"<北京时间ISO>","mau":<数>,"newByDay":[["YYYY-MM-DD",n],...],"callsByDay":[["YYYY-MM-DD",calls,users],...]}`;
  const out = execFileSync(bin, ["ask", prompt, "--effort", "low", "--wait"], {
    encoding: "utf8",
    timeout: 15 * 60e3,
    maxBuffer: 16 * 1024 * 1024,
  });
  const match = out.match(/```json\s*([\s\S]*?)```/);
  if (!match) throw new Error("ontology answer contained no json block");
  return JSON.parse(match[1]);
}

function buildRows({ newByDay, callsByDay }) {
  const newMap = new Map(newByDay.map(([date, count]) => [date, count]));
  const callMap = new Map(callsByDay.map(([date, calls, users]) => [date, { calls, users }]));
  const firstUser = newByDay[0][0];
  const firstCall = callsByDay[0][0];
  const last = [newByDay.at(-1)[0], callsByDay.at(-1)[0]].sort().at(-1);
  const rows = [];
  let users = 0;
  let calls = 0;
  for (let time = Date.parse(`${firstUser}T00:00:00Z`); ; time += 86400e3) {
    const date = new Date(time).toISOString().slice(0, 10);
    users += newMap.get(date) || 0;
    const call = callMap.get(date);
    if (call) calls += call.calls;
    const started = date >= firstCall;
    rows.push({
      date,
      cumulativeCalls: started ? calls : null,
      cumulativeUsers: users,
      dailyNewUsers: newMap.get(date) || 0,
      dailyCallingUsers: started ? (call ? call.users : 0) : null,
    });
    if (date === last) break;
  }
  return { rows, firstUser, firstCall, last };
}

function buildPayload(source) {
  const { rows, firstUser, firstCall, last } = buildRows(source);
  const latest = rows.at(-1);
  return {
    schema: 1,
    generatedAt: source.generatedAt,
    asOf: last,
    timezone: "Asia/Shanghai",
    rangeLabel: `${firstUser}—${last}`,
    latestMonthlyActiveUsers: source.mau,
    monthlyActiveAsOf: last,
    monthlyActiveDefinition: "滚动近 30 天有调用记录的去重 apiKey 数（OAP 后台官方口径）",
    firstUserRecord: firstUser,
    firstCallRecord: firstCall,
    sourceRecordCounts: {
      cumulativeCalls: source.callsByDay.length,
      dailyCallingUsers: source.callsByDay.length,
      dailyNewUsers: source.newByDay.length,
      cumulativeUsers: source.newByDay.length,
    },
    readings: {
      cumulativeUsers: latest.cumulativeUsers,
      cumulativeCalls: latest.cumulativeCalls,
      mau: source.mau,
    },
    note: `生产库 dw-tidb/ying99_oap 实时聚合，与 Stargate 后台 dashboard 同口径（排除内部测试 apiKey）；${last} 为部分日数据`,
    rows,
  };
}

function bakeIntoPage(payload) {
  for (const dir of ["public", "docs"]) {
    const file = path.join(root, dir, PAGE);
    let html = readFileSync(file, "utf8");
    const metricsPattern = /(<script id="metrics-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
    const current = JSON.parse(html.match(metricsPattern)[2]);
    const baked = {
      ...current,
      asOf: payload.asOf,
      rangeLabel: payload.rangeLabel,
      latestMonthlyActiveUsers: payload.latestMonthlyActiveUsers,
      monthlyActiveAsOf: payload.monthlyActiveAsOf,
      sourceRecordCounts: payload.sourceRecordCounts,
      note: payload.note,
      rows: payload.rows,
    };
    html = html.replace(metricsPattern, (_, open, __, close) => `${open}${JSON.stringify(baked)}${close}`);
    const fmt = (value) => new Intl.NumberFormat("zh-CN").format(value);
    html = html
      .replace(/(<span>累计申请<\/span><strong[^>]*>)[^<]*(<\/strong>)/, `$1${fmt(payload.readings.cumulativeUsers)}$2`)
      .replace(/(<span>总调用量<\/span><strong[^>]*>)[^<]*(<\/strong>)/, `$1${fmt(payload.readings.cumulativeCalls)}$2`)
      .replace(/(<span>月活用户（MAU）<\/span><strong[^>]*>)[^<]*(<\/strong>)/, `$1${fmt(payload.readings.mau)}$2`)
      .replace(/(<b id="cutoff-label">)[^<]*(<\/b>)/, `$1${payload.asOf}$2`)
      .replace(/(<b id="cutoff-foot">)[^<]*(<\/b>)/, `$1${payload.asOf}$2`);
    writeFileSync(file, html);
  }
}

// Both data paths (Redash and ontology) live on the office intranet. Probe
// intranet DNS before querying so an off-VPN run exits quietly (code 2)
// instead of dumping a fetch stack trace every 2 hours.
if (!argValue("--from-file")) {
  try {
    await lookup(new URL(REDASH_URL).hostname);
  } catch {
    console.log(`skipped: intranet DNS unreachable (${new URL(REDASH_URL).hostname}) — not on VPN/office network`);
    process.exit(2);
  }
}

const source = argValue("--from-file")
  ? JSON.parse(readFileSync(argValue("--from-file"), "utf8"))
  : process.env.REDASH_API_KEY
    ? await fetchViaRedash()
    : fetchViaOntology();

if (!Array.isArray(source.newByDay) || source.newByDay.length < 400 || !source.mau) {
  throw new Error(`source data failed sanity check: ${JSON.stringify(source).slice(0, 200)}`);
}

const payload = buildPayload(source);
const envelope = JSON.stringify(payload);
for (const dir of ["public", "docs"]) writeFileSync(path.join(root, dir, LIVE), envelope);
if (flag("--bake")) bakeIntoPage(payload);

console.log(
  `synced asOf=${payload.asOf} users=${payload.readings.cumulativeUsers} calls=${payload.readings.cumulativeCalls} mau=${payload.readings.mau} rows=${payload.rows.length}`,
);

if (flag("--push")) {
  const git = (...cmd) => execFileSync("git", cmd, { cwd: root, encoding: "utf8" });
  const retryNet = async (label, fn, attempts = 3, waitMs = 20000) => {
    for (let i = 1; i <= attempts; i++) {
      try {
        fn();
        return true;
      } catch (err) {
        console.log(`${label} attempt ${i}/${attempts} failed: ${String(err.stderr || err.message).trim().slice(0, 200)}`);
        if (i < attempts) await new Promise((r) => setTimeout(r, waitMs));
      }
    }
    return false;
  };

  // Commit locally BEFORE touching the network so a GitHub outage never
  // strands fresh data in a dirty working tree; the next run's
  // pull --rebase + push picks a pending commit up automatically.
  git("add", `public/${LIVE}`, `docs/${LIVE}`, `public/${PAGE}`, `docs/${PAGE}`);
  if (git("diff", "--cached", "--name-only").trim()) {
    git("commit", "-m", `Sync OAP live metrics (asOf ${payload.asOf}, ${payload.generatedAt})`);
  }
  const ahead = Number(git("rev-list", "--count", "origin/main..HEAD").trim() || "0");
  if (!ahead) {
    console.log("nothing to push");
  } else if (
    (await retryNet("pull --rebase", () => git("pull", "--rebase", "--autostash", "origin", "main"))) &&
    (await retryNet("push", () => git("push", "origin", "main")))
  ) {
    console.log("pushed");
  } else {
    try {
      git("rebase", "--abort"); // clear a half-applied rebase so the tree stays clean
    } catch {}
    console.log("committed locally; push deferred to next run (GitHub unreachable)");
    process.exit(3);
  }
}
