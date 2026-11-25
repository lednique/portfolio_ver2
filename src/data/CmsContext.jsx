import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { cloneDefaultCms } from './defaultCms';
import {
  clearCmsStorage,
  loadAllMediaUrls,
  loadCmsState,
  saveCmsState,
  saveMediaBlob,
} from './cmsStore';

const CmsContext = createContext(null);

export function CmsProvider({ children }) {
  const [cms, setCms] = useState(() => cloneDefaultCms());
  const [mediaUrls, setMediaUrls] = useState(() => new Map());
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const [loadedState, loadedUrls] = await Promise.all([
        loadCmsState(),
        loadAllMediaUrls(),
      ]);
      if (!active) return;
      setCms(loadedState);
      setMediaUrls(loadedUrls);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((nextState) => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveCmsState(nextState);
      setSaveStatus('saved');
    }, 120);
  }, []);

  const updateCms = useCallback(
    (updater) => {
      setCms((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const uploadMedia = useCallback(async (fileOrBlob) => {
    const { ref, url } = await saveMediaBlob(fileOrBlob);
    if (ref.startsWith('idb://')) {
      setMediaUrls((prev) => {
        const next = new Map(prev);
        next.set(ref, url);
        return next;
      });
    }
    return ref;
  }, []);

  const resolveMedia = useCallback(
    (ref) => {
      if (!ref) return '';
      if (ref.startsWith('idb://')) {
        return mediaUrls.get(ref) || '';
      }
      return ref;
    },
    [mediaUrls]
  );

  const resetCms = useCallback(async () => {
    const fresh = await clearCmsStorage();
    setMediaUrls(new Map());
    setCms(fresh);
    setSaveStatus('saved');
  }, []);

  const value = useMemo(
    () => ({
      cms,
      ready,
      saveStatus,
      updateCms,
      uploadMedia,
      resolveMedia,
      resetCms,
    }),
    [cms, ready, saveStatus, updateCms, uploadMedia, resolveMedia, resetCms]
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used inside CmsProvider');
  return ctx;
}
