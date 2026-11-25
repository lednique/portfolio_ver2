import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { useRouter } from '../router';
import { EASE_OUT } from './Reveal';

export function DiscussButtons({ worksPath, showWorks = true, extraButton = null }) {
  const still = useStillMode();
  const { navigate } = useRouter();
  const { t } = useI18n();

  const scrollToRequest = () => {
    const el = document.getElementById('request');
    if (el) {
      el.scrollIntoView({
        behavior: still ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <motion.div
      className="discuss"
      data-reveal="1"
      initial={still ? false : { opacity: 0, y: 24 }}
      animate={still ? { opacity: 1, y: 0 } : undefined}
      whileInView={still ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: still ? 0 : 0.65, ease: EASE_OUT }}
    >
      <button className="discuss__button" type="button" onClick={scrollToRequest}>
        {t('обсудить проект')}
      </button>
      {showWorks && worksPath && (
        <a
          className="discuss__button discuss__button--lime"
          href={`#${worksPath}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(worksPath);
          }}
        >
          {t('смотреть работы')}
        </a>
      )}
      {extraButton}
    </motion.div>
  );
}
