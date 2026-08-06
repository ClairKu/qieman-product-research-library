import { readFile, writeFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";

const password = String(process.env.REPORT_PASSWORD || "").trim();
if (!password) throw new Error("REPORT_PASSWORD is required for the one-time legacy migration");

const targets = [
  "public/pages/oap/oap-reporting-framework-2026-07-28.html",
  "public/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html",
  "docs/pages/oap/oap-reporting-framework-2026-07-28.html",
  "docs/pages/oap/oap-h2-okr-iteration-review-2026-07-31.html",
];
const decode = (value) => Buffer.from(value, "base64");

for (const target of targets) {
  const wrapper = await readFile(target, "utf8");
  const match = wrapper.match(/const\s+payload\s*=\s*(\{"salt":"[^"]+","iv":"[^"]+","data":"[^"]+"(?:,"iterations":\d+)?\})\s*;/);
  if (!match) {
    console.log(`${target}\talready public`);
    continue;
  }
  const payload = JSON.parse(match[1]);
  const material = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await webcrypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: decode(payload.salt),
      iterations: payload.iterations || 210000,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plain = new TextDecoder().decode(await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(payload.iv) },
    key,
    decode(payload.data),
  ));
  if (!/<html[\s>]/i.test(plain)) throw new Error(`${target}: decrypted content is not HTML`);
  await writeFile(target, plain, "utf8");
  console.log(`${target}\tpublic`);
}
