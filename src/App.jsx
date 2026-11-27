import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { CmsProvider } from './data/CmsContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { RouterProvider, useRouter } from './router';
import { Footer } from './components/Footer';
import { Menu } from './components/Menu';
import { ResumeModal } from './components/ResumeModal';
import { AdminPage } from './pages/AdminPage';
import { AiPage } from './pages/AiPage';
import { ArPage } from './pages/ArPage';
import { DesignPage } from './pages/DesignPage';
import { HomePage } from './pages/HomePage';

const SITE_TITLE = 'lednique – portfolio';

function AppShell() {
  const { path, navigate } = useRouter();
  const { lang } = useI18n();
  const [resumeOpen, setResumeOpen] = useState(false);

  const isResumeVisible = resumeOpen || path === '/resume';

  const handleOpenResume = useCallback(() => {
    setResumeOpen(true);
  }, []);

  const handleCloseResume = useCallback(() => {
    setResumeOpen(false);
    if (path === '/resume') {
      navigate('/');
    }
  }, [navigate, path]);

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
    document.title = SITE_TITLE;
  }, [path, lang]);

  const renderPage = () => {
    switch (path) {
      case '/design':
        return <DesignPage />;
      case '/ai':
        return <AiPage />;
      case '/ar':
        return <ArPage />;
      case '/admin':
        return <AdminPage />;
      case '/resume':
      case '/':
      default:
        return <HomePage />;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <Menu onOpenResume={handleOpenResume} />
      <div className="site">
        <main>{renderPage()}</main>
        <Footer />
      </div>
      <AnimatePresence>
        {isResumeVisible && <ResumeModal onClose={handleCloseResume} />}
      </AnimatePresence>
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
