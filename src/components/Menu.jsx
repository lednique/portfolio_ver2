import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { useRouter } from '../router';
import {
  A11yIcon,
  AdminIcon,
  MenuLogoMark,
  MobileDotsIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from './Icons';
import { EASE_OUT } from './Reveal';

const DESKTOP_LINKS = [
  { type: 'anchor', path: '/', anchor: 'about', label: 'Обо мне', minWidth: 111 },
  { type: 'route', path: '/design', label: 'Дизайн', minWidth: 105 },
  { type: 'route', path: '/ai', label: 'AI-ПРодакшн', minWidth: 161 },
  { type: 'route', path: '/ar', label: 'AR-Эффекты', minWidth: 152 },
];

const MOBILE_ABOUT_LINK = { type: 'anchor', path: '/', anchor: 'about', label: 'обо мне' };

const MOBILE_LINKS = [
  { type: 'route', path: '/design', label: 'дизайн', minWidth: 105 },
  { type: 'route', path: '/ai', label: 'AI-Продакшн', minWidth: 161 },
  { type: 'route', path: '/ar', label: 'AR Эффекты', minWidth: 150 },
];

const RESUME_ITEM = { path: '/resume', label: 'резюме', minWidth: 105 };

const POPOVER_ANIM = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: EASE_OUT },
};

const MOBILE_POPOVER_ANIM = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.28, ease: EASE_OUT },
};

function NavItem({ link, active, compact, onSelect, t }) {
  const href = link.anchor ? `#${link.path}#${link.anchor}` : `#${link.path}`;
  return (
    <a
      className={`menu__item nav-label${active ? ' is-active' : ''}`}
      href={href}
      style={{ minWidth: compact ? undefined : link.minWidth }}
      onClick={(e) => {
        e.preventDefault();
        onSelect(link);
      }}
    >
      {active && <span className="menu__active-pill" aria-hidden="true" />}
      <span className="menu__item-text">{t(link.label)}</span>
    </a>
  );
}

function ResumeButton({ compact, onOpen, t }) {
  return (
    <button
      className="menu__item nav-label menu__resume"
      type="button"
      style={{ minWidth: compact ? undefined : RESUME_ITEM.minWidth }}
      onClick={onOpen}
    >
      <span className="menu__item-text">{t(RESUME_ITEM.label)}</span>
    </button>
  );
}

function SettingsControls({
  theme,
  a11y,
  isAdmin,
  canShowAdmin,
  langMeta,
  langOpen,
  onLangToggle,
  onThemeToggle,
  onA11yToggle,
  onAdminOpen,
  t,
}) {
  return (
    <>
      <button
        className={`menu__control menu__control--a11y${a11y ? ' is-active' : ''}`}
        onClick={onA11yToggle}
        aria-label={t('Упрощённый режим')}
        aria-pressed={a11y}
        title={t('Упрощённый режим (Alt+A)')}
        type="button"
      >
        <A11yIcon />
      </button>

      {canShowAdmin && (
        <button
          className={`menu__control menu__control--admin${isAdmin ? ' is-active' : ''}`}
          onClick={onAdminOpen}
          aria-label={t('Личный кабинет')}
          title={t('Личный кабинет — настройка контента')}
          type="button"
        >
          <AdminIcon />
        </button>
      )}

      <button
        type="button"
        className={`menu__item nav-label menu__control--lang-btn${langOpen ? ' is-active' : ''}`}
        onClick={onLangToggle}
        aria-haspopup="listbox"
        aria-expanded={langOpen}
        aria-label={t('Выбрать язык')}
        title={t('Выбрать язык')}
      >
        <span className="menu__lang-btn-emoji" aria-hidden="true">
          {langMeta.emoji}
        </span>
        <span className="menu__lang-btn-name">{langMeta.name}</span>
      </button>

      <button
        className="menu__control menu__control--theme is-active"
        onClick={onThemeToggle}
        aria-label={theme === 'dark' ? t('Тёмная тема') : t('Светлая тема')}
        aria-pressed={theme === 'dark'}
        title={
          theme === 'dark' ? t('Переключить на светлую тему') : t('Переключить на тёмную тему')
        }
        type="button"
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </button>
    </>
  );
}

