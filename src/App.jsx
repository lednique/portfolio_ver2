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
    document.documentElement.classList.add('is-loaded');
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
      <div className="site is-loaded">
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
