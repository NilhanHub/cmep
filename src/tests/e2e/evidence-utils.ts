import { appendFile, copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BrowserContext, Page } from "@playwright/test";

const runDir = process.env.CMEP_EVIDENCE_RUN_DIR ?? null;

async function ensureDir(target: string) {
  await mkdir(target, { recursive: true });
}

async function appendJsonLine(target: string, value: unknown) {
  if (!runDir) return;
  await ensureDir(path.dirname(target));
  await appendFile(target, `${JSON.stringify(value)}\n`, "utf8");
}

async function writeJson(target: string, value: unknown) {
  if (!runDir) return;
  await ensureDir(path.dirname(target));
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function isEvidenceRun() {
  return Boolean(runDir);
}

export async function attachBrowserDiagnostics(context: BrowserContext, page: Page) {
  if (!runDir) return;

  page.on("console", (message) => {
    void appendJsonLine(path.join(runDir, "browser-console.jsonl"), {
      timestamp: new Date().toISOString(),
      type: message.type(),
      text: message.text(),
      location: message.location(),
    });
  });

  page.on("pageerror", (error) => {
    void appendJsonLine(path.join(runDir, "browser-errors.jsonl"), {
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    });
  });

  page.on("requestfailed", (request) => {
    void appendJsonLine(path.join(runDir, "browser-network-failures.jsonl"), {
      timestamp: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
    });
  });

  context.on("response", (response) => {
    void appendJsonLine(path.join(runDir, "browser-network.jsonl"), {
      timestamp: new Date().toISOString(),
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    });
  });
}

export async function captureSurface(page: Page, slug: string) {
  if (!runDir) return;

  const screenshotPath = path.join(runDir, "screenshots", `${slug}.png`);
  const domPath = path.join(runDir, "dom", `${slug}.html`);
  const statePath = path.join(runDir, "ui-states", `${slug}.json`);

  await Promise.all([
    ensureDir(path.dirname(screenshotPath)),
    ensureDir(path.dirname(domPath)),
    ensureDir(path.dirname(statePath)),
  ]);

  await page.screenshot({ path: screenshotPath, fullPage: true });
  await writeFile(domPath, await page.content(), "utf8");
  await writeJson(statePath, {
    slug,
    url: page.url(),
    title: await page.title(),
    headings: await page.locator("h1, h2").allInnerTexts(),
  });
}

export async function finalizeRepresentativeArtifacts(primarySlug: string, finalSlug: string) {
  if (!runDir) return;

  await Promise.all([
    copyFile(path.join(runDir, "screenshots", `${primarySlug}.png`), path.join(runDir, "ui.png")),
    copyFile(path.join(runDir, "dom", `${finalSlug}.html`), path.join(runDir, "dom.html")),
    copyFile(path.join(runDir, "ui-states", `${finalSlug}.json`), path.join(runDir, "ui-state.json")),
  ]);
}

export async function writeScenarioResults(name: string, value: unknown) {
  if (!runDir) return;
  await writeJson(path.join(runDir, `${name}.json`), value);
}
