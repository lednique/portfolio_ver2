import React, { useEffect } from 'react';
import { MotionConfig, motion, useScroll, useSpring } from 'framer-motion';
import { CmsProvider } from './data/CmsContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { RouterProvider, useRouter } from './router';
import { Footer } from './components/Footer';
import { Menu } from './components/Menu';
import { AdminPage } from './pages/AdminPage';
import { AiPage } from './pages/AiPage';
import { ArPage } from './pages/ArPage';
import { DesignPage } from './pages/DesignPage';
import { HomePage } from './pages/HomePage';
import { ResumePage } from './pages/ResumePage';

const ROUTE_TITLES = {
  '/': 'LEDNIQUE — Design küchen',
  '/design': 'Графический дизайн — LEDNIQUE',
  '/ai': 'AI-продакшн — LEDNIQUE',
  '/ar': 'AR-эффекты — LEDNIQUE',
  '/resume': 'Резюме — Виктор Власов · LEDNIQUE',
  '/admin': 'Личный кабинет — LEDNIQUE',
};

function AppShell() {
  const { path } = useRouter();
  const { t, lang } = useI18n();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    mass: 0.3,
  });

  useEffect(() => {
    let triggered = false;
    let raf1 = 0;
    let raf2 = 0;

    const triggerFade = () => {
      if (triggered) return;
      triggered = true;
      // Wait 2 animation frames so the initial opacity:0 paints and CSS fade transition always plays
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          document.documentElement.classList.add('is-loaded');
        });
      });
    };

    const timer = window.setTimeout(triggerFade, 500);

    if (document.readyState === 'complete') {
      triggerFade();
    } else {
      window.addEventListener('load', triggerFade, { once: true });
    }

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('load', triggerFade);
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    const rawTitle = ROUTE_TITLES[path] || ROUTE_TITLES['/'];
    document.title = t(rawTitle);
  }, [path, lang, t]);

  const renderPage = () => {
    switch (path) {
      case '/design':
        return <DesignPage />;
      case '/ai':
        return <AiPage />;
      case '/ar':
        return <ArPage />;
      case '/resume':
        return <ResumePage />;
      case '/admin':
        return <AdminPage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          transformOrigin: '0%',
          scaleX,
          background: 'var(--lime)',
          zIndex: 300,
        }}
      />
      <Menu />
      <div className="site">
        <main>{renderPage()}</main>
        <Footer />
      </div>
    </MotionConfig>
  );
}

export function App() {
  return (
    <I18nProvider>
      <CmsProvider>
        <RouterProvider>
          <AppShell />
        </RouterProvider>
      </CmsProvider>
    </I18nProvider>
  );
}

export default App;
