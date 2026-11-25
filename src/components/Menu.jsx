import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  { type: 'anchor', path: '/', anchor: 'about', label: 'Обо мне', width: 111 },
  { type: 'route', path: '/design', label: 'Дизайн', width: 105 },
  { type: 'route', path: '/ai', label: 'AI-ПРодакшн', width: 161 },
  { type: 'route', path: '/ar', label: 'AR-Эффекты', width: 152 },
];

const MOBILE_LINKS = [
  { type: 'anchor', path: '/', anchor: 'about', label: 'обо мне', width: 111 },
  { type: 'route', path: '/design', label: 'дизайн', width: 105 },
  { type: 'route', path: '/ai', label: 'AI-Продакшн', width: 161 },
  { type: 'route', path: '/ar', label: 'AR Эффекты', width: 150 },
];

const RESUME_ITEM = { path: '/resume', label: 'резюме', width: 105 };

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

function NavItem({ link, active, onSelect }) {
  const href = link.anchor ? `#${link.path}#${link.anchor}` : `#${link.path}`;
  return (
    <a
      className={`menu__item nav-label${active ? ' is-active' : ''}`}
      href={href}
      style={{ width: link.width }}
      onClick={(e) => {
        e.preventDefault();
        onSelect(link);
      }}
    >
      {active && <span className="menu__active-pill" />}
      <span>{link.label}</span>
    </a>
  );
}

function ResumeLink({ active, compact, onSelect }) {
  return (
    <a
      className={`menu__item nav-label menu__resume${active ? ' is-active' : ''}`}
      href="#/resume"
      style={{ width: compact ? undefined : RESUME_ITEM.width }}
      onClick={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      {active && <span className="menu__active-pill" />}
      <span>{RESUME_ITEM.label}</span>
    </a>
  );
}

function SettingsControls({ theme, a11y, isAdmin, onThemeToggle, onA11yToggle, onAdminOpen }) {
  return (
    <>
      <button
        className={`menu__control menu__control--a11y${a11y ? ' is-active' : ''}`}
        onClick={onA11yToggle}
        aria-label="Упрощённый режим"
        aria-pressed={a11y}
        title="Упрощённый режим (Alt+A)"
        type="button"
      >
        <A11yIcon />
      </button>
      <button
        className={`menu__control menu__control--admin${isAdmin ? ' is-active' : ''}`}
        onClick={onAdminOpen}
        aria-label="Личный кабинет"
        title="Личный кабинет — настройка контента"
        type="button"
      >
        <AdminIcon />
      </button>
      <div className="menu__item nav-label menu__control--lang-text">
        <span>русский</span>
      </div>
      <button
        className="menu__control menu__control--theme is-active"
        onClick={onThemeToggle}
        aria-label={theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
        aria-pressed={theme === 'dark'}
        title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
        type="button"
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </button>
    </>
  );
}

export function Menu() {
  const still = useStillMode();
  const { path, navigate } = useRouter();
  const [aboutInView, setAboutInView] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
        setMobileOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
  }, []);

  const bumpInteraction = useCallback(() => {
    setInteractionTick((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!mobileOpen && !settingsOpen) return;
    const onScroll = () => closeAll();
    const onPointerDownOutside = (e) => {
      const inDesktop = wrapDesktopRef.current?.contains(e.target);
      const inMobile = wrapMobileRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) closeAll();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onPointerDownOutside);
    const timer = window.setTimeout(closeAll, 8000);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onPointerDownOutside);
      window.clearTimeout(timer);
    };
  }, [mobileOpen, settingsOpen, interactionTick, closeAll]);

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
    navigate('/resume');
  };

  const handleAdminOpen = () => {
    closeAll();
    navigate('/admin');
  };

  const toggleDesktopSettings = () => {
    bumpInteraction();
    setSettingsOpen((v) => !v);
  };

  const toggleTheme = () => {
    bumpInteraction();
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
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
            aria-label="LEDNIQUE — на главную"
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
            />
          ))}

          <ResumeLink
            active={!settingsOpen && path === '/resume'}
            onSelect={handleResumeClick}
          />

          <button
            className={`menu__settings${settingsOpen || isAdmin ? ' is-active' : ''}`}
            aria-label="Настройки и кабинет"
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
                  onThemeToggle={toggleTheme}
                  onA11yToggle={toggleA11y}
                  onAdminOpen={handleAdminOpen}
                />
              </div>
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
            aria-label="LEDNIQUE — на главную"
            onClick={handleLogoClick}
          >
            {!anyMobilePanel && isHomeLogoActive && <span className="menu__active-pill" />}
            <MenuLogoMark />
          </a>

          <ResumeLink
            active={!anyMobilePanel && path === '/resume'}
            compact
            onSelect={handleResumeClick}
          />

          <button
            className={`menu__toggle${anyMobilePanel || isAdmin ? ' is-active' : ''}`}
            aria-label="Меню"
            aria-expanded={mobileOpen}
            onClick={() => {
              bumpInteraction();
              if (mobileOpen) {
                closeAll();
              } else {
                setMobileOpen(true);
                setSettingsOpen(false);
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
                      />
                    </div>
                  ))}
                  <button
                    className={`menu__item nav-label menu__settings menu__settings--unfold${
                      settingsOpen ? ' is-active' : ''
                    }`}
                    aria-label="Настройки"
                    aria-expanded={settingsOpen}
                    aria-controls="mobile-settings"
                    onClick={() => {
                      bumpInteraction();
                      setMobileOpen(true);
                      setSettingsOpen((v) => !v);
                    }}
                    type="button"
                  >
                    <SettingsIcon />
                  </button>
                </div>
              )}

              {settingsOpen && (
                <div className="menu__panel menu__panel--dark" id="mobile-settings">
                  <SettingsControls
                    theme={theme}
                    a11y={a11y}
                    isAdmin={isAdmin}
                    onThemeToggle={toggleTheme}
                    onA11yToggle={toggleA11y}
                    onAdminOpen={handleAdminOpen}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
