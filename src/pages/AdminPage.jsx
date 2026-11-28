import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { extractBehanceEmbedUrl } from '../data/behance';
import {
  MAX_MENU_CARDS,
  parseAiTranslationsInput,
  TARGET_TRANSLATION_LANGS,
  uid,
} from '../data/cmsStore';
import { useI18n } from '../i18n/I18nContext';
import { LANGUAGES } from '../i18n/languages';
import { useRouter } from '../router';
import '../styles/admin.css';

const TABS = [
  { id: 'home', label: 'Главная страница', badge: 'Меню + AI', route: '/' },
  { id: 'design', label: 'Графический дизайн', badge: 'Behance + 2 галереи', route: '/design' },
  { id: 'ar', label: 'AR-эффекты', badge: 'Видео', route: '/ar' },
  { id: 'ai', label: 'AI-продакшн', badge: '3 галереи', route: '/ai' },
  { id: 'translations', label: 'Переводы (ИИ)', badge: '6 языков', route: '/' },
];

const QUICK_LINKS = [
  { label: 'Дизайн (#/design)', value: '#/design' },
  { label: 'AI-Продакшн (#/ai)', value: '#/ai' },
  { label: 'AR-Эффекты (#/ar)', value: '#/ar' },
  { label: 'Резюме (#/resume)', value: '#/resume' },
  { label: 'Обо мне (#/#about)', value: '#/#about' },
];

const AR_TOPIC_PRESETS = [
  'BODY TRACKING',
  'AR TRY-ON',
  'GLASSMORPHISM',
  '3D MOTION',
  'DIGITAL MUA',
  'ВИЗУАЛЬНЫЕ РЕШЕНИЯ',
  'BEAUTY',
  'FASHION',
  'PHYGITAL',
  'GAME AR',
];

const TARGET_LANG_META = LANGUAGES.filter((l) => TARGET_TRANSLATION_LANGS.includes(l.code));

function moveItem(arr, idx, dir) {
  const target = idx + dir;
  if (target < 0 || target >= arr.length) return arr;
  const next = arr.slice();
  [next[idx], next[target]] = [next[target], next[idx]];
  return next;
}

function collectCmsStrings(cms) {
  const set = new Set();
  const add = (v) => {
    const clean = String(v || '').replace(/\s+/g, ' ').trim();
    if (clean.length >= 2) set.add(clean);
  };

  for (const c of cms.home?.menuCards || []) {
    add(c.title);
    add(c.tag);
  }
  for (const g of cms.home?.aiGallery || []) add(g.alt);
  for (const g of cms.design?.identityGallery || []) add(g.alt);
  for (const g of cms.design?.infographicGallery || []) add(g.alt);
  for (const v of cms.ar?.videos || []) {
    add(v.title);
    add(v.subtitle);
    add(v.tag);
  }
  for (const g of cms.ai?.heroGallery || []) add(g.alt);
  for (const g of cms.ai?.productGallery || []) add(g.alt);
  for (const g of cms.ai?.modelGallery || []) add(g.alt);

  return Array.from(set);
}

function buildAiTranslationPrompt(strings) {
  const listJson = JSON.stringify(strings, null, 2);
  return [
    'Ты профессиональный переводчик интерфейсов и портфолио-сайта дизайнера (LEDNIQUE — графический дизайн, брендинг, AR-эффекты, AI-продакшн).',
    'Переведи КАЖДУЮ строку из списка ниже на 6 языков: английский (en), китайский упрощённый (zh), японский (ja), португальский (pt), французский (fr) и арабский (ar).',
    '',
    'Правила:',
    '1. Верни ТОЛЬКО валидный JSON без пояснений, без комментариев и без лишнего текста.',
    '2. Ключи внутри каждого языка должны ТОЧНО (символ в символ) совпадать с исходными строками из списка.',
    '3. Сохраняй стиль, регистр (например, CAPS для бейджей AR), имена брендов (LEDNIQUE, BKA Vertical, OSCAR&FRANK, GLAMNETIC, Try-On, UI/UX) не искажай.',
    '4. Формат ответа строго такой:',
    '{',
    '  "en": { "Исходная строка": "English translation" },',
    '  "zh": { "Исходная строка": "中文翻译" },',
    '  "ja": { "Исходная строка": "日本語訳" },',
    '  "pt": { "Исходная строка": "Tradução em português" },',
    '  "fr": { "Исходная строка": "Traduction en français" },',
    '  "ar": { "Исходная строка": "الترجمة العربية" }',
    '}',
    '',
    'Список строк для перевода:',
    listJson,
  ].join('\n');
}

