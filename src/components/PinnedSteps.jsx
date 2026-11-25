import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { EASE_OUT, Reveal } from './Reveal';

export function PinnedSteps({ title, subtitle, steps = [], onImageClick }) {
  const still = useStillMode();
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);

  // Sync active step with scroll position on desktop
  useEffect(() => {
    const update = () => {
      if (window.innerWidth <= 900) return;
      const mid = window.innerHeight * 0.45;
      let best = 0;
      let bestDist = Infinity;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActive(best);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [steps.length]);

  const current = steps[active] || steps[0];

  return (
    <section className="sub-section content v2-pinned">
      <div className="sub-section__head">
        <Reveal as="h2" className="sub-heading">
          {t(title)}
        </Reveal>
        {subtitle && (
          <Reveal as="p" className="sub-lead" delay={0.08}>
            {t(subtitle)}
          </Reveal>
        )}
      </div>

      <div className="v2-pinned__grid">
        <div className="v2-pinned__list">
          {steps.map((step, i) => {
            const isActive = i === active;
            const stTitle = t(step.title);
            const stText = t(step.text);
            return (
              <div
                key={step.number || i}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className={`v2-pinned__step${isActive ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActive(i);
                  }
                }}
              >
                <div className="v2-pinned__step-head">
                  <span className="v2-pinned__num">{step.number}</span>
                  <h3 className="v2-pinned__title">{stTitle}</h3>
                </div>
                <p className="v2-pinned__text">{stText}</p>

                {/* Mobile inline preview */}
                <div className="v2-pinned__mobile-img">
                  <img
                    src={step.img}
                    alt={stTitle}
                    loading="lazy"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageClick?.({ src: step.img, alt: stTitle, caption: stTitle });
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="v2-pinned__stage-col">
          <div className="v2-pinned__stage">
            <AnimatePresence mode="wait">
              {current && (
                <motion.button
                  key={current.img}
                  type="button"
                  className="v2-pinned__photo-btn"
                  initial={still ? false : { opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={still ? undefined : { opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  onClick={() =>
                    onImageClick?.({
                      src: current.img,
                      alt: t(current.title),
                      caption: `${current.number} — ${t(current.title)}`,
                    })
                  }
                  aria-label={`${t('Открыть')}: ${t(current.title)}`}
                >
                  <img src={current.img} alt={t(current.title)} />
                  <span className="v2-pinned__stage-badge">
                    {current.number} · {t(current.title)}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