function LanguageDropdown({ languages, currentCode, onSelect, still, t }) {
  return (
    <motion.div
      className="menu__lang-dropdown menu__panel--dark"
      role="listbox"
      aria-label={t('Язык сайта')}
      initial={still ? false : { opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={still ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: still ? 0 : 0.2, ease: EASE_OUT }}
    >
      {languages.map((item) => {
        const selected = item.code === currentCode;
        return (
          <button
            key={item.code}
            type="button"
            role="option"
            aria-selected={selected}
            className={`menu__lang-option${selected ? ' is-active' : ''}`}
            onClick={() => onSelect(item.code)}
          >
            <span className="menu__lang-emoji" aria-hidden="true">
              {item.emoji}
            </span>
            <p className="menu__lang-label">{item.name}</p>
          </button>
        );
      })}
    </motion.div>
  );
}

export function Menu({ onOpenResume }) {
  const still = useStillMode();
  const { path, navigate } = useRouter();
  const { canShowAdminInMenu } = useCms();
  const { lang, langMeta, languages, setLang, t } = useI18n();

  const [aboutInView, setAboutInView] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('lednique-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  const [a11y, setA11y] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.a11y === 'true'
  );
  const [interactionTick, setInteractionTick] = useState(0);
  const wrapDesktopRef = useRef(null);
  const wrapMobileRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    try {
      localStorage.setItem('lednique-theme', theme);
    } catch {
      // Ignore
    }
    if (a11y) {
      root.dataset.a11y = 'true';
    } else {
      delete root.dataset.a11y;
    }
  }, [theme, a11y]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        setA11y((v) => !v);
      }
      if (e.key === 'Escape') {
        if (langOpen) {
          setLangOpen(false);
        } else {
          setMobileOpen(false);
          setSettingsOpen(false);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [langOpen]);

  // Track if user is viewing #about on homepage
  useEffect(() => {
    if (path !== '/') {
      setAboutInView(false);
      return;
    }
    const update = () => {
      const el = document.getElementById('about');
      if (!el) {
        setAboutInView(false);
        return;
      }
      const r = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.45;
      setAboutInView(r.top <= mid && r.bottom > mid);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [path]);

  const closeAll = useCallback(() => {
    setMobileOpen(false);
    setSettingsOpen(false);
    setLangOpen(false);
  }, []);

  const bumpInteraction = useCallback(() => {
    setInteractionTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!mobileOpen && !settingsOpen && !langOpen) return;
    const onScroll = () => closeAll();
    const onPointerDownOutside = (e) => {
      const inDesktop = wrapDesktopRef.current?.contains(e.target);
      const inMobile = wrapMobileRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) closeAll();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onPointerDownOutside);
    const timer = window.setTimeout(closeAll, langOpen ? 18000 : 10000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onPointerDownOutside);
      window.clearTimeout(timer);
    };
  }, [mobileOpen, settingsOpen, langOpen, interactionTick, closeAll]);

  const isHomeLogoActive = path === '/' && !aboutInView;
  const isAdmin = path === '/admin';
  const anyMobilePanel = mobileOpen || settingsOpen;

  const isLinkActive = (link) => {
    if (settingsOpen) return false;
    if (link.type === 'anchor') {
      return path === '/' && aboutInView;
    }
    return path === link.path;
  };

  const handleLinkSelect = (link) => {
    closeAll();
    if (link.type === 'anchor') {
      navigate('/', { anchor: link.anchor });
    } else {
      navigate(link.path);
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    closeAll();
    navigate('/');
  };

  const handleResumeClick = () => {
    closeAll();
    onOpenResume?.();
  };

  const handleAdminOpen = () => {
    closeAll();
    navigate('/admin');
  };

  const toggleDesktopSettings = () => {
    bumpInteraction();
    setSettingsOpen((v) => {
      if (v) setLangOpen(false);
      return !v;
    });
  };

  const toggleLangDropdown = () => {
    bumpInteraction();
    setLangOpen((v) => !v);
  };

  const handleSelectLang = (code) => {
    bumpInteraction();
    setLang(code);
    setLangOpen(false);
  };

  const toggleTheme = () => {
    bumpInteraction();
    setTheme((tVal) => (tVal === 'dark' ? 'light' : 'dark'));
  };

  const toggleA11y = () => {
    bumpInteraction();
    setA11y((v) => !v);
  };

  const desktopPopoverProps = still ? {} : POPOVER_ANIM;

  return (
    <>
      {/* Desktop glass island menu */}
      <div
        className="menu-wrap menu-wrap--desktop"
        ref={wrapDesktopRef}
        onPointerDown={bumpInteraction}
      >
        <header className="menu menu--desktop glass-island">
          <a
            className={`menu__logo${isHomeLogoActive ? '' : ' menu__logo--flat'}${
              isHomeLogoActive && !settingsOpen ? ' menu__logo--active' : ''
            }`}
            href="#/"
            aria-label={t('LEDNIQUE — на главную')}
            onClick={handleLogoClick}
          >
            {isHomeLogoActive && !settingsOpen && <span className="menu__active-pill" />}
            <MenuLogoMark />
          </a>

          {DESKTOP_LINKS.map((link) => (
            <NavItem
              key={link.label}
              link={link}
              active={isLinkActive(link)}
              onSelect={handleLinkSelect}
              t={t}
            />
          ))}

          <ResumeButton onOpen={handleResumeClick} t={t} />

          <button
            className={`menu__settings${settingsOpen || isAdmin ? ' is-active' : ''}`}
            aria-label={t('Настройки и кабинет')}
            aria-expanded={settingsOpen}
            onClick={toggleDesktopSettings}
            type="button"
          >
            <SettingsIcon />
          </button>
        </header>

        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              className="menu__popover menu__popover--desktop"
              {...desktopPopoverProps}
            >
              <div className="menu__panel menu__panel--dark">
                <SettingsControls
                  theme={theme}
                  a11y={a11y}
                  isAdmin={isAdmin}
                  canShowAdmin={canShowAdminInMenu}
                  langMeta={langMeta}
                  langOpen={langOpen}
                  onLangToggle={toggleLangDropdown}
                  onThemeToggle={toggleTheme}
                  onA11yToggle={toggleA11y}
                  onAdminOpen={handleAdminOpen}
                  t={t}
                />
              </div>

              <AnimatePresence>
                {langOpen && (
                  <LanguageDropdown
                    languages={languages}
                    currentCode={lang}
                    onSelect={handleSelectLang}
                    still={still}
                    t={t}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile glass island menu */}
      <div
        className="menu-wrap menu-wrap--mobile"
        ref={wrapMobileRef}
        onPointerDown={bumpInteraction}
      >
        <header className="menu menu--mobile glass-island">
          <a
            className={`menu__logo${
              anyMobilePanel || !isHomeLogoActive ? ' menu__logo--flat' : ' menu__logo--active'
            }`}
            href="#/"
            aria-label={t('LEDNIQUE — на главную')}
            onClick={handleLogoClick}
          >
            {!anyMobilePanel && isHomeLogoActive && <span className="menu__active-pill" />}
            <MenuLogoMark />
          </a>

          <NavItem
            link={MOBILE_ABOUT_LINK}
            compact
            active={!anyMobilePanel && isLinkActive(MOBILE_ABOUT_LINK)}
            onSelect={handleLinkSelect}
            t={t}
          />

          <button
            className={`menu__toggle${anyMobilePanel || isAdmin ? ' is-active' : ''}`}
            aria-label={t('Меню')}
            aria-expanded={mobileOpen}
            onClick={() => {
              bumpInteraction();
              if (mobileOpen) {
                closeAll();
              } else {
                setMobileOpen(true);
                setSettingsOpen(false);
                setLangOpen(false);
              }
            }}
            type="button"
          >
            <MobileDotsIcon />
          </button>
        </header>

        <AnimatePresence>
          {(mobileOpen || settingsOpen) && (
            <motion.div
              className="menu__popover menu__popover--mobile"
              initial={still ? false : MOBILE_POPOVER_ANIM.initial}
              animate={still ? undefined : MOBILE_POPOVER_ANIM.animate}
              exit={still ? undefined : MOBILE_POPOVER_ANIM.exit}
              transition={MOBILE_POPOVER_ANIM.transition}
            >
              {mobileOpen && (
                <div className="menu__unfold menu__unfold--static">
                  {MOBILE_LINKS.map((link) => (
                    <div key={link.label}>
                      <NavItem
                        link={link}
                        active={isLinkActive(link)}
                        onSelect={handleLinkSelect}
                        t={t}
                      />
                    </div>
                  ))}
                  <div>
                    <ResumeButton onOpen={handleResumeClick} t={t} />
                  </div>
                  <button
                    className={`menu__item nav-label menu__settings menu__settings--unfold${
                      settingsOpen ? ' is-active' : ''
                    }`}
                    aria-label={t('Настройки')}
                    aria-expanded={settingsOpen}
                    aria-controls="mobile-settings"
                    onClick={() => {
                      bumpInteraction();
                      setMobileOpen(true);
                      setSettingsOpen((v) => {
                        if (v) setLangOpen(false);
                        return !v;
                      });
                    }}
                    type="button"
                  >
                    <SettingsIcon />
                  </button>
                </div>
              )}

              {settingsOpen && (
                <div className="menu__panel-stack">
                  <div className="menu__panel menu__panel--dark" id="mobile-settings">
                    <SettingsControls
                      theme={theme}
                      a11y={a11y}
                      isAdmin={isAdmin}
                      canShowAdmin={canShowAdminInMenu}
                      langMeta={langMeta}
                      langOpen={langOpen}
                      onLangToggle={toggleLangDropdown}
                      onThemeToggle={toggleTheme}
                      onA11yToggle={toggleA11y}
                      onAdminOpen={handleAdminOpen}
                      t={t}
                    />
                  </div>
                  <AnimatePresence>
                    {langOpen && (
                      <LanguageDropdown
                        languages={languages}
                        currentCode={lang}
                        onSelect={handleSelectLang}
                        still={still}
                        t={t}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
