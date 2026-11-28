import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const RouterContext = createContext(null);

const ROUTES = new Set(['/', '/design', '/ai', '/ar', '/resume', '/admin']);

export function parseLocationHash(hashStr = window.location.hash) {
  const raw = (hashStr || '').replace(/^#/, '');
  if (!raw || raw === '/') {
    return { path: '/', anchor: '' };
  }
  if (raw.startsWith('/')) {
    const hashIdx = raw.indexOf('#');
    const qIdx = raw.indexOf('?');
    let pathPart = raw;
    let anchor = '';
    if (hashIdx !== -1) {
      pathPart = raw.slice(0, hashIdx);
      anchor = raw.slice(hashIdx + 1);
    } else if (qIdx !== -1) {
      pathPart = raw.slice(0, qIdx);
    }
    const cleanPath = pathPart === '' ? '/' : pathPart.replace(/\/+$/, '') || '/';
    if (ROUTES.has(cleanPath)) {
      return { path: cleanPath, anchor };
    }
    if (cleanPath === '/graphic') return { path: '/design', anchor };
    return { path: '/', anchor: '' };
  }
  // Legacy anchor like #about, #request, #design, #ai, #ar
  return { path: '/', anchor: raw };
}

export function RouterProvider({ children }) {
  const [loc, setLoc] = useState(() => parseLocationHash());

  useEffect(() => {
    const onHashChange = () => {
      setLoc(parseLocationHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((target, options = {}) => {
    const { anchor = '', replace = false } = options;
    if (!target) return;

    // External URL
    if (/^https?:\/\//i.test(target) || target.startsWith('mailto:')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    // Normalize `#/design` or `/design` or `#about`
    let nextPath = '/';
    let nextAnchor = anchor;
    if (target.startsWith('#/')) {
      const parsed = parseLocationHash(target);
      nextPath = parsed.path;
      nextAnchor = nextAnchor || parsed.anchor;
    } else if (target.startsWith('/')) {
      const parsed = parseLocationHash('#' + target);
      nextPath = parsed.path;
      nextAnchor = nextAnchor || parsed.anchor;
    } else if (target.startsWith('#')) {
      nextPath = loc.path;
      nextAnchor = target.slice(1);
    } else {
      nextPath = '/';
    }

    const hashUrl = nextAnchor
      ? `#${nextPath}#${nextAnchor}`
      : `#${nextPath}`;

    if (replace) {
      window.history.replaceState(null, '', hashUrl);
      setLoc({ path: nextPath, anchor: nextAnchor });
    } else if (window.location.hash !== hashUrl) {
      window.location.hash = hashUrl;
    } else {
      setLoc({ path: nextPath, anchor: nextAnchor });
    }

    if (nextAnchor) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(nextAnchor);
          if (el) {
            const reduced =
              document.documentElement.dataset.a11y === 'true' ||
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const behavior = reduced ? 'auto' : 'smooth';

            if (nextAnchor === 'about') {
              // Anchor to the very top of the block (avatar + name), keeping a
              // constant 40px gap below the fixed menu instead of centering it.
              const menu = document.querySelector('.menu');
              const menuBottom = menu
                ? menu.getBoundingClientRect().bottom
                : parseFloat(
                    getComputedStyle(document.documentElement).getPropertyValue('--menu-bottom')
                  ) || 0;
              const padTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
              const top = window.scrollY + el.getBoundingClientRect().top + padTop - menuBottom - 40;
              window.scrollTo({ top: Math.max(0, Math.round(top)), behavior });
            } else {
              el.scrollIntoView({ behavior, block: 'start' });
            }
          }
        }, 60);
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [loc.path]);

  return (
    <RouterContext.Provider value={{ path: loc.path, anchor: loc.anchor, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}
