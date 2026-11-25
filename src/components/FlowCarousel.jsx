import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';

export function FlowCarousel({
  items = [],
  variant = 'portrait', // 'portrait' | 'wide'
  ariaLabel = 'Галерея работ',
  onSelect,
}) {
  const { resolveUrl } = useCms();
  const { t } = useI18n();
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.v2-flow__slide'));
    if (!slides.length) return;
    const centerX = track.scrollLeft + track.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    slides.forEach((slide, i) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(slideCenter - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    setActiveIndex(bestIdx);
  }, []);

  useEffect(() => {
    updateActive();
    window.addEventListener('resize', updateActive);
    return () => window.removeEventListener('resize', updateActive);
  }, [updateActive, items.length]);

  const scrollToIndex = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.v2-flow__slide'));
    if (!slides.length) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, idx));
    const slide = slides[clamped];
    const target = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    };
    track.classList.add('is-dragging');
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.active) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    track.scrollLeft = d.startScroll - dx;
  };

  const onPointerUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    trackRef.current?.classList.remove('is-dragging');
    // Delay resetting moved so click handler sees it
    setTimeout(() => {
      dragRef.current.moved = false;
    }, 30);
  };

  if (!items.length) {
    return (
      <div className="v2-empty-gallery">
        {t('Галерея пуста — добавьте работы в личном кабинете')}
      </div>
    );
  }

  return (
    <div
      className={`v2-flow v2-flow--${variant}`}
      role="region"
      aria-label={t(ariaLabel)}
    >
      <div
        className="v2-flow__track"
        ref={trackRef}
        onScroll={updateActive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {items.map((item, idx) => {
          const src = resolveUrl(item.src);
          const isCurrent = idx === activeIndex;
          const label = item.alt ? t(item.alt) : '';
          return (
            <div
              key={item.id || `${item.src}-${idx}`}
              className={`v2-flow__slide${isCurrent ? ' is-center' : ''}`}
            >
              <button
                type="button"
                className="v2-flow__card"
                onClick={() => {
                  if (dragRef.current.moved) return;
                  if (onSelect && src) {
                    onSelect({ src, alt: label || t(ariaLabel), caption: label });
                  }
                }}
                aria-label={label ? `${t('Открыть')}: ${label}` : t('Открыть изображение')}
              >
                {src ? (
                  <img
                    src={src}
                    alt={label}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <div className="v2-flow__placeholder" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="v2-flow__controls">
          <button
            type="button"
            className="v2-flow__nav"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex <= 0}
            aria-label={t('Предыдущий слайд')}
          >
            ←
          </button>
          <div className="v2-flow__dots" role="tablist" aria-label={t('Слайды')}>
            {items.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                className={`v2-flow__dot${idx === activeIndex ? ' is-active' : ''}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={t('Слайд {n}', { n: idx + 1 })}
                aria-selected={idx === activeIndex}
              />
            ))}
          </div>
          <button
            type="button"
            className="v2-flow__nav"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex >= items.length - 1}
            aria-label={t('Следующий слайд')}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
