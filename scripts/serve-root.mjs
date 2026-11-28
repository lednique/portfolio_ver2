import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'content');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const LANG_DIR = path.join(ROOT, 'lang');
const UPLOADS_DIR = path.join(ROOT, 'assets', 'uploads');
const SUPPORTED_TARGET_LANGS = ['en', 'zh', 'ja', 'pt', 'fr', 'ar'];
const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || '0.0.0.0';
const OPEN_ADMIN = process.argv.includes('--open-admin');

const MAX_JSON_BYTES = 10 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 120 * 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.lottie': 'application/zip',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readRequestBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('File or payload exceeds size limit'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sanitizeFileName(rawName, mimeType = '') {
  const base = path.basename(String(rawName || 'file'));
  const parsed = path.parse(base);
  let ext = (parsed.ext || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!ext) {
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';
    else if (mimeType.includes('gif')) ext = '.gif';
    else if (mimeType.includes('svg')) ext = '.svg';
    else if (mimeType.includes('mp4')) ext = '.mp4';
    else if (mimeType.includes('webm')) ext = '.webm';
    else if (mimeType.includes('quicktime')) ext = '.mov';
    else ext = '.jpg';
  }
  const stem = (parsed.name || 'media')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 42) || 'media';
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${stem}-${Date.now().toString(36)}-${suffix}${ext}`;
}

function atomicWriteFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filePath);
}

function openBrowser(url) {
  const cmd =
    process.platform === 'darwin'
      ? `open "${url}"`
      : process.platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', 'http://localhost');
    const urlPath = decodeURIComponent(reqUrl.pathname);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-Upload-Kind',
      });
      res.end();
      return;
    }

    // ─── Local Folder CMS API ───
    if (urlPath === '/api/local-status' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        mode: 'local-server',
        folderName: path.basename(ROOT),
        rootDir: ROOT,
        dataFile: 'content/site-data.json',
        uploadsDir: 'assets/uploads',
      });
      return;
    }

    if (urlPath === '/api/site-data' && req.method === 'GET') {
      if (!fs.existsSync(DATA_FILE)) {
        sendJson(res, 404, { ok: false, error: 'site-data.json not found' });
        return;
      }
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(raw);
      return;
    }

    if (urlPath === '/api/site-data' && req.method === 'POST') {
      const buf = await readRequestBody(req, MAX_JSON_BYTES);
      const parsed = JSON.parse(buf.toString('utf8'));
      if (!parsed || typeof parsed !== 'object' || !parsed.home) {
        sendJson(res, 400, { ok: false, error: 'Invalid site-data payload' });
        return;
      }
      const pretty = `${JSON.stringify(parsed, null, 2)}\n`;
      atomicWriteFile(DATA_FILE, pretty);
      sendJson(res, 200, {
        ok: true,
        path: 'content/site-data.json',
        savedAt: new Date().toISOString(),
        bytes: Buffer.byteLength(pretty, 'utf8'),
      });
      return;
    }

    // Dev-only diagnostics sink: the game audio probe posts its report here so
    // the result can be read from the server log without browser devtools.
    if (urlPath === '/api/debug-report' && req.method === 'POST') {
      const buf = await readRequestBody(req, 1024 * 1024);
      const line = `\n===== BROWSER REPORT ${new Date().toISOString()} =====\n${buf.toString('utf8')}\n===== END REPORT =====\n`;
      console.log(line);
      try {
        fs.appendFileSync(path.join(ROOT, 'debug-report.log'), line);
      } catch {}
      sendJson(res, 200, { ok: true });
      return;
    }

    if (urlPath === '/api/upload' && req.method === 'POST') {
      const buf = await readRequestBody(req, MAX_UPLOAD_BYTES);
      if (!buf.length) {
        sendJson(res, 400, { ok: false, error: 'Empty upload body' });
        return;
      }
      const rawHeader = req.headers['x-file-name'];
      const decodedName = rawHeader ? decodeURIComponent(String(rawHeader)) : 'upload';
      const mimeType = String(req.headers['content-type'] || '');
      const safeName = sanitizeFileName(decodedName, mimeType);
      const targetPath = path.join(UPLOADS_DIR, safeName);
      if (!targetPath.startsWith(UPLOADS_DIR)) {
        sendJson(res, 403, { ok: false, error: 'Forbidden path' });
        return;
      }
      atomicWriteFile(targetPath, buf);
      sendJson(res, 200, {
        ok: true,
        path: `./assets/uploads/${safeName}`,
        fileName: safeName,
        bytes: buf.length,
      });
      return;
    }

    if (urlPath === '/api/lang-merge' && req.method === 'POST') {
      const buf = await readRequestBody(req, MAX_JSON_BYTES);
      const payload = JSON.parse(buf.toString('utf8'));
      if (!payload || typeof payload !== 'object') {
        sendJson(res, 400, { ok: false, error: 'Invalid translation payload' });
        return;
      }
      const updated = {};
      fs.mkdirSync(LANG_DIR, { recursive: true });
      for (const code of SUPPORTED_TARGET_LANGS) {
        const incoming = payload[code];
        if (!incoming || typeof incoming !== 'object') continue;
        const langFile = path.join(LANG_DIR, `${code}.json`);
        let existing = {};
        if (fs.existsSync(langFile)) {
          try {
            existing = JSON.parse(fs.readFileSync(langFile, 'utf8'));
          } catch {
            existing = {};
          }
        }
        let addedCount = 0;
        for (const [k, v] of Object.entries(incoming)) {
          const cleanKey = String(k || '').trim();
          const cleanVal = String(v || '').trim();
          if (cleanKey && cleanVal) {
            existing[cleanKey] = cleanVal;
            addedCount += 1;
          }
        }
        if (addedCount > 0) {
          atomicWriteFile(langFile, `${JSON.stringify(existing, null, 2)}\n`);
          updated[code] = { added: addedCount, total: Object.keys(existing).length };
        }
      }
      sendJson(res, 200, {
        ok: true,
        updated,
        savedAt: new Date().toISOString(),
      });
      return;
    }

    // ─── Static File Serving ───
    let relPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    let filePath = path.resolve(ROOT, relPath);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const isDynamicJson =
      relPath === 'content/site-data.json' || relPath.startsWith('lang/');

    const range = req.headers.range;
    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': isDynamicJson ? 'no-store' : 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: err?.message || 'Server error' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Serving ${ROOT} on http://${HOST}:${PORT}`);
  console.log(`Local settings panel: http://127.0.0.1:${PORT}/#/admin`);
  if (OPEN_ADMIN) {
    openBrowser(`http://127.0.0.1:${PORT}/#/admin`);
  }
});
