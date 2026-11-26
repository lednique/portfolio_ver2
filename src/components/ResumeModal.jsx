import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { EASE_OUT } from './Reveal';

const RESUME_PDF_RU = './assets/resume/resume.pdf';
const RESUME_PDF_EN = './assets/resume/resume-en.pdf';

export function ResumeModal({ onClose, pdfUrl, filename }) {
  const still = useStillMode();
  const { lang, t } = useI18n();

  const resolvedPdf = pdfUrl || (lang === 'ru' ? RESUME_PDF_RU : RESUME_PDF_EN);
  const resolvedFilename =
    filename || (lang === 'ru' ? 'Виктор_Власов_резюме.pdf' : 'Viktor_Vlasov_Resume.pdf');

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
        initial={still ? false : { opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={still ? undefined : { opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: still ? 0 : 0.45, ease: EASE_OUT }}
      >
        <button
          className="resume__close"
          type="button"
          onClick={onClose}
          aria-label={t('Закрыть резюме')}
        >
          ×
        </button>
        <iframe
          className="resume__pdf"
          src={resolvedPdf}
          title={t('Предпросмотр резюме — Виктор Власов')}
        />
        <div className="resume__actions">
          <a className="resume__download" href={resolvedPdf} download={resolvedFilename}>
            {t('скачать pdf')}
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
