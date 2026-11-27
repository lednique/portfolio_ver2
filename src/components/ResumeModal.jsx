import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { CloseIcon } from './Icons';
import { EASE_OUT } from './Reveal';

const RESUME_PDF_RU = './assets/resume/resume.pdf';
const RESUME_PDF_EN = './assets/resume/resume-en.pdf';
const RESUME_PREVIEW_RU = './assets/resume/resume-preview.webp';
const RESUME_PREVIEW_EN = './assets/resume/resume-en-preview.webp';

export function ResumeModal({ onClose, pdfUrl, filename }) {
  const still = useStillMode();
  const { lang, t } = useI18n();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1000px)').matches
  );

  const isRu = lang === 'ru';
  const resolvedPdf = pdfUrl || (isRu ? RESUME_PDF_RU : RESUME_PDF_EN);
  const resolvedPreview = !pdfUrl ? (isRu ? RESUME_PREVIEW_RU : RESUME_PREVIEW_EN) : null;
  const resolvedFilename =
    filename || (isRu ? 'Виктор_Власов_резюме.pdf' : 'Viktor_Vlasov_Resume.pdf');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1000px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const showMobilePreview = isMobile && Boolean(resolvedPreview);

  return (
    <motion.div
      className="resume__backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={still ? undefined : { opacity: 0 }}
      transition={{ duration: still ? 0 : 0.25, ease: EASE_OUT }}
    >
      <motion.div
        className="resume__sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('Резюме — Виктор Власов')}
        initial={still ? false : { opacity: 0, y: isMobile ? 0 : 32, scale: isMobile ? 1 : 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={still ? undefined : { opacity: 0, y: isMobile ? 0 : 20, scale: isMobile ? 1 : 0.98 }}
        transition={{ duration: still ? 0 : 0.35, ease: EASE_OUT }}
      >
        <div className="resume__controls">
          <a className="resume__download" href={resolvedPdf} download={resolvedFilename}>
            <span className="resume__btn-label">{t('скачать pdf')}</span>
          </a>
          <button
            className="resume__close"
            type="button"
            onClick={onClose}
            aria-label={t('Закрыть резюме')}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {showMobilePreview ? (
          <div className="resume__preview-wrap">
            <img
              className="resume__preview-img"
              src={resolvedPreview}
              alt={t('Предпросмотр резюме — Виктор Власов')}
              draggable={false}
            />
          </div>
        ) : (
          <iframe
            className="resume__pdf"
            src={resolvedPdf}
            title={t('Предпросмотр резюме — Виктор Власов')}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
