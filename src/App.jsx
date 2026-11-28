import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { CmsProvider } from './data/CmsContext';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { RouterProvider, useRouter } from './router';
import { Footer } from './components/Footer';
import { warmUpGame } from './gameWarmup';
import { Menu } from './components/Menu';
import { ResumeModal } from './components/ResumeModal';
import { HomePage } from './pages/HomePage';

// Route-level code splitting: the admin bundle (1599 LOC) and the subpages no
// longer ship with the landing page.
const AdminPage = React.lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const AiPage = React.lazy(() => import('./pages/AiPage').then((m) => ({ default: m.AiPage })));
const ArPage = React.lazy(() => import('./pages/ArPage').then((m) => ({ default: m.ArPage })));
const DesignPage = React.lazy(() =>
  import('./pages/DesignPage').then((m) => ({ default: m.DesignPage }))
);

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

  // Previously the hero stayed at opacity:0 until window.load — i.e. until every
  // hero texture, video and wasm file had finished. Revealing it after the first
  // painted frame removes the hero from the critical-path wait entirely.
  useEffect(() => {
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        document.documentElement.classList.add('is-loaded');
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, []);

  // Download the /ar game in the background (after load + idle), but never while
  // the visitor is already on /ar — there the iframe is the fastest path.
  useEffect(() => {
    if (path !== '/ar') warmUpGame();
  }, [path]);

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
        <main>
          <React.Suspense fallback={null}>{renderPage()}</React.Suspense>
        </main>
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
