import { cloneDefaultCms, DEFAULT_CMS, MAX_MENU_CARDS } from './defaultCms.js';

const HANDLE_DB_NAME = 'lednique-local-folder-v1';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'site-root';

function openHandleDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(HANDLE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(HANDLE_STORE)) {
        db.createObjectStore(HANDLE_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveDirectoryHandle(handle) {
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore if browser restricts handle persistence
  }
}

export async function loadSavedDirectoryHandle() {
  try {
    const db = await openHandleDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearSavedDirectoryHandle() {
  try {
    const db = await openHandleDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export function normalizeCms(raw) {
  const base = cloneDefaultCms();
  if (!raw || typeof raw !== 'object') return base;
  return {
    version: raw.version || base.version,
    home: {
      menuCards: Array.isArray(raw.home?.menuCards)
        ? raw.home.menuCards.slice(0, MAX_MENU_CARDS)
        : base.home.menuCards,
      aiGallery: Array.isArray(raw.home?.aiGallery)
        ? raw.home.aiGallery
        : base.home.aiGallery,
    },
    design: {
      latestCase: raw.design?.latestCase || base.design.latestCase,
      behanceCases: Array.isArray(raw.design?.behanceCases)
        ? raw.design.behanceCases
        : base.design.behanceCases,
      identityGallery: Array.isArray(raw.design?.identityGallery)
        ? raw.design.identityGallery
        : Array.isArray(raw.design?.identity)
          ? raw.design.identity
          : base.design.identityGallery,
      infographicGallery: Array.isArray(raw.design?.infographicGallery)
        ? raw.design.infographicGallery
        : Array.isArray(raw.design?.infographics)
          ? raw.design.infographics
          : base.design.infographicGallery,
    },
    ar: {
      videos: Array.isArray(raw.ar?.videos)
        ? raw.ar.videos
        : Array.isArray(raw.ar?.effects)
          ? raw.ar.effects
          : base.ar.videos,
    },
    ai: {
      heroGallery: Array.isArray(raw.ai?.heroGallery)
        ? raw.ai.heroGallery
        : Array.isArray(raw.ai?.hero)
          ? raw.ai.hero
          : base.ai.heroGallery,
      productGallery: Array.isArray(raw.ai?.productGallery)
        ? raw.ai.productGallery
        : Array.isArray(raw.ai?.products)
          ? raw.ai.products
          : base.ai.productGallery,
      modelGallery: Array.isArray(raw.ai?.modelGallery)
        ? raw.ai.modelGallery
        : Array.isArray(raw.ai?.models)
          ? raw.ai.models
          : base.ai.modelGallery,
    },
  };
}

export function isLocalHostOrigin() {
  if (typeof window === 'undefined') return false;
  const { protocol, hostname } = window.location;
  if (protocol === 'file:') return true;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local')
  );
}

export async function probeLocalServer() {
  if (typeof window === 'undefined' || window.location.protocol === 'file:') {
    return null;
  }
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1600);
    const res = await fetch('./api/local-status', {
      cache: 'no-store',
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    const data = await res.json();
    if (data && data.ok && data.mode === 'local-server') {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchPublishedSiteData() {
  if (typeof window === 'undefined') return cloneDefaultCms();
  try {
    const res = await fetch(`./content/site-data.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return cloneDefaultCms();
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json') && !ct.includes('text/plain')) {
      return cloneDefaultCms();
    }
    const json = await res.json();
    return normalizeCms(json);
  } catch {
    return cloneDefaultCms();
  }
}

export async function saveSiteDataToLocalServer(data) {
  const normalized = normalizeCms(data);
  const res = await fetch('./api/site-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(normalized),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function uploadFileToLocalServer(file, kind = 'image') {
  const fileName = file.name || (kind === 'video' ? 'video.mp4' : 'image.jpg');
  const res = await fetch('./api/upload', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(fileName),
      'X-Upload-Kind': kind,
    },
    body: file,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok || !json?.path) {
    throw new Error(json?.error || `Upload failed (HTTP ${res.status})`);
  }
  return json.path;
}

function sanitizeLocalFileName(rawName, mimeType = '') {
  const parts = String(rawName || 'media').split('.');
  let ext = parts.length > 1 ? `.${parts.pop().toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
  if (!ext) {
    if (mimeType.includes('png')) ext = '.png';
    else if (mimeType.includes('webp')) ext = '.webp';
    else if (mimeType.includes('gif')) ext = '.gif';
    else if (mimeType.includes('svg')) ext = '.svg';
    else if (mimeType.includes('mp4')) ext = '.mp4';
    else if (mimeType.includes('webm')) ext = '.webm';
    else ext = '.jpg';
  }
  const stem =
    parts
      .join('.')
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 42) || 'media';
  const rand = Math.random().toString(36).slice(2, 7);
  return `${stem}-${Date.now().toString(36)}-${rand}${ext}`;
}

export async function ensureDirectoryPermission(handle, mode = 'readwrite') {
  if (!handle) return false;
  if (typeof handle.queryPermission === 'function') {
    const q = await handle.queryPermission({ mode });
    if (q === 'granted') return true;
  }
  if (typeof handle.requestPermission === 'function') {
    const r = await handle.requestPermission({ mode });
    return r === 'granted';
  }
  return true;
}

export async function readSiteDataFromFolder(dirHandle) {
  try {
    const contentDir = await dirHandle.getDirectoryHandle('content');
    const fileHandle = await contentDir.getFileHandle('site-data.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    return normalizeCms(JSON.parse(text));
  } catch {
    return null;
  }
}

export async function writeSiteDataToFolder(dirHandle, data) {
  const normalized = normalizeCms(data);
  const contentDir = await dirHandle.getDirectoryHandle('content', { create: true });
  const fileHandle = await contentDir.getFileHandle('site-data.json', { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(`${JSON.stringify(normalized, null, 2)}\n`);
  await writable.close();
  return {
    ok: true,
    path: 'content/site-data.json',
    savedAt: new Date().toISOString(),
  };
}

export async function writeUploadToFolder(dirHandle, file, kind = 'image') {
  const assetsDir = await dirHandle.getDirectoryHandle('assets', { create: true });
  const uploadsDir = await assetsDir.getDirectoryHandle('uploads', { create: true });
  const safeName = sanitizeLocalFileName(
    file.name || (kind === 'video' ? 'video.mp4' : 'image.jpg'),
    file.type || ''
  );
  const fileHandle = await uploadsDir.getFileHandle(safeName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
  return `./assets/uploads/${safeName}`;
}

export function generateVideoPosterBlob(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    const fail = () => {
      cleanup();
      resolve(null);
    };

    const timer = window.setTimeout(fail, 6000);

    video.addEventListener('error', () => {
      window.clearTimeout(timer);
      fail();
    });

    video.addEventListener('loadeddata', () => {
      try {
        video.currentTime = Math.min(0.4, (video.duration || 1) * 0.15);
      } catch {
        // Fallback to frame 0
      }
    });

    video.addEventListener('seeked', () => {
      window.clearTimeout(timer);
      try {
        const w = video.videoWidth || 540;
        const h = video.videoHeight || 960;
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 720 / Math.max(w, h));
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              resolve(null);
              return;
            }
            const stem = (file.name || 'poster').replace(/\.[^.]+$/, '');
            const posterFile = new File([blob], `${stem}-poster.jpg`, {
              type: 'image/jpeg',
            });
            resolve(posterFile);
          },
          'image/jpeg',
          0.86
        );
      } catch {
        fail();
      }
    });
  });
}

export function downloadJsonFile(data, fileName = 'site-data.json') {
  const normalized = normalizeCms(data);
  const blob = new Blob([`${JSON.stringify(normalized, null, 2)}\n`], {
    type: 'application/json; charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const TARGET_TRANSLATION_LANGS = ['en', 'zh', 'ja', 'pt', 'fr', 'ar'];

export async function mergeTranslationsToLocalServer(byLang) {
  const res = await fetch('./api/lang-merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(byLang),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export async function mergeTranslationsToFolder(dirHandle, byLang) {
  const langDir = await dirHandle.getDirectoryHandle('lang', { create: true });
  const updated = {};
  for (const code of TARGET_TRANSLATION_LANGS) {
    const incoming = byLang[code];
    if (!incoming || typeof incoming !== 'object') continue;
    let existing = {};
    try {
      const fh = await langDir.getFileHandle(`${code}.json`);
      const file = await fh.getFile();
      existing = JSON.parse(await file.text());
    } catch {
      // Fallback: fetch current published dictionary so we don't wipe existing keys
      try {
        const res = await fetch(`./lang/${code}.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) existing = await res.json();
      } catch {
        existing = {};
      }
    }
    let added = 0;
    for (const [k, v] of Object.entries(incoming)) {
      const ck = String(k || '').trim();
      const cv = String(v || '').trim();
      if (ck && cv) {
        existing[ck] = cv;
        added += 1;
      }
    }
    if (added > 0) {
      const fh = await langDir.getFileHandle(`${code}.json`, { create: true });
      const writable = await fh.createWritable();
      await writable.write(`${JSON.stringify(existing, null, 2)}\n`);
      await writable.close();
      updated[code] = { added, total: Object.keys(existing).length };
    }
  }
  return { ok: true, updated, savedAt: new Date().toISOString() };
}

/**
 * Smart parser for AI-generated translation output.
 * Accepts:
 *  - Raw JSON or ```json ... ``` markdown block
 *  - Language-grouped: { "en": { "Русский": "English" }, "zh": { ... }, ... }
 *  - Key-grouped:      { "Русский": { "en": "English", "zh": "...", ... } }
 */
export function parseAiTranslationsInput(rawText) {
  const text = String(rawText || '').trim();
  if (!text) {
    throw new Error('Поле пустое — вставьте JSON-ответ от ИИ.');
  }

  // Strip optional markdown code fences or surrounding prose
  let candidate = text;
  const fenceMatch = text.match(/```(?:json|js|javascript)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    candidate = fenceMatch[1].trim();
  }
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidate = candidate.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch (err) {
    throw new Error(`Не удалось разобрать JSON (${err.message}). Проверьте, что вставлен полный блок от { до }.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Ожидался JSON-объект с переводами по языкам (en, zh, ja, pt, fr, ar).');
  }

  const byLang = {};
  for (const code of TARGET_TRANSLATION_LANGS) byLang[code] = {};

  const topKeys = Object.keys(parsed);
  const isLangGrouped = topKeys.some((k) => TARGET_TRANSLATION_LANGS.includes(k.toLowerCase()));

  if (isLangGrouped) {
    for (const [rawCode, entries] of Object.entries(parsed)) {
      const code = rawCode.toLowerCase();
      if (!TARGET_TRANSLATION_LANGS.includes(code) || !entries || typeof entries !== 'object') {
        continue;
      }
      for (const [ruKey, trVal] of Object.entries(entries)) {
        const ck = String(ruKey || '').trim();
        const cv = String(trVal || '').trim();
        if (ck && cv) byLang[code][ck] = cv;
      }
    }
  } else {
    // Key-grouped: { "Привет": { "en": "Hello", "zh": "你好", ... } }
    for (const [ruKey, langMap] of Object.entries(parsed)) {
      const ck = String(ruKey || '').trim();
      if (!ck || !langMap || typeof langMap !== 'object') continue;
      for (const [rawCode, trVal] of Object.entries(langMap)) {
        const code = rawCode.toLowerCase();
        const cv = String(trVal || '').trim();
        if (TARGET_TRANSLATION_LANGS.includes(code) && cv) {
          byLang[code][ck] = cv;
        }
      }
    }
  }

  const summary = {};
  let totalPairs = 0;
  for (const code of TARGET_TRANSLATION_LANGS) {
    const count = Object.keys(byLang[code]).length;
    summary[code] = count;
    totalPairs += count;
  }

  if (totalPairs === 0) {
    throw new Error('В вставленном JSON не найдено переводов для языков en, zh, ja, pt, fr, ar.');
  }

  return { byLang, summary, totalPairs };
}

export function uid(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export { DEFAULT_CMS, MAX_MENU_CARDS };
