import React, { useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { MAX_MENU_CARDS } from '../data/defaultCms';
import { useRouter } from '../router';

const TABS = [
  { id: 'home', label: 'Главная страница', badge: 'Меню + AI', route: '/' },
  { id: 'design', label: 'Графический дизайн', badge: '2 галереи', route: '/design' },
  { id: 'ar', label: 'AR-эффекты', badge: 'Видео', route: '/ar' },
  { id: 'ai', label: 'AI-продакшн', badge: '3 галереи', route: '/ai' },
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
  'BEAUTY',
  'FASHION',
  'PHYGITAL',
  'AR GAME',
];

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function moveItem(list, fromIndex, delta) {
  const toIndex = fromIndex + delta;
  if (toIndex < 0 || toIndex >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/* ───────── Reusable Image Gallery Manager ───────── */
function GalleryManager({
  title,
  description,
  items = [],
  onChange,
  onNotify,
  uploadFile,
  resolveUrl,
}) {
  const fileRef = useRef(null);
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [busy, setBusy] = useState(false);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const added = [];
      for (const file of files) {
        const ref = await uploadFile(file);
        added.push({
          id: uid('img'),
          src: ref,
          alt: file.name.replace(/\.[^.]+$/, ''),
        });
      }
      onChange([...items, ...added]);
      onNotify(`Загружено изображений: ${added.length}`);
    } catch (err) {
      onNotify(`Ошибка загрузки: ${err.message}`, true);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
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

  const handleReplaceFile = async (index, file) => {
    if (!file) return;
    setBusy(true);
    try {
      const ref = await uploadFile(file);
      const next = items.map((it, i) => (i === index ? { ...it, src: ref } : it));
      onChange(next);
      onNotify('Изображение обновлено');
    } catch (err) {
      onNotify(`Ошибка: ${err.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateAlt = (index, alt) => {
    onChange(items.map((it, i) => (i === index ? { ...it, alt } : it)));
  };

  const handleDelete = (index) => {
    onChange(items.filter((_, i) => i !== index));
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

      {/* Add bar */}
      <div className="admin__add-bar">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleUpload}
        />
        <button
          type="button"
          className="v2-pill-btn v2-pill-btn--lime"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Загрузка…' : '+ Загрузить изображения'}
        </button>

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
            className="admin__input admin__input--short"
            placeholder="Подпись (alt)"
            value={altInput}
            onChange={(e) => setAltInput(e.target.value)}
          />
          <button type="submit" className="v2-pill-btn">
            Добавить
          </button>
        </form>
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="admin__empty">Пока нет изображений — загрузите файлы или добавьте ссылку.</div>
      ) : (
        <div className="admin__gallery-grid">
          {items.map((item, idx) => {
            const src = resolveUrl(item.src);
            return (
              <div className="admin__media-card" key={item.id || idx}>
                <div className="admin__media-thumb">
                  {src ? <img src={src} alt={item.alt || ''} loading="lazy" /> : <span>Нет фото</span>}
                  <span className="admin__media-index">#{idx + 1}</span>
                </div>
                <div className="admin__media-body">
                  <input
                    type="text"
                    className="admin__input admin__input--sm"
                    value={item.alt || ''}
                    onChange={(e) => handleUpdateAlt(idx, e.target.value)}
                    placeholder="Название / подпись"
                    aria-label="Подпись изображения"
                  />
                  <div className="admin__card-actions">
                    <label className="admin__icon-btn" title="Заменить файл">
                      ↑
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          handleReplaceFile(idx, e.target.files?.[0]);
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
                      onClick={() => handleDelete(idx)}
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

/* ───────── Tab 1: Home Page (Today Menu Cards + AI Gallery) ───────── */
function HomeTab({ onNotify }) {
  const { cms, updateCms, uploadFile, resolveUrl } = useCms();
  const cards = cms.home.menuCards || [];
  const [busyIdx, setBusyIdx] = useState(-1);

  const setCards = (nextCards) => {
    updateCms((prev) => ({
      ...prev,
      home: { ...prev.home, menuCards: nextCards.slice(0, MAX_MENU_CARDS) },
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
        image: './assets/figma/e37af.png',
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
      const ref = await uploadFile(file);
      handleUpdateCard(idx, { image: ref });
      onNotify('Обложка карточки обновлена');
    } catch (err) {
      onNotify(`Ошибка загрузки обложки: ${err.message}`, true);
    } finally {
      setBusyIdx(-1);
    }
  };

  const handleDeleteCard = (idx) => {
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
              (название, целевая ссылка и обложка).
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

        <div className="admin__menu-cards">
          {cards.map((card, idx) => {
            const imgSrc = resolveUrl(card.image);
            return (
              <article className="admin__menu-card" key={card.id || idx}>
                <div className="admin__menu-card-cover">
                  {imgSrc ? <img src={imgSrc} alt={card.title} /> : <span>Нет обложки</span>}
                  <label className="admin__cover-upload">
                    {busyIdx === idx ? 'Загрузка…' : 'Сменить обложку'}
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
                    <span>URL обложки (или загрузите файл слева)</span>
                    <input
                      type="text"
                      className="admin__input admin__input--sm"
                      value={card.image || ''}
                      onChange={(e) => handleUpdateCard(idx, { image: e.target.value })}
                      placeholder="https://... или путь к изображению"
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
                      onClick={() => handleDeleteCard(idx)}
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
        uploadFile={uploadFile}
        resolveUrl={resolveUrl}
      />
    </div>
  );
}

/* ───────── Tab 2: Graphic Design Galleries ───────── */
function DesignTab({ onNotify }) {
  const { cms, updateCms, uploadFile, resolveUrl } = useCms();

  return (
    <div className="admin__stack">
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
        uploadFile={uploadFile}
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
        uploadFile={uploadFile}
        resolveUrl={resolveUrl}
      />
    </div>
  );
}

/* ───────── Tab 3: AR Effects Videos ───────── */
function ArTab({ onNotify }) {
  const { cms, updateCms, uploadFile, uploadVideoWithPoster, resolveUrl } = useCms();
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
      const { videoRef, posterRef } = await uploadVideoWithPoster(file);
      const patch = { videoSrc: videoRef };
      if (posterRef) patch.posterSrc = posterRef;
      handleUpdate(idx, patch);
      onNotify(`Видео «${file.name}» загружено`);
    } catch (err) {
      onNotify(`Ошибка загрузки видео: ${err.message}`, true);
    } finally {
      setUploadingId(null);
    }
  };

  const handleUploadPoster = async (idx, id, file) => {
    if (!file) return;
    setUploadingId(id);
    try {
      const ref = await uploadFile(file);
      handleUpdate(idx, { posterSrc: ref });
      onNotify('Постер обновлён');
    } catch (err) {
      onNotify(`Ошибка загрузки постера: ${err.message}`, true);
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
              загрузка видеофайла (MP4 / WebM).
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
                      {isBusy ? 'Загрузка…' : '↑ Загрузить видео'}
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
                      <span>URL видео</span>
                      <input
                        type="text"
                        className="admin__input admin__input--sm"
                        value={item.videoSrc || ''}
                        onChange={(e) => handleUpdate(idx, { videoSrc: e.target.value })}
                        placeholder="Ссылка на MP4 / WebM или idb:..."
                      />
                    </label>
                    <label className="admin__field">
                      <span>URL постера</span>
                      <input
                        type="text"
                        className="admin__input admin__input--sm"
                        value={item.posterSrc || ''}
                        onChange={(e) => handleUpdate(idx, { posterSrc: e.target.value })}
                        placeholder="Ссылка на постер JPG/PNG или idb:..."
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
  const { cms, updateCms, uploadFile, resolveUrl } = useCms();

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
        uploadFile={uploadFile}
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
        uploadFile={uploadFile}
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
        uploadFile={uploadFile}
        resolveUrl={resolveUrl}
      />
    </div>
  );
}

/* ───────── Main Admin Dashboard Shell ───────── */
export function AdminPage() {
  const { cms, resetCms, exportJson, importJson } = useCms();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const importRef = useRef(null);

  const notify = (text, isError = false) => {
    setToast({ text, isError, ts: Date.now() });
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 3200);
  };

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lednique-cms-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Конфигурация экспортирована в JSON');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importJson(text);
      notify('Конфигурация успешно импортирована');
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
    await resetCms();
    setConfirmReset(false);
    notify('Настройки сброшены к стандартным');
  };

  return (
    <div className="subpage subpage--admin">
      <div className="content admin">
        <header className="admin__header">
          <div>
            <span className="sub-eyebrow">LEDNIQUE · Панель управления контентом</span>
            <h1 className="admin__title">Личный кабинет</h1>
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
                <span className="admin__status-dot" />
                Автосохранение включено
              </div>

              <div className="admin__tools-btns">
                <button type="button" className="admin__tool-btn" onClick={handleExport}>
                  Экспорт JSON
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
