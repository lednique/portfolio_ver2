import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { detectInitialLanguage, getLanguageMeta, LANGUAGE_CODES, LANGUAGES } from './languages';

const I18nContext = createContext(null);
const dictCache = new Map();

function normalizeKey(str) {
  return String(str).replace(/\s+/g, ' ').trim();
}

function normalizeDashes(str) {
  return str.replace(/[—–]/g, '-');
}

function buildLookup(rawDict) {
  const exact = new Map();
  const dashInsensitive = new Map();
  if (!rawDict) return { exact, dashInsensitive };
  for (const [k, v] of Object.entries(rawDict)) {
    if (typeof v !== 'string' || !v) continue;
    const nk = normalizeKey(k);
    exact.set(nk, v);
    const dk = normalizeDashes(nk);
    if (!dashInsensitive.has(dk)) {
      dashInsensitive.set(dk, v);
    }
  }
  return { exact, dashInsensitive };
}

async function fetchDict(code, bustCache = false) {
  if (code === 'ru') return buildLookup(null);
  if (!bustCache && dictCache.has(code)) return dictCache.get(code);

  const url = bustCache ? `./lang/${code}.json?t=${Date.now()}` : `./lang/${code}.json`;
  // Published dictionaries are immutable between deploys: let the browser reuse
  // them (revalidating via ETag) instead of re-downloading ~26 KB gz on every visit.
  const res = await fetch(url, bustCache ? { cache: 'no-store' } : undefined);
  if (!res.ok) {
    throw new Error(`Failed to load lang/${code}.json (HTTP ${res.status})`);
  }
  const raw = await res.json();
  const lookup = buildLookup(raw);
  dictCache.set(code, lookup);
  return lookup;
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => detectInitialLanguage());
  const [lookup, setLookup] = useState(() => dictCache.get(lang) || buildLookup(null));
  const [loading, setLoading] = useState(lang !== 'ru' && !dictCache.has(lang));

  const langMeta = getLanguageMeta(lang);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dataset.lang = lang;
    root.dir = langMeta.dir;
    try {
      localStorage.setItem('lednique-lang', lang);
    } catch {
      // Ignore
    }
  }, [lang, langMeta.dir]);

  useEffect(() => {
    let cancelled = false;
    if (lang === 'ru') {
      setLookup(buildLookup(null));
      setLoading(false);
      return;
    }
    if (dictCache.has(lang)) {
      setLookup(dictCache.get(lang));
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDict(lang)
      .then((loaded) => {
        if (!cancelled) {
          setLookup(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const setLang = useCallback((nextCode) => {
    if (!LANGUAGE_CODES.includes(nextCode)) return;
    setLangState(nextCode);
  }, []);

  const t = useCallback(
    (source, vars) => {
      if (source == null) return '';
      const raw = String(source);
      if (lang === 'ru' || !raw.trim()) {
        return interpolate(raw, vars);
      }

      const key = normalizeKey(raw);
      let translated = lookup.exact.get(key);
      if (!translated) {
        translated = lookup.dashInsensitive.get(normalizeDashes(key));
      }
      if (!translated) {
        return interpolate(raw, vars);
      }

      // Preserve leading / trailing single space when translating inline spans
      const lead = /^\s/.test(raw) && !/^\s/.test(translated) ? ' ' : '';
      const trail = /\s$/.test(raw) && !/\s$/.test(translated) ? ' ' : '';
      return interpolate(`${lead}${translated}${trail}`, vars);
    },
    [lang, lookup]
  );

  const reloadTranslations = useCallback(async (inMemoryOverrideByLang) => {
    // Merge into in-memory cache immediately (works even with File System Access API) and bust fetch cache
    if (inMemoryOverrideByLang && typeof inMemoryOverrideByLang === 'object') {
      for (const [code, entries] of Object.entries(inMemoryOverrideByLang)) {
        if (!entries || typeof entries !== 'object') continue;
        const existing = dictCache.get(code);
        if (existing) {
          for (const [k, v] of Object.entries(entries)) {
            if (typeof v !== 'string' || !v.trim()) continue;
            const nk = normalizeKey(k);
            existing.exact.set(nk, v.trim());
            existing.dashInsensitive.set(normalizeDashes(nk), v.trim());
          }
        }
      }
    }
    if (lang !== 'ru') {
      try {
        const fresh = await fetchDict(lang, true);
        if (inMemoryOverrideByLang?.[lang]) {
          for (const [k, v] of Object.entries(inMemoryOverrideByLang[lang])) {
            if (typeof v !== 'string' || !v.trim()) continue;
            const nk = normalizeKey(k);
            fresh.exact.set(nk, v.trim());
            fresh.dashInsensitive.set(normalizeDashes(nk), v.trim());
          }
        }
        setLookup({
          exact: new Map(fresh.exact),
          dashInsensitive: new Map(fresh.dashInsensitive),
        });
      } catch {
        const cached = dictCache.get(lang);
        if (cached) {
          setLookup({
            exact: new Map(cached.exact),
            dashInsensitive: new Map(cached.dashInsensitive),
          });
        }
      }
    } else {
      dictCache.clear();
    }
  }, [lang]);

  return (
    <I18nContext.Provider
      value={{
        lang,
        langMeta,
        languages: LANGUAGES,
        setLang,
        t,
        loading,
        isRtl: langMeta.dir === 'rtl',
        reloadTranslations,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
