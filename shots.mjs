// Take the site's screenshots with headless Chrome: serve app/ on
// 127.0.0.1, open each view from shots.json, capture a PNG, then convert
// it to a JPEG (quality 4) so each shot stays under the 256 KiB cap, and
// delete the PNG. The site is fully static (fixed data, no clock, no
// randomness), so re-running this writes identical pixels.
//
// Run:  node shots.mjs
// Node 22+, standard library only. Chrome: the puppeteer cache build.

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, statSync, existsSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const here = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(here, 'app');
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

const CHROME = join(homedir(), '.cache/puppeteer/chrome/linux-157.0.8103.78/chrome-linux64/chrome');
if (!existsSync(CHROME)) {
  console.error(`shots: chrome not found at ${CHROME}`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = join(appRoot, pathname);
  if (!file.startsWith(appRoot)) { res.writeHead(403).end(); return; }
  try {
    const bytes = readFileSync(file);
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream', 'content-length': bytes.length });
    res.end(bytes);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: 'ignore' });
    child.on('error', (err) => resolve({ status: 1, error: err }));
    child.on('close', (status) => resolve({ status }));
  });
}

let failed = false;
for (const shot of shots) {
  const target = join(here, 'screenshots', shot.file);
  const png = target.replace(/\.jpg$/i, '.png');
  const url = `http://127.0.0.1:${port}/${shot.path}`;
  const args = [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${shot.viewport.width},${shot.viewport.height}`,
    '--virtual-time-budget=8000',
    `--screenshot=${png}`, url,
  ];
  // spawn (async), not spawnSync: the HTTP server above lives in this same
  // process, and a synchronous wait would block it from answering Chrome.
  const shotRun = await run(CHROME, args);
  if (shotRun.status !== 0) {
    console.error(`shots: chrome failed for ${shot.file}${shotRun.error ? ': ' + shotRun.error.message : ''}`);
    failed = true;
    continue;
  }
  const conv = await run('ffmpeg', ['-y', '-v', 'error', '-i', png, '-q:v', '4', target]);
  rmSync(png, { force: true });
  if (conv.status !== 0) {
    console.error(`shots: ffmpeg failed for ${shot.file}`);
    failed = true;
    continue;
  }
  const size = statSync(target).size;
  console.log(`shots: ${shot.file} ${shot.viewport.width}x${shot.viewport.height} ${size} bytes`);
  if (size > 262144) console.error(`shots: WARNING ${shot.file} is over the 256 KiB cap`);
}
server.close();
if (failed) process.exit(1);
console.log('shots: done');
