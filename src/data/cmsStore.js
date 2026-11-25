import { DEFAULT_CMS, cloneDefaultCms } from './defaultCms';

const DB_NAME = 'lednique_portfolio_cms_v2';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const MEDIA_STORE = 'media';
const STATE_KEY = 'cms_config';
const LS_FALLBACK_KEY = 'lednique_cms_v2_fallback';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
  return dbPromise;
}

function mergeWithDefaults(saved) {
  const def = cloneDefaultCms();
  if (!saved || typeof saved !== 'object') return def;
  return {
    version: def.version,
    home: {
      menuCards: Array.isArray(saved.home?.menuCards) ? saved.home.menuCards : def.home.menuCards,
      aiGallery: Array.isArray(saved.home?.aiGallery) && saved.home.aiGallery.length > 0
        ? saved.home.aiGallery
        : def.home.aiGallery,
    },
    design: {
      latestCase: {
        ...def.design.latestCase,
        ...(saved.design?.latestCase || {}),
      },
      identityGallery: Array.isArray(saved.design?.identityGallery)
        ? saved.design.identityGallery
        : def.design.identityGallery,
      infographicGallery: Array.isArray(saved.design?.infographicGallery)
        ? saved.design.infographicGallery
        : def.design.infographicGallery,
    },
    ar: {
      videos: Array.isArray(saved.ar?.videos) ? saved.ar.videos : def.ar.videos,
    },
    ai: {
      heroGallery: Array.isArray(saved.ai?.heroGallery) ? saved.ai.heroGallery : def.ai.heroGallery,
      productGallery: Array.isArray(saved.ai?.productGallery)
        ? saved.ai.productGallery
        : def.ai.productGallery,
      modelGallery: Array.isArray(saved.ai?.modelGallery)
        ? saved.ai.modelGallery
        : def.ai.modelGallery,
    },
  };
}

export async function loadCmsState() {
  try {
    const db = await openDb();
    const raw = await new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readonly');
      const req = tx.objectStore(STATE_STORE).get(STATE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (raw) return mergeWithDefaults(raw);
  } catch {
    // Fallback to localStorage below
  }
  try {
    const ls = localStorage.getItem(LS_FALLBACK_KEY);
    if (ls) return mergeWithDefaults(JSON.parse(ls));
  } catch {
    // Ignore storage errors
  }
  return cloneDefaultCms();
}

export async function saveCmsState(state) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readwrite');
      tx.objectStore(STATE_STORE).put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback below
  }
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota overflow for large inline data
  }
}

export async function saveMediaBlob(fileOrBlob) {
  const id = `idb://media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      tx.objectStore(MEDIA_STORE).put(
        {
          blob: fileOrBlob,
          type: fileOrBlob.type || 'application/octet-stream',
          name: fileOrBlob.name || 'upload',
          createdAt: Date.now(),
        },
        id
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return {
      ref: id,
      url: URL.createObjectURL(fileOrBlob),
    };
  } catch {
    // Fallback to data URL when IndexedDB is blocked
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(fileOrBlob);
    });
    return { ref: dataUrl, url: dataUrl };
  }
}

export async function loadAllMediaUrls() {
  const map = new Map();
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readonly');
      const store = tx.objectStore(MEDIA_STORE);
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor) {
          const val = cursor.value;
          if (val && val.blob) {
            map.set(String(cursor.key), URL.createObjectURL(val.blob));
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  } catch {
    // Ignore
  }
  return map;
}

export async function clearCmsStorage() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STATE_STORE, MEDIA_STORE], 'readwrite');
      tx.objectStore(STATE_STORE).clear();
      tx.objectStore(MEDIA_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // Ignore
  }
  return cloneDefaultCms();
}

export async function captureVideoPoster(videoFile) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;

    let settled = false;
    const finish = (blob) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(blob);
    };

    const timer = setTimeout(() => finish(null), 3500);

    video.addEventListener('loadeddata', () => {
      try {
        video.currentTime = Math.min(0.25, video.duration ? video.duration * 0.1 : 0);
      } catch {
        // Fallback immediately
      }
    });

    video.addEventListener('seeked', () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        const w = video.videoWidth || 540;
        const h = video.videoHeight || 960;
        const maxW = 540;
        const scale = Math.min(1, maxW / w);
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => finish(blob), 'image/jpeg', 0.84);
      } catch {
        finish(null);
      }
    });

    video.addEventListener('error', () => {
      clearTimeout(timer);
      finish(null);
    });
  });
}

export function uid(prefix = 'item') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export { DEFAULT_CMS };
