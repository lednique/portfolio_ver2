import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { CloseIcon } from './Icons';
import { EASE_OUT } from './Reveal';

export function Lightbox({ item, onClose }) {
  const still = useStillMode();
  const { t } = useI18n();

  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="v2-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={item.alt ? t(item.alt) : t('Просмотр изображения')}
          initial={still ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={still ? undefined : { opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE_OUT }}
          onClick={onClose}
        >
          <motion.div
            className="v2-lightbox__card"
            initial={still ? false : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={still ? undefined : { opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="v2-lightbox__close"
              type="button"
              onClick={onClose}
              aria-label={t('Закрыть')}
            >
              <CloseIcon />
            </button>
            <div className="v2-lightbox__stage">
              <img src={item.src} alt={item.alt ? t(item.alt) : ''} />
            </div>
            {(item.caption || item.alt) && (
              <div className="v2-lightbox__caption">{t(item.caption || item.alt)}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
