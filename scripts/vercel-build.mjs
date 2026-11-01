// Preserve the generated Worker's ESM format in Vercel's Node runtime.
import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
const result = spawnSync(process.execPath, ['scripts/professional-build.mjs'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);
copyFileSync('services/learning/hashir/public-site/worker/index.js', 'server/vercel-worker.mjs');
