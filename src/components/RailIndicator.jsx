import React from 'react';
import { useI18n } from '../i18n/I18nContext';

/**
 * Horizontal glowing progress rail matching the homepage AI slider.
 * Interaction matches homepage AiSection:
 *  - Clicking / tapping the LEFT half moves 1 card backward (-1)
 *  - Clicking / tapping the RIGHT half advances 1 card forward (+1)
 *  - ArrowLeft / ArrowRight keys step -1 / +1
 */
export function RailIndicator({
  total,
  activeIndex,
  progressRef,
  still = false,
  onStep,
  ariaLabel = 'Слайды',
}) {
  const { t } = useI18n();

  if (!total || total <= 1) return null;

  const compact = total > 8;

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isPrev = e.clientX - rect.left < rect.width / 2;
    onStep?.(isPrev ? -1 : 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onStep?.(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onStep?.(1);
    }
  };

  return (
    <div className="v2-rail-wrap">
      <div
        ref={progressRef}
        className={`v2-rail${compact ? ' v2-rail--compact' : ''}`}
        data-still={still ? 'true' : 'false'}
        role="slider"
        tabIndex={0}
        aria-label={t(ariaLabel)}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, total - 1)}
        aria-valuenow={activeIndex}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
      >
        {Array.from({ length: total }, (_, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          return (
            <span
              key={idx}
              aria-hidden="true"
              className={[
                'v2-rail__bar',
                isDone ? 'v2-rail__bar--done' : '',
                isActive ? 'v2-rail__bar--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          );
        })}
      </div>
    </div>
  );
}
