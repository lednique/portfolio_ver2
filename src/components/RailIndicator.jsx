import React from 'react';
import { useI18n } from '../i18n/I18nContext';

/**
 * Horizontal progress rail matching the homepage AI gallery indicator (.ai__rail):
 * Dark-grey pill island (#333 + HDR rim) with glowing white active progress fill.
 */
export function RailIndicator({
  total = 0,
  activeIndex = 0,
  progressRef = null,
  progress = 0,
  still = false,
  onSelect,
  ariaLabel = 'Слайды',
}) {
  const { t } = useI18n();
  if (total <= 1) return null;

  const isCompact = total > 8;

  return (
    <div className="v2-rail-wrap">
      <div
        ref={progressRef}
        className={`v2-rail${isCompact ? ' v2-rail--compact' : ''}`}
        data-still={still ? 'true' : 'false'}
        role="tablist"
        aria-label={t(ariaLabel)}
        style={{ '--rail-progress': still ? 1 : progress }}
      >
        {Array.from({ length: total }, (_, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={t('Слайд {n}', { n: idx + 1 })}
              className={[
                'v2-rail__bar',
                isDone ? 'v2-rail__bar--done' : '',
                isActive ? 'v2-rail__bar--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect?.(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}
