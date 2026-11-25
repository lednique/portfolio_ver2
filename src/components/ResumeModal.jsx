import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStillMode } from '../hooks/useA11y';
import { EASE_OUT } from './Reveal';

const RESUME_PDF = './assets/resume/resume.pdf';

export function ResumeModal({ onClose, pdfUrl = RESUME_PDF, filename = 'Виктор_Власов_резюме.pdf' }) {
  const still = useStillMode();

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
        aria-label="Резюме — Виктор Власов"
        initial={still ? false : { opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={still ? undefined : { opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: still ? 0 : 0.45, ease: EASE_OUT }}
      >
        <button
          className="resume__close"
          type="button"
          onClick={onClose}
          aria-label="Закрыть резюме"
        >
          ×
        </button>
        <iframe
          className="resume__pdf"
          src={pdfUrl}
          title="Предпросмотр резюме — Виктор Власов"
        />
        <div className="resume__actions">
          <a className="resume__download" href={pdfUrl} download={filename}>
            скачать pdf
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
