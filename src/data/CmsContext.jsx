import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  clearSavedDirectoryHandle,
  downloadJsonFile,
  ensureDirectoryPermission,
  fetchPublishedSiteData,
  generateVideoPosterBlob,
  isLocalHostOrigin,
  loadSavedDirectoryHandle,
  mergeTranslationsToFolder,
  mergeTranslationsToLocalServer,
  normalizeCms,
  probeLocalServer,
  readSiteDataFromFolder,
  saveDirectoryHandle,
  saveSiteDataToLocalServer,
  uploadFileToLocalServer,
  writeSiteDataToFolder,
  writeUploadToFolder,
} from './cmsStore';
import { cloneDefaultCms } from './defaultCms';

const CmsContext = createContext(null);

export function CmsProvider({ children }) {
  const [cms, setCmsState] = useState(() => cloneDefaultCms());
  const [ready, setReady] = useState(false);

  // Local folder storage state
  const [serverInfo, setServerInfo] = useState(null);
  const [folderHandle, setFolderHandle] = useState(null);
  const [savedFolderName, setSavedFolderName] = useState('');
  const [previewUrlMap, setPreviewUrlMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const localHost = isLocalHostOrigin();
  const supportsDirectoryPicker =
    typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

  // Refs for fresh async access
  const serverInfoRef = useRef(serverInfo);
  const folderHandleRef = useRef(folderHandle);
  serverInfoRef.current = serverInfo;
  folderHandleRef.current = folderHandle;

  // Initial load: fetch ./content/site-data.json + probe local server + inspect saved handle
  useEffect(() => {
    let active = true;
    (async () => {
      const [published, srv, savedHandle] = await Promise.all([
        fetchPublishedSiteData(),
        probeLocalServer(),
        loadSavedDirectoryHandle(),
      ]);
      if (!active) return;

      setCmsState(published);
      setServerInfo(srv);

      if (savedHandle) {
        setSavedFolderName(savedHandle.name || '');
        // Only auto-attach if browser already granted readwrite without prompting
        try {
          if (typeof savedHandle.queryPermission === 'function') {
            const state = await savedHandle.queryPermission({ mode: 'readwrite' });
            if (state === 'granted' && active) {
              setFolderHandle(savedHandle);
              if (!srv) {
                const fromDisk = await readSiteDataFromFolder(savedHandle);
                if (fromDisk && active) setCmsState(fromDisk);
              }
            }
          }
        } catch {
          // Ignore
        }
      }

      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Revoke any local preview blob URLs on unmount
  const previewUrlsRef = useRef([]);
  useEffect(() => {
    return () => {
      for (const u of previewUrlsRef.current) {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const storageMode = serverInfo
    ? 'local-server'
    : folderHandle
      ? 'folder-handle'
      : 'readonly';

  const canWriteToFolder = storageMode === 'local-server' || storageMode === 'folder-handle';
  const canShowAdminInMenu = Boolean(serverInfo) || localHost || Boolean(folderHandle);
  const folderName = serverInfo?.folderName || folderHandle?.name || savedFolderName || '';

  const persistToDisk = useCallback(async (nextData) => {
    const srv = serverInfoRef.current;
    const handle = folderHandleRef.current;

    if (!srv && !handle) {
      return { saved: false, mode: 'memory-only' };
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (srv) {
        const res = await saveSiteDataToLocalServer(nextData);
        setLastSavedAt(res.savedAt || new Date().toISOString());
        return { saved: true, mode: 'local-server' };
      }
      if (handle) {
        const granted = await ensureDirectoryPermission(handle, 'readwrite');
        if (!granted) {
          throw new Error('Нет разрешения на запись в выбранную папку сайта');
        }
        const res = await writeSiteDataToFolder(handle, nextData);
        setLastSavedAt(res.savedAt || new Date().toISOString());
        return { saved: true, mode: 'folder-handle' };
      }
    } catch (err) {
      setSaveError(err?.message || 'Ошибка сохранения в папку сайта');
      throw err;
    } finally {
      setSaving(false);
    }
    return { saved: false, mode: 'readonly' };
  }, []);

  const updateCms = useCallback(
    (updater) => {
      setCmsState((prev) => {
        const next = normalizeCms(typeof updater === 'function' ? updater(prev) : updater);
        persistToDisk(next).catch(() => {});
        return next;
      });
    },
    [persistToDisk]
  );

  const connectFolder = useCallback(async () => {
    if (!supportsDirectoryPicker) {
      throw new Error(
        'Ваш браузер не поддерживает прямой доступ к папке. Запустите open-settings.command (macOS) или open-settings.bat (Windows) в папке сайта.'
      );
    }
    const handle = await window.showDirectoryPicker({
      id: 'lednique-portfolio-folder',
      mode: 'readwrite',
    });
    const granted = await ensureDirectoryPermission(handle, 'readwrite');
    if (!granted) {
      throw new Error('Доступ к записи в папку не предоставлен');
    }
    await saveDirectoryHandle(handle);
    setFolderHandle(handle);
    folderHandleRef.current = handle;
    setSavedFolderName(handle.name || '');
    setSaveError(null);

    const existing = await readSiteDataFromFolder(handle);
    if (existing) {
      setCmsState(existing);
    } else {
      // Seed content/site-data.json into the picked folder right away
      await writeSiteDataToFolder(handle, cms);
      setLastSavedAt(new Date().toISOString());
    }
    return handle;
  }, [supportsDirectoryPicker, cms]);

  const reconnectSavedFolder = useCallback(async () => {
    const saved = await loadSavedDirectoryHandle();
    if (!saved) return connectFolder();
    const granted = await ensureDirectoryPermission(saved, 'readwrite');
    if (!granted) {
      throw new Error('Доступ к записи в папку не предоставлен');
    }
    setFolderHandle(saved);
    folderHandleRef.current = saved;
    setSavedFolderName(saved.name || '');
    const existing = await readSiteDataFromFolder(saved);
    if (existing) setCmsState(existing);
    return saved;
  }, [connectFolder]);

  const disconnectFolder = useCallback(async () => {
    await clearSavedDirectoryHandle();
    setFolderHandle(null);
    folderHandleRef.current = null;
    setSavedFolderName('');
  }, []);

  const uploadMedia = useCallback(async (file, kind = 'image') => {
    const srv = serverInfoRef.current;
    const handle = folderHandleRef.current;

    if (srv) {
      const savedPath = await uploadFileToLocalServer(file, kind);
      return savedPath;
    }

    if (handle) {
      const granted = await ensureDirectoryPermission(handle, 'readwrite');
      if (!granted) {
        throw new Error('Нет доступа на запись в выбранную папку сайта');
      }
      const savedPath = await writeUploadToFolder(handle, file, kind);
      // Create instant blob preview URL because static page on another origin can't fetch newly written local disk files via relative HTTP until uploaded
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      setPreviewUrlMap((prev) => ({ ...prev, [savedPath]: previewUrl }));
      return savedPath;
    }

    throw new Error(
      'Сначала подключите локальную папку сайта или запустите open-settings.command / open-settings.bat, чтобы загруженные файлы сохранялись прямо в assets/uploads/.'
    );
  }, []);

  const uploadVideoWithPoster = useCallback(
    async (file) => {
      const videoSrc = await uploadMedia(file, 'video');
      let posterSrc = '';
      try {
        const posterFile = await generateVideoPosterBlob(file);
        if (posterFile) {
          posterSrc = await uploadMedia(posterFile, 'poster');
        }
      } catch {
        // Ignore poster auto-gen failure
      }
      return { videoSrc, posterSrc };
    },
    [uploadMedia]
  );

  const resolveUrl = useCallback(
    (src) => {
      if (!src) return '';
      if (previewUrlMap[src]) return previewUrlMap[src];
      return src;
    },
    [previewUrlMap]
  );

  const exportConfig = useCallback(() => {
    downloadJsonFile(cms, 'site-data.json');
  }, [cms]);

  const importConfig = useCallback(
    async (file) => {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const next = normalizeCms(parsed);
      setCmsState(next);
      await persistToDisk(next);
      return next;
    },
    [persistToDisk]
  );

  const resetAll = useCallback(async () => {
    const fresh = cloneDefaultCms();
    setCmsState(fresh);
    await persistToDisk(fresh);
    return fresh;
  }, [persistToDisk]);

  const saveNow = useCallback(async () => {
    return persistToDisk(cms);
  }, [cms, persistToDisk]);

  const applyAiTranslations = useCallback(async (byLang) => {
    const srv = serverInfoRef.current;
    const handle = folderHandleRef.current;
    if (srv) {
      setSaving(true);
      setSaveError(null);
      try {
        const res = await mergeTranslationsToLocalServer(byLang);
        setLastSavedAt(res.savedAt || new Date().toISOString());
        return res;
      } catch (err) {
        setSaveError(err?.message || 'Ошибка сохранения переводов');
        throw err;
      } finally {
        setSaving(false);
      }
    }
    if (handle) {
      setSaving(true);
      setSaveError(null);
      try {
        const granted = await ensureDirectoryPermission(handle, 'readwrite');
        if (!granted) throw new Error('Нет доступа на запись в выбранную папку сайта');
        const res = await mergeTranslationsToFolder(handle, byLang);
        setLastSavedAt(res.savedAt || new Date().toISOString());
        return res;
      } catch (err) {
        setSaveError(err?.message || 'Ошибка сохранения переводов');
        throw err;
      } finally {
        setSaving(false);
      }
    }
    throw new Error(
      'Сначала подключите папку сайта или запустите open-settings.command / open-settings.bat, чтобы записать переводы в lang/*.json.'
    );
  }, []);

  return (
    <CmsContext.Provider
      value={{
        cms,
        ready,
        updateCms,
        resolveUrl,
        uploadMedia,
        uploadVideoWithPoster,
        exportConfig,
        importConfig,
        resetAll,
        saveNow,
        applyAiTranslations,
        // Local folder storage status
        storageMode,
        canWriteToFolder,
        canShowAdminInMenu,
        localHost,
        serverInfo,
        folderName,
        savedFolderName,
        supportsDirectoryPicker,
        connectFolder,
        reconnectSavedFolder,
        disconnectFolder,
        saving,
        lastSavedAt,
        saveError,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCms must be used within CmsProvider');
  }
  return ctx;
}
