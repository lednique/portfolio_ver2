import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

let scriptPromise = null;

function ensureShowcaseScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (typeof window.__mountLedniqueInvitation === 'function') {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = './assets/invitation/showcase.js?v=20261125a';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (err) => {
        scriptPromise = null;
        reject(err);
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export function InvitationShowcase() {
  const { t } = useI18n();
  const hostRef = useRef(null);
  const [theme, setTheme] = useState(
    () => (typeof document !== 'undefined' && document.documentElement.dataset.theme) || 'dark'
  );

  // Keep Shadow DOM theme in sync with page light/dark theme
  useEffect(() => {
    const sync = () => {
      setTheme(document.documentElement.dataset.theme || 'dark');
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // Mount the original WebGL 3D invitation + postbox showcase cleanly
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let cancelled = false;
    let unmount = null;

    ensureShowcaseScript()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        if (typeof window.__mountLedniqueInvitation === 'function') {
          unmount = window.__mountLedniqueInvitation(hostRef.current);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (typeof unmount === 'function') unmount();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="invitation-showcase__stage"
      data-invitation-demo=""
      data-theme={theme}
      role="region"
      aria-label={t(
        'Демонстрация интерактивного приглашения: код A5 вводится автоматически, открытку можно повернуть'
      )}
    />
  );
}
