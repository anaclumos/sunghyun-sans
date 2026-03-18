import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(scriptDir, "..");
const sourceDir = resolve(siteDir, "..", "dist", "web");
const targetDir = resolve(siteDir, "public", "dist");
const requiredEntries = ["css", "woff2", "woff2-dynamic-subset"];
const requiredCssFiles = [
  "sunghyun-sans-dynamic-subset.min.css",
  "sunghyun-sans-kr-dynamic-subset.min.css",
  "sunghyun-sans-jp-dynamic-subset.min.css",
  "sunghyun-sans-kr-hanja-dynamic-subset.min.css",
  "sunghyun-sans-disambiguated-dynamic-subset.min.css",
];

if (!existsSync(sourceDir)) {
  throw new Error(
    `Missing web release assets at ${sourceDir}. Run \`uv run python scripts/build-web-dist.py\` from the repo root first.`
  );
}

for (const entry of requiredEntries) {
  const entryPath = resolve(sourceDir, entry);
  if (!existsSync(entryPath)) {
    throw new Error(`Incomplete web release assets: missing ${entryPath}`);
  }
}

for (const cssFile of requiredCssFiles) {
  const cssPath = resolve(sourceDir, "css", cssFile);
  if (!existsSync(cssPath)) {
    throw new Error(`Incomplete web release assets: missing ${cssPath}`);
  }
}

mkdirSync(resolve(siteDir, "public"), { recursive: true });
rmSync(targetDir, { recursive: true, force: true });
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Synced ${sourceDir} -> ${targetDir}`);