/* ───────── Local Folder Storage Status Banner ───────── */
function LocalStorageBanner({ onNotify }) {
  const {
    storageMode,
    folderName,
    savedFolderName,
    serverInfo,
    supportsDirectoryPicker,
    connectFolder,
    reconnectSavedFolder,
    disconnectFolder,
    saving,
    lastSavedAt,
    saveError,
    saveNow,
    exportConfig,
  } = useCms();

  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const h = await connectFolder();
      onNotify(`Папка «${h.name}» подключена — изменения сохраняются прямо в неё`);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        onNotify(err?.message || 'Не удалось подключить папку', true);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleReconnect = async () => {
    setConnecting(true);
    try {
      const h = await reconnectSavedFolder();
      onNotify(`Папка «${h.name}» переподключена`);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        onNotify(err?.message || 'Не удалось переподключить папку', true);
      }
    } finally {
      setConnecting(false);
    }
  };

  const timeLabel = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <section className={`admin__folder-banner is-${storageMode}`}>
      <div className="admin__folder-main">
        <div className="admin__folder-status-row">
          <span className={`admin__folder-dot is-${storageMode}`} />
          <strong className="admin__folder-title">
            {storageMode === 'local-server'
              ? `Автосохранение в папку сайта активно (${folderName || 'portfolio_ver2'})`
              : storageMode === 'folder-handle'
                ? `Подключена локальная папка: ${folderName}`
                : 'Папка сайта на компьютере не подключена'}
          </strong>
          {saving && <span className="admin__folder-pill">Сохранение…</span>}
          {!saving && timeLabel && (
            <span className="admin__folder-pill is-saved">Сохранено в {timeLabel}</span>
          )}
        </div>

        <p className="admin__folder-desc">
          {storageMode === 'local-server' ? (
            <>
              Все правки и загруженные файлы автоматически пишутся в{' '}
              <code>content/site-data.json</code>, <code>assets/uploads/</code> и{' '}
              <code>lang/*.json</code>
              {serverInfo?.rootDir ? ` (${serverInfo.rootDir})` : ''}. После редактирования просто
              загрузите папку сайта на GitHub.
            </>
          ) : storageMode === 'folder-handle' ? (
            <>
              Прямой доступ к папке активен: изменения записываются в{' '}
              <code>content/site-data.json</code>, новые фото/видео — в{' '}
              <code>assets/uploads/</code>, переводы — в <code>lang/*.json</code>. Загрузите папку
              на GitHub, чтобы опубликовать.
            </>
          ) : (
            <>
              Чтобы изменения сохранялись прямо в папку сайта на вашем компьютере, выберите её
              кнопкой справа (Chrome / Edge / Arc) <b>или</b> откройте в папке сайта файл{' '}
              <code>open-settings.command</code> (macOS) / <code>open-settings.bat</code> (Windows).
            </>
          )}
        </p>

        {saveError && <div className="admin__folder-error">Ошибка записи: {saveError}</div>}
      </div>

      <div className="admin__folder-actions">
        {storageMode === 'local-server' && (
          <button
            type="button"
            className="v2-pill-btn"
            disabled={saving}
            onClick={() =>
              saveNow()
                .then(() => onNotify('Сохранено в content/site-data.json'))
                .catch((e) => onNotify(e.message, true))
            }
          >
            Сохранить сейчас
          </button>
        )}

        {storageMode === 'folder-handle' && (
          <>
            <button
              type="button"
              className="v2-pill-btn"
              disabled={saving}
              onClick={() =>
                saveNow()
                  .then(() => onNotify('Сохранено в content/site-data.json'))
                  .catch((e) => onNotify(e.message, true))
              }
            >
              Сохранить сейчас
            </button>
            <button
              type="button"
              className="admin__tool-btn"
              onClick={() => {
                disconnectFolder();
                onNotify('Папка отключена');
              }}
            >
              Отключить папку
            </button>
          </>
        )}

        {storageMode === 'readonly' && (
          <>
            {supportsDirectoryPicker && savedFolderName && (
              <button
                type="button"
                className="v2-pill-btn v2-pill-btn--lime"
                disabled={connecting}
                onClick={handleReconnect}
              >
                {connecting ? 'Подключение…' : `Переподключить «${savedFolderName}»`}
              </button>
            )}
            {supportsDirectoryPicker && (
              <button
                type="button"
                className={`v2-pill-btn${savedFolderName ? '' : ' v2-pill-btn--lime'}`}
                disabled={connecting}
                onClick={handleConnect}
              >
                {connecting ? 'Выбор папки…' : 'Подключить папку сайта'}
              </button>
            )}
            <button
              type="button"
              className="admin__tool-btn"
              onClick={() => {
                exportConfig();
                onNotify('Скачан файл site-data.json — поместите его в папку content/');
              }}
            >
              Скачать site-data.json
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/* ───────── Shared Image Gallery Manager ───────── */
function GalleryManager({ title, description, items = [], onChange, onNotify, uploadMedia, resolveUrl }) {
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [busy, setBusy] = useState(false);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added = [];
      for (const file of Array.from(files)) {
        const savedPath = await uploadMedia(file, 'image');
        added.push({
          id: uid('img'),
          src: savedPath,
          alt: file.name.replace(/\.[^.]+$/, ''),
        });
      }
      onChange([...items, ...added]);
      onNotify(`Сохранено в assets/uploads/: ${added.length} файл(ов)`);
    } catch (err) {
      onNotify(err.message || 'Ошибка загрузки', true);
    } finally {
      setBusy(false);
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([
      ...items,
      {
        id: uid('img'),
        src: trimmed,
        alt: altInput.trim() || 'Изображение',
      },
    ]);
    setUrlInput('');
    setAltInput('');
    onNotify('Изображение добавлено по ссылке');
  };

  const handleReplace = async (idx, file) => {
    if (!file) return;
    setBusy(true);
    try {
      const savedPath = await uploadMedia(file, 'image');
      const next = items.map((item, i) => (i === idx ? { ...item, src: savedPath } : item));
      onChange(next);
      onNotify('Изображение сохранено в assets/uploads/');
    } catch (err) {
      onNotify(err.message || 'Ошибка замены', true);
    } finally {
      setBusy(false);
    }
  };

  const handleAltChange = (idx, alt) => {
    onChange(items.map((item, i) => (i === idx ? { ...item, alt } : item)));
  };

  const handleRemove = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
    onNotify('Изображение удалено');
  };

  return (
    <section className="admin__panel">
      <div className="admin__panel-head">
        <div>
          <h2 className="admin__panel-title">{title}</h2>
          {description && <p className="admin__panel-desc">{description}</p>}
        </div>
        <span className="admin__count-badge">{items.length} шт.</span>
      </div>

      <div className="admin__upload-bar">
        <label className="v2-pill-btn v2-pill-btn--lime admin__upload-btn">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              handleUpload(e.target.files);
              e.target.value = '';
            }}
          />
          {busy ? 'Сохранение…' : '+ Загрузить изображения'}
        </label>

        <form className="admin__url-form" onSubmit={handleAddUrl}>
          <input
            type="text"
            className="admin__input"
            placeholder="Или вставьте путь / URL изображения…"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <input
            type="text"
            className="admin__input admin__input--alt"
            placeholder="Подпись (alt)"
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
          />
          <button type="submit" className="v2-pill-btn">
            Добавить
          </button>
        </form>
      </div>

      {items.length === 0 ? (
        <div className="admin__empty">Пока нет изображений — загрузите файлы или добавьте ссылку.</div>
      ) : (
        <div className="admin__media-grid">
          {items.map((item, idx) => {
            const src = resolveUrl(item.src);
            return (
              <div className="admin__media-card" key={item.id || idx}>
                <div className="admin__media-thumb">
                  {src ? <img src={src} alt={item.alt || ''} loading="lazy" /> : <span>Нет фото</span>}
                  <span className="admin__media-idx">#{idx + 1}</span>
                </div>
                <div className="admin__media-meta">
                  <input
                    type="text"
                    className="admin__input admin__input--sm"
                    value={item.alt || ''}
                    onChange={(e) => handleAltChange(idx, e.target.value)}
                    placeholder="Название / подпись"
                    aria-label="Подпись изображения"
                  />
                  <div className="admin__card-actions">
                    <label className="admin__icon-btn" title="Заменить файл">
                      ↻
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          handleReplace(idx, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => onChange(moveItem(items, idx, -1))}
                      disabled={idx === 0}
                      title="Переместить влево / вверх"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => onChange(moveItem(items, idx, 1))}
                      disabled={idx === items.length - 1}
                      title="Переместить вправо / вниз"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn admin__icon-btn--danger"
                      onClick={() => handleRemove(idx)}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ───────── Tab 1: Home Page Settings ───────── */
function HomeTab({ onNotify }) {
  const { cms, updateCms, uploadMedia, resolveUrl } = useCms();
  const [busyIdx, setBusyIdx] = useState(null);

  const cards = cms.home.menuCards || [];

  const setCards = (next) => {
    updateCms((prev) => ({
      ...prev,
      home: { ...prev.home, menuCards: next.slice(0, MAX_MENU_CARDS) },
    }));
  };

  const handleAddCard = () => {
    if (cards.length >= MAX_MENU_CARDS) return;
    setCards([
      ...cards,
      {
        id: uid('menu'),
        tag: 'новый проект – 2026',
        title: 'Новая карточка',
        href: '#/design',
        image: './assets/figma/e37af.webp',
      },
    ]);
    onNotify('Карточка добавлена в «Сегодня в меню»');
  };

  const handleUpdateCard = (idx, patch) => {
    setCards(cards.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const handleUploadCover = async (idx, file) => {
    if (!file) return;
    setBusyIdx(idx);
    try {
      const savedPath = await uploadMedia(file, 'image');
      handleUpdateCard(idx, { image: savedPath });
      onNotify('Обложка сохранена в assets/uploads/');
    } catch (err) {
      onNotify(err.message || 'Ошибка загрузки обложки', true);
    } finally {
      setBusyIdx(null);
    }
  };

  const handleRemoveCard = (idx) => {
    setCards(cards.filter((_, i) => i !== idx));
    onNotify('Карточка удалена');
  };

  return (
    <div className="admin__stack">
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2 className="admin__panel-title">Карточки «Сегодня в меню»</h2>
            <p className="admin__panel-desc">
              Управляйте витринными карточками на главной странице: до {MAX_MENU_CARDS} карточек
              (название, подпись, ссылка и обложка).
            </p>
          </div>
          <div className="admin__head-right">
            <span className="admin__count-badge">
              {cards.length} / {MAX_MENU_CARDS}
            </span>
            <button
              type="button"
              className="v2-pill-btn v2-pill-btn--lime"
              onClick={handleAddCard}
              disabled={cards.length >= MAX_MENU_CARDS}
            >
              + Добавить карточку
            </button>
          </div>
        </div>

        <div className="admin__menu-list">
          {cards.map((card, idx) => {
            const imgSrc = resolveUrl(card.image);
            return (
              <article className="admin__menu-card" key={card.id || idx}>
                <div className="admin__menu-card-cover">
                  {imgSrc ? <img src={imgSrc} alt={card.title} /> : <span>Нет обложки</span>}
                  <label className="admin__cover-upload">
                    {busyIdx === idx ? 'Сохранение…' : 'Сменить обложку'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        handleUploadCover(idx, e.target.files?.[0]);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>

                <div className="admin__menu-card-fields">
                  <div className="admin__field-row">
                    <label className="admin__field">
                      <span>Название карточки</span>
                      <input
                        type="text"
                        className="admin__input"
                        value={card.title}
                        onChange={(e) => handleUpdateCard(idx, { title: e.target.value })}
                        placeholder="Например: BKA VERTICAL"
                      />
                    </label>
                    <label className="admin__field">
                      <span>Подпись / категория</span>
                      <input
                        type="text"
                        className="admin__input"
                        value={card.tag || ''}
                        onChange={(e) => handleUpdateCard(idx, { tag: e.target.value })}
                        placeholder="Например: company rebranding – 2026"
                      />
                    </label>
                  </div>

                  <label className="admin__field">
                    <span>Ссылка перехода</span>
                    <input
                      type="text"
                      className="admin__input"
                      value={card.href}
                      onChange={(e) => handleUpdateCard(idx, { href: e.target.value })}
                      placeholder="#/design или https://example.com"
                    />
                  </label>

                  <div className="admin__presets">
                    <span>Быстрый выбор ссылки:</span>
                    {QUICK_LINKS.map((q) => (
                      <button
                        type="button"
                        key={q.value}
                        className={`admin__preset-chip${card.href === q.value ? ' is-active' : ''}`}
                        onClick={() => handleUpdateCard(idx, { href: q.value })}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  <label className="admin__field">
                    <span>Путь / URL обложки (или загрузите файл слева)</span>
                    <input
                      type="text"
                      className="admin__input admin__input--sm"
                      value={card.image || ''}
                      onChange={(e) => handleUpdateCard(idx, { image: e.target.value })}
                      placeholder="./assets/uploads/... или https://..."
                    />
                  </label>

                  <div className="admin__card-actions admin__card-actions--end">
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => setCards(moveItem(cards, idx, -1))}
                      disabled={idx === 0}
                      title="Переместить выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => setCards(moveItem(cards, idx, 1))}
                      disabled={idx === cards.length - 1}
                      title="Переместить ниже"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn admin__icon-btn--danger"
                      onClick={() => handleRemoveCard(idx)}
                      title="Удалить карточку"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <GalleryManager
        title="Галерея блока «AI-продакшн» на главной"
        description="Эти изображения крутятся фоновой лентой в секции AI-продакшн на главной странице."
        items={cms.home.aiGallery}
        onChange={(next) =>
          updateCms((prev) => ({ ...prev, home: { ...prev.home, aiGallery: next } }))
        }
        onNotify={onNotify}
        uploadMedia={uploadMedia}
        resolveUrl={resolveUrl}
      />
    </div>
  );
}

/* ───────── Tab 2: Graphic Design (Behance Embeds + 2 Galleries) ───────── */
function DesignTab({ onNotify }) {
  const { cms, updateCms, uploadMedia, resolveUrl } = useCms();
  const behanceCases = cms.design.behanceCases || [];

  const setBehanceCases = (next) => {
    updateCms((prev) => ({
      ...prev,
      design: { ...prev.design, behanceCases: next },
    }));
  };

  const handleAddBehance = () => {
    const next = [
      ...behanceCases,
      {
        id: uid('beh'),
        title: `Кейс Behance #${behanceCases.length + 1}`,
        embedCode: '',
      },
    ];
    setBehanceCases(next);
    onNotify('Добавлен слот Behance — вставьте embed-код или ссылку на проект');
  };

  const handleUpdateBehance = (idx, patch) => {
    setBehanceCases(behanceCases.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const handleRemoveBehance = (idx) => {
    setBehanceCases(behanceCases.filter((_, i) => i !== idx));
    onNotify('Кейс Behance удалён');
  };

  return (
    <div className="admin__stack">
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2 className="admin__panel-title">Кейсы на Behance (Embed-код)</h2>
            <p className="admin__panel-desc">
              Вставьте полный HTML embed-код виджета из Behance (<code>&lt;iframe ...&gt;</code>)
              или просто ссылку на проект Behance — виджет обновится автоматически.
            </p>
          </div>
          <div className="admin__head-right">
            <span className="admin__count-badge">{behanceCases.length} кейсов</span>
            <button
              type="button"
              className="v2-pill-btn v2-pill-btn--lime"
              onClick={handleAddBehance}
            >
              + Добавить кейс Behance
            </button>
          </div>
        </div>

        <div className="admin__beh-list">
          {behanceCases.map((item, idx) => {
            const previewUrl = extractBehanceEmbedUrl(item.embedCode || item.embedUrl || item.url);
            return (
              <article className="admin__beh-card" key={item.id || idx}>
                <div className="admin__beh-preview">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      title={item.title || `Behance #${idx + 1}`}
                      loading="lazy"
                      frameBorder="0"
                      allow="clipboard-write"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  ) : (
                    <div className="admin__beh-empty">Вставьте embed-код Behance</div>
                  )}
                </div>

                <div className="admin__beh-fields">
                  <label className="admin__field">
                    <span>Название (для подсказки / SEO)</span>
                    <input
                      type="text"
                      className="admin__input"
                      value={item.title || ''}
                      onChange={(e) => handleUpdateBehance(idx, { title: e.target.value })}
                      placeholder="Например: Company rebranding – BKA Vertical"
                    />
                  </label>

                  <label className="admin__field">
                    <span>Embed-код Behance или ссылка на проект</span>
                    <textarea
                      className="admin__textarea admin__textarea--code"
                      rows={3}
                      value={item.embedCode ?? item.embedUrl ?? ''}
                      onChange={(e) => handleUpdateBehance(idx, { embedCode: e.target.value })}
                      placeholder='<iframe src="https://www.behance.net/embed/project/257802213?ilo0=1" height="316" width="404" ...></iframe>'
                    />
                  </label>

                  {item.embedCode && !previewUrl && (
                    <p className="admin__field-warn">
                      Не удалось распознать URL — вставьте тег &lt;iframe src=&quot;https://...&quot;&gt;
                      или ссылку на проект Behance.
                    </p>
                  )}

                  <div className="admin__card-actions admin__card-actions--end">
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => setBehanceCases(moveItem(behanceCases, idx, -1))}
                      disabled={idx === 0}
                      title="Переместить выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => setBehanceCases(moveItem(behanceCases, idx, 1))}
                      disabled={idx === behanceCases.length - 1}
                      title="Переместить ниже"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn admin__icon-btn--danger"
                      onClick={() => handleRemoveBehance(idx)}
                      title="Удалить кейс"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <GalleryManager
        title="Галерея «Айдентика»"
        description="Слайдер проектов фирменного стиля и брендинга на странице Графического дизайна."
        items={cms.design.identityGallery}
        onChange={(next) =>
          updateCms((prev) => ({
            ...prev,
            design: { ...prev.design, identityGallery: next },
          }))
        }
        onNotify={onNotify}
        uploadMedia={uploadMedia}
        resolveUrl={resolveUrl}
      />

      <GalleryManager
        title="Галерея «Инфографика»"
        description="Карточки товаров и маркетплейс-инфографика на странице Графического дизайна."
        items={cms.design.infographicGallery}
        onChange={(next) =>
          updateCms((prev) => ({
            ...prev,
            design: { ...prev.design, infographicGallery: next },
          }))
        }
        onNotify={onNotify}
        uploadMedia={uploadMedia}
        resolveUrl={resolveUrl}
      />
    </div>
  );
}

/* ───────── Tab 3: AR Effects Videos ───────── */
function ArTab({ onNotify }) {
  const { cms, updateCms, uploadMedia, uploadVideoWithPoster, resolveUrl } = useCms();
  const videos = cms.ar.videos || [];
  const [uploadingId, setUploadingId] = useState(null);

  const setVideos = (next) => {
    updateCms((prev) => ({ ...prev, ar: { ...prev.ar, videos: next } }));
  };

  const handleAddVideo = () => {
    const item = {
      id: uid('ar'),
      title: 'Новый AR-эффект',
      subtitle: 'Описание эффекта',
      tag: 'AR TRY-ON',
      videoSrc: '',
      posterSrc: '',
    };
    setVideos([item, ...videos]);
    onNotify('Создана карточка AR-эффекта — загрузите видео');
  };

  const handleUpdate = (idx, patch) => {
    setVideos(videos.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const handleUploadVideo = async (idx, id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const { videoSrc, posterSrc } = await uploadVideoWithPoster(file);
      const patch = { videoSrc };
      if (posterSrc) patch.posterSrc = posterSrc;
      handleUpdate(idx, patch);
      onNotify(`Видео «${file.name}» сохранено в assets/uploads/`);
    } catch (err) {
      onNotify(err.message || 'Ошибка загрузки видео', true);
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadPoster = async (idx, id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const savedPath = await uploadMedia(file, 'poster');
      handleUpdate(idx, { posterSrc: savedPath });
      onNotify('Постер сохранён в assets/uploads/');
    } catch (err) {
      onNotify(err.message || 'Ошибка загрузки постера', true);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="admin__stack">
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2 className="admin__panel-title">Видео на странице AR-эффектов</h2>
            <p className="admin__panel-desc">
              Управляйте вертикальными видео 9:16: название, подзаголовок, тематика эффекта и
              загрузка видеофайла (MP4 / WebM — сохраняется прямо в папку assets/uploads/).
            </p>
          </div>
          <div className="admin__head-right">
            <span className="admin__count-badge">{videos.length} видео</span>
            <button
              type="button"
              className="v2-pill-btn v2-pill-btn--lime"
              onClick={handleAddVideo}
            >
              + Добавить AR-видео
            </button>
          </div>
        </div>

        <div className="admin__ar-list">
          {videos.map((item, idx) => {
            const videoUrl = resolveUrl(item.videoSrc);
            const posterUrl = resolveUrl(item.posterSrc);
            const isBusy = uploadingId === item.id;

            return (
              <article className="admin__ar-card" key={item.id || idx}>
                <div className="admin__ar-preview">
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      poster={posterUrl || undefined}
                      muted
                      playsInline
                      controls
                      preload="metadata"
                    />
                  ) : posterUrl ? (
                    <img src={posterUrl} alt={item.title} />
                  ) : (
                    <div className="admin__ar-empty">9:16 Видео</div>
                  )}
                  {item.tag && <span className="admin__ar-tag-pill">{item.tag}</span>}
                </div>

                <div className="admin__ar-fields">
                  <div className="admin__field-row">
                    <label className="admin__field">
                      <span>Название</span>
                      <input
                        type="text"
                        className="admin__input"
                        value={item.title || ''}
                        onChange={(e) => handleUpdate(idx, { title: e.target.value })}
                        placeholder="Название проекта / бренда"
                      />
                    </label>
                    <label className="admin__field">
                      <span>Подзаголовок</span>
                      <input
                        type="text"
                        className="admin__input"
                        value={item.subtitle || ''}
                        onChange={(e) => handleUpdate(idx, { subtitle: e.target.value })}
                        placeholder="Короткое описание эффекта"
                      />
                    </label>
                  </div>

                  <label className="admin__field">
                    <span>Тематика эффекта</span>
                    <input
                      type="text"
                      className="admin__input"
                      value={item.tag || ''}
                      onChange={(e) => handleUpdate(idx, { tag: e.target.value })}
                      placeholder="Например: AR TRY-ON, BODY TRACKING, BEAUTY"
                    />
                  </label>

                  <div className="admin__presets">
                    <span>Тематики:</span>
                    {AR_TOPIC_PRESETS.map((topic) => (
                      <button
                        type="button"
                        key={topic}
                        className={`admin__preset-chip${item.tag === topic ? ' is-active' : ''}`}
                        onClick={() => handleUpdate(idx, { tag: topic })}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>

                  <div className="admin__upload-row">
                    <label className="v2-pill-btn v2-pill-btn--lime">
                      {isBusy ? 'Сохранение…' : '↑ Загрузить видео'}
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        disabled={isBusy}
                        onChange={(e) => {
                          handleUploadVideo(idx, item.id, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <label className="v2-pill-btn">
                      Постер (обложка)
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={isBusy}
                        onChange={(e) => {
                          handleUploadPoster(idx, item.id, e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div className="admin__field-row">
                    <label className="admin__field">
                      <span>Путь / URL видео</span>
                      <input
                        type="text"
                        className="admin__input admin__input--sm"
                        value={item.videoSrc || ''}
                        onChange={(e) => handleUpdate(idx, { videoSrc: e.target.value })}
                        placeholder="./assets/uploads/... или URL MP4/WebM"
                      />
                    </label>
                    <label className="admin__field">
                      <span>Путь / URL постера</span>
                      <input
                        type="text"
                        className="admin__input admin__input--sm"
                        value={item.posterSrc || ''}
                        onChange={(e) => handleUpdate(idx, { posterSrc: e.target.value })}
                        placeholder="./assets/uploads/... или URL JPG/PNG"
                      />
                    </label>
                  </div>

                  <div className="admin__card-actions admin__card-actions--end">
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => setVideos(moveItem(videos, idx, -1))}
                      disabled={idx === 0}
                      title="Переместить выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn"
                      onClick={() => setVideos(moveItem(videos, idx, 1))}
                      disabled={idx === videos.length - 1}
                      title="Переместить ниже"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="admin__icon-btn admin__icon-btn--danger"
                      onClick={() => {
                        setVideos(videos.filter((_, i) => i !== idx));
                        onNotify('AR-видео удалено');
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ───────── Tab 4: AI Production Galleries ───────── */
function AiTab({ onNotify }) {
  const { cms, updateCms, uploadMedia, resolveUrl } = useCms();

  return (
    <div className="admin__stack">
      <GalleryManager
        title="Главный слайдер (Hero) AI-продакшн"
        description="Широкая карусель ключевых работ в верхней части страницы AI-продакшн."
        items={cms.ai.heroGallery}
        onChange={(next) =>
          updateCms((prev) => ({ ...prev, ai: { ...prev.ai, heroGallery: next } }))
        }
        onNotify={onNotify}
        uploadMedia={uploadMedia}
        resolveUrl={resolveUrl}
      />

      <GalleryManager
        title="Галерея «Нейрофотосессии товаров»"
        description="Предметные генерации в секции нейрофотосессий товаров."
        items={cms.ai.productGallery}
        onChange={(next) =>
          updateCms((prev) => ({ ...prev, ai: { ...prev.ai, productGallery: next } }))
        }
        onNotify={onNotify}
        uploadMedia={uploadMedia}
        resolveUrl={resolveUrl}
      />

      <GalleryManager
        title="Галерея «Нейрофотосессии модели»"
        description="Галерея виртуальных моделей и лукбуков на странице AI-продакшн."
        items={cms.ai.modelGallery}
        onChange={(next) =>
          updateCms((prev) => ({ ...prev, ai: { ...prev.ai, modelGallery: next } }))
        }
        onNotify={onNotify}
        uploadMedia={uploadMedia}
        resolveUrl={resolveUrl}
      />
    </div>
  );
}

/* ───────── Tab 5: AI Translation Prompt & Auto-Apply into lang/*.json ───────── */
function TranslationsTab({ onNotify }) {
  const { cms, applyAiTranslations, canWriteToFolder } = useCms();
  const { reloadTranslations } = useI18n();

  const [dicts, setDicts] = useState({});
  const [loadingDicts, setLoadingDicts] = useState(true);
  const [scope, setScope] = useState('missing'); // 'missing' | 'all'
  const [extraLines, setExtraLines] = useState('');
  const [aiCodeInput, setAiCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  const loadAllDicts = useCallback(async () => {
    setLoadingDicts(true);
    const loaded = {};
    await Promise.all(
      TARGET_TRANSLATION_LANGS.map(async (code) => {
        try {
          const res = await fetch(`./lang/${code}.json?t=${Date.now()}`, { cache: 'no-store' });
          if (res.ok) {
            loaded[code] = await res.json();
          } else {
            loaded[code] = {};
          }
        } catch {
          loaded[code] = {};
        }
      })
    );
    setDicts(loaded);
    setLoadingDicts(false);
  }, []);

  useEffect(() => {
    loadAllDicts();
  }, [loadAllDicts]);

  const allCmsStrings = useMemo(() => collectCmsStrings(cms), [cms]);

  const customStrings = useMemo(
    () =>
      extraLines
        .split('\n')
        .map((s) => s.replace(/\s+/g, ' ').trim())
        .filter(Boolean),
    [extraLines]
  );

  const isTranslatedInAll = useCallback(
    (str) => {
      const norm = str.replace(/\s+/g, ' ').trim();
      const normDash = norm.replace(/[—–]/g, '-');
      return TARGET_TRANSLATION_LANGS.every((code) => {
        const d = dicts[code];
        if (!d) return false;
        if (d[norm]) return true;
        return Object.keys(d).some(
          (k) => k.replace(/\s+/g, ' ').trim().replace(/[—–]/g, '-') === normDash
        );
      });
    },
    [dicts]
  );

  const missingCmsStrings = useMemo(
    () => allCmsStrings.filter((s) => !isTranslatedInAll(s)),
    [allCmsStrings, isTranslatedInAll]
  );

  const targetStrings = useMemo(() => {
    const base = scope === 'missing' ? missingCmsStrings : allCmsStrings;
    return Array.from(new Set([...base, ...customStrings]));
  }, [scope, missingCmsStrings, allCmsStrings, customStrings]);

  const promptText = useMemo(() => {
    const list = targetStrings.length
      ? targetStrings
      : ['Пример названия проекта', 'Пример описания карточки'];
    return buildAiTranslationPrompt(list);
  }, [targetStrings]);

  const parsedPreview = useMemo(() => {
    if (!aiCodeInput.trim()) return null;
    try {
      return { ok: true, ...parseAiTranslationsInput(aiCodeInput) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }, [aiCodeInput]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      onNotify('Промпт скопирован — вставьте его в ChatGPT, Claude или Gemini');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      onNotify('Не удалось скопировать автоматически — выделите текст вручную', true);
    }
  };

  const handleApplyTranslations = async () => {
    if (!parsedPreview?.ok) {
      onNotify(parsedPreview?.error || 'Вставьте корректный JSON от ИИ', true);
      return;
    }
    setApplying(true);
    try {
      const res = await applyAiTranslations(parsedPreview.byLang);
      await reloadTranslations(parsedPreview.byLang);
      await loadAllDicts();
      const langsDone = Object.keys(res.updated || {}).join(', ');
      setAiCodeInput('');
      onNotify(
        `Готово! Записано ${parsedPreview.totalPairs} переводов в lang/ (${langsDone || 'все языки'}) и сразу применено на сайте`
      );
    } catch (err) {
      onNotify(err.message || 'Ошибка сохранения переводов', true);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="admin__stack">
      {/* Overview of current 6 language files */}
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2 className="admin__panel-title">Автоперевод новых текстов через ИИ</h2>
            <p className="admin__panel-desc">
              Когда вы добавляете новые карточки, проекты или подписи, скопируйте готовый промпт
              ниже → отправьте любому ИИ → вставьте полученный JSON-код в поле внизу. Редактор сам
              обновит все 6 файлов в папке <code>lang/</code>.
            </p>
          </div>
          <span className="admin__count-badge">
            {loadingDicts
              ? 'Проверка…'
              : missingCmsStrings.length > 0
                ? `Не переведено: ${missingCmsStrings.length}`
                : 'Все тексты переведены ✓'}
          </span>
        </div>

        <div className="admin__lang-stats">
          {TARGET_LANG_META.map((item) => {
            const count = Object.keys(dicts[item.code] || {}).length;
            return (
              <div className="admin__lang-stat" key={item.code}>
                <span className="admin__lang-stat-flag" aria-hidden="true">
                  {item.emoji}
                </span>
                <div>
                  <div className="admin__lang-stat-name">{item.name}</div>
                  <div className="admin__lang-stat-meta">
                    <code>lang/{item.code}.json</code> · {count} фраз
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 1 + Step 2: Build & Copy AI Prompt */}
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2 className="admin__panel-title">Шаг 1. Скопируйте промпт для ИИ</h2>
            <p className="admin__panel-desc">
              Промпт автоматически собирает ваши тексты и просит ИИ выдать строгий JSON сразу на 6
              языков (🇬🇧 EN, 🇨🇳 ZH, 🇯🇵 JA, 🇵🇹 PT, 🇫🇷 FR, 🇸🇦 AR).
            </p>
          </div>
          <div className="admin__head-right">
            <button
              type="button"
              className={`admin__preset-chip${scope === 'missing' ? ' is-active' : ''}`}
              onClick={() => setScope('missing')}
            >
              Только новые ({missingCmsStrings.length})
            </button>
            <button
              type="button"
              className={`admin__preset-chip${scope === 'all' ? ' is-active' : ''}`}
              onClick={() => setScope('all')}
            >
              Все тексты CMS ({allCmsStrings.length})
            </button>
          </div>
        </div>

        <label className="admin__field">
          <span>Дополнительные фразы для перевода (необязательно — по одной на строку)</span>
          <textarea
            className="admin__textarea admin__textarea--sm"
            rows={3}
            value={extraLines}
            onChange={(e) => setExtraLines(e.target.value)}
            placeholder={'Например:\nНовый бренд одежды\nАйдентика и упаковка – 2026'}
          />
        </label>

        <div className="admin__prompt-box">
          <div className="admin__prompt-bar">
            <span>
              Готовый промпт ({targetStrings.length || 2}{' '}
              {targetStrings.length === 1 ? 'строка' : 'строк'})
            </span>
            <button
              type="button"
              className="v2-pill-btn v2-pill-btn--lime"
              onClick={handleCopyPrompt}
            >
              {copied ? 'Скопировано ✓' : 'Скопировать промпт'}
            </button>
          </div>
          <textarea
            className="admin__textarea admin__textarea--code"
            rows={12}
            readOnly
            value={promptText}
            onFocus={(e) => e.target.select()}
          />
        </div>
      </section>

      {/* Step 3: Paste AI JSON & Auto-Write to lang/*.json */}
      <section className="admin__panel">
        <div className="admin__panel-head">
          <div>
            <h2 className="admin__panel-title">Шаг 2. Вставьте код от ИИ — редактор впишет переводы сам</h2>
            <p className="admin__panel-desc">
              Вставьте весь ответ ИИ (даже если он обёрнут в <code>```json ... ```</code>).
              Редактор проверит структуру, объединит новые фразы с существующими словарями и
              сохранит все 6 файлов <code>lang/*.json</code> прямо в папку сайта.
            </p>
          </div>
        </div>

        <label className="admin__field">
          <span>Код переводов от ИИ (JSON)</span>
          <textarea
            className="admin__textarea admin__textarea--code"
            rows={10}
            value={aiCodeInput}
            onChange={(e) => setAiCodeInput(e.target.value)}
            placeholder={'{\n  "en": { "Новая карточка": "New card" },\n  "zh": { "Новая карточка": "新卡片" },\n  ...\n}'}
          />
        </label>

        {parsedPreview && (
          <div className={`admin__parse-status${parsedPreview.ok ? ' is-ok' : ' is-err'}`}>
            {parsedPreview.ok ? (
              <>
                <strong>✓ Код распознан — всего {parsedPreview.totalPairs} переводов:</strong>{' '}
                {TARGET_LANG_META.map(
                  (m) => `${m.emoji} ${m.code.toUpperCase()}: ${parsedPreview.summary[m.code] || 0}`
                ).join(' · ')}
              </>
            ) : (
              <>⚠ {parsedPreview.error}</>
            )}
          </div>
        )}

        <div className="admin__apply-row">
          <button
            type="button"
            className="v2-pill-btn v2-pill-btn--lime"
            disabled={!parsedPreview?.ok || applying || !canWriteToFolder}
            onClick={handleApplyTranslations}
          >
            {applying ? 'Запись в lang/*.json…' : 'Вписать переводы во все языки сайта'}
          </button>
          {!canWriteToFolder && (
            <span className="admin__apply-hint">
              Сначала подключите папку сайта в баннере сверху или запустите open-settings.command
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

/* ───────── Main Admin Dashboard Shell ───────── */
export function AdminPage() {
  const { resetAll, exportConfig, importConfig, storageMode, saving } = useCms();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const importRef = useRef(null);

  const notify = useCallback((text, isError = false) => {
    setToast({ text, isError, ts: Date.now() });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleExport = () => {
    exportConfig();
    notify('Файл site-data.json скачан');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importConfig(file);
      notify('Конфигурация импортирована и сохранена в папку сайта');
    } catch (err) {
      notify(`Ошибка импорта: ${err.message}`, true);
    } finally {
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 4500);
      return;
    }
    try {
      await resetAll();
      setConfirmReset(false);
      notify('Настройки сброшены к стандартным');
    } catch (err) {
      notify(err.message || 'Ошибка сброса', true);
    }
  };

  return (
    <div className="subpage subpage--admin">
      <div className="content admin">
        <header className="admin__header">
          <div>
            <span className="sub-eyebrow">LEDNIQUE · Локальный редактор папки сайта</span>
            <h1 className="admin__title">Настройки сайта</h1>
          </div>
          <div className="admin__header-actions">
            <button
              type="button"
              className="v2-pill-btn v2-pill-btn--lime"
              onClick={() => navigate(currentTab.route)}
            >
              Открыть «{currentTab.label}» ↗
            </button>
          </div>
        </header>

        <LocalStorageBanner onNotify={notify} />

        <div className="admin__layout">
          {/* Left vertical tab sidebar */}
          <aside className="admin__sidebar" aria-label="Разделы настроек">
            <nav className="admin__tabs" role="tablist" aria-orientation="vertical">
              {TABS.map((tab, idx) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`admin__tab${isActive ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="admin__tab-num">0{idx + 1}</span>
                    <span className="admin__tab-meta">
                      <span className="admin__tab-label">{tab.label}</span>
                      <span className="admin__tab-badge">{tab.badge}</span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="admin__sidebar-tools">
              <div className="admin__status">
                <span className={`admin__status-dot${storageMode === 'readonly' ? ' is-warn' : ''}`} />
                {saving
                  ? 'Запись в папку…'
                  : storageMode === 'readonly'
                    ? 'Подключите папку сайта'
                    : 'Сохраняется в папку сайта'}
              </div>

              <div className="admin__tools-btns">
                <button type="button" className="admin__tool-btn" onClick={handleExport}>
                  Скачать site-data.json
                </button>
                <button
                  type="button"
                  className="admin__tool-btn"
                  onClick={() => importRef.current?.click()}
                >
                  Импорт JSON
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept="application/json"
                  className="sr-only"
                  onChange={handleImport}
                />
                <button
                  type="button"
                  className={`admin__tool-btn admin__tool-btn--danger${
                    confirmReset ? ' is-confirm' : ''
                  }`}
                  onClick={handleReset}
                >
                  {confirmReset ? 'Точно сбросить всё?' : 'Сбросить по умолчанию'}
                </button>
              </div>
            </div>
          </aside>

          {/* Right main settings workspace */}
          <div className="admin__main" role="tabpanel">
            {activeTab === 'home' && <HomeTab onNotify={notify} />}
            {activeTab === 'design' && <DesignTab onNotify={notify} />}
            {activeTab === 'ar' && <ArTab onNotify={notify} />}
            {activeTab === 'ai' && <AiTab onNotify={notify} />}
            {activeTab === 'translations' && <TranslationsTab onNotify={notify} />}
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`admin__toast${toast.isError ? ' is-error' : ''}`}
          role="status"
          aria-live="polite"
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
