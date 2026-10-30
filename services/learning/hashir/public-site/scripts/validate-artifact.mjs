/* Copyright © 2026 Robé Berry. All rights reserved. See COPYRIGHT.md. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);
const appAsset = await workerModule.default.fetch(new Request('https://showonce.test/app.js'), {}, {});
assert.equal(appAsset.status, 200);
const appSource = await appAsset.text();
assert.ok(appSource.indexOf('ShowOnceLibrary') >= 0 && appSource.indexOf('ShowOnceLibrary') < appSource.indexOf('function loadLibrary'), 'The served app must contain its library dependency before its consumer');

console.log("Artifact is valid ESM and exports default.fetch");
