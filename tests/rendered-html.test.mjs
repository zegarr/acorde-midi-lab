import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the ACORDE 3 application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /ACORDE 3/);
  assert.match(html, /ruta interactiva de piano moderno/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("ships the complete local learning model and MIDI trainers", async () => {
  const [page, learning, staff, packageJson, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/learning.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/MusicStaff.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /acorde-learning-v3/);
  assert.match(page, /acorde-practice-v2/);
  assert.match(page, /diagnosticStep/);
  assert.match(page, /rhythmStartRef/);
  assert.match(page, /velocityCalibration/);
  assert.match(page, /note === 64/);
  assert.match(page, /Exportar/);
  assert.match(page, /Importar/);
  assert.match(learning, /type CurriculumUnit/);
  assert.match(learning, /type ExerciseDefinition/);
  assert.match(learning, /type AttemptResult/);
  assert.match(learning, /type SkillMastery/);
  assert.match(learning, /type PracticeProfile/);
  assert.match(learning, /type DailySession/);
  assert.equal((learning.match(/id: "n[1-5]-/g) ?? []).length, 25);
  assert.match(staff, /import\("vexflow"\)/);
  assert.match(packageJson, /"vexflow"/);
  assert.match(layout, /og-learning\.png/);
});
