import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { RailIndicator } from './RailIndicator';

const FALLBACK_SLIDE_MS = 7000;

function ArVideoSlide({
  item,
  isActive,
  onActivate,
  onProgress,
  onEnded,
}) {
  const { resolveUrl } = useCms();
  const { t } = useI18n();
  const still = useStillMode();
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const videoSrc = resolveUrl(item.videoSrc);
  const posterSrc = resolveUrl(item.posterSrc);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    // Video must ALWAYS stay muted — no audio button
    vid.muted = true;
    vid.defaultMuted = true;

    if (isActive && !still && !paused) {
      vid.currentTime = 0;
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isActive, still, paused, videoSrc]);

  // Smoothly report active video progress to the horizontal glowing rail
  useEffect(() => {
    if (!isActive || still || paused) return;
    let rafId = 0;
    const startTs = performance.now();

    const tick = (now) => {
      const vid = videoRef.current;
      if (vid && Number.isFinite(vid.duration) && vid.duration > 0.4) {
        const p = Math.min(1, vid.currentTime / vid.duration);
        onProgress?.(p);
      } else {
        const elapsed = now - startTs;
        const p = Math.min(1, elapsed / FALLBACK_SLIDE_MS);
        onProgress?.(p);
        if (elapsed >= FALLBACK_SLIDE_MS) {
          onEnded?.();
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isActive, still, paused, onProgress, onEnded]);

  const handleTogglePlay = () => {
    if (!isActive) {
      onActivate();
      setPaused(false);
      return;
    }
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      setPaused(false);
      vid.play().catch(() => {});
    } else {
      setPaused(true);
      vid.pause();
    }
  };

  return (
    <article className={`v2-ar-slide${isActive ? ' is-center' : ''}`}>
      <div className="v2-ar-slide__frame" onClick={handleTogglePlay}>
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc || undefined}
            playsInline
            muted
            loop={still}
            preload={isActive ? 'auto' : 'metadata'}
            onEnded={() => {
              if (isActive && !still) onEnded?.();
            }}
          />
        ) : posterSrc ? (
          <img src={posterSrc} alt={item.title ? t(item.title) : ''} />
        ) : (
          <div className="v2-ar-slide__empty">{t('Видео не загружено')}</div>
        )}

        {item.tag && (
          <div className="v2-ar-slide__top-badges">
            <span className="v2-ar-slide__tag">{t(item.tag)}</span>
          </div>
        )}

        <div className="v2-ar-slide__gradient" aria-hidden="true" />

        <div className="v2-ar-slide__meta">
          <h3 className="v2-ar-slide__title">{t(item.title)}</h3>
          {item.subtitle && <p className="v2-ar-slide__sub">{t(item.subtitle)}</p>}
        </div>

        {(paused || !isActive || still) && videoSrc && (
          <div className="v2-ar-slide__play-pill" aria-hidden="true">
            ▶
          </div>
        )}
      </div>
    </article>
  );
}

export function VideoCarousel({ items = [] }) {
  const { t } = useI18n();
  const still = useStillMode();
  const trackRef = useRef(null);
  const railRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const hoveredRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const activeIdxRef = useRef(0);
  activeIdxRef.current = activeIndex;

  const updateActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.v2-ar-slide'));
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
    if (bestIdx !== activeIdxRef.current) {
      setActiveIndex(bestIdx);
      railRef.current?.style.setProperty('--rail-progress', '0.04');
    }
  }, []);

  const scrollToIndex = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.v2-ar-slide'));
    if (!slides.length) return;
    const wrapped = ((idx % slides.length) + slides.length) % slides.length;
    const slide = slides[wrapped];
    const target = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    setActiveIndex(wrapped);
    railRef.current?.style.setProperty('--rail-progress', '0.04');
    track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, []);

  const handleProgress = useCallback((p) => {
    if (railRef.current) {
      railRef.current.style.setProperty(
        '--rail-progress',
        Math.max(0.04, Math.min(1, p)).toFixed(4)
      );
    }
  }, []);

  const handleEnded = useCallback(() => {
    if (hoveredRef.current || dragRef.current.active || items.length <= 1) {
      // Loop current video when user hovers
      const track = trackRef.current;
      const vid = track?.querySelectorAll('.v2-ar-slide video')?.[activeIdxRef.current];
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      }
      return;
    }
    scrollToIndex(activeIdxRef.current + 1);
  }, [items.length, scrollToIndex]);

  useEffect(() => {
    updateActive();
    window.addEventListener('resize', updateActive);
    return () => window.removeEventListener('resize', updateActive);
  }, [updateActive, items.length]);

  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { active: true, startX: e.clientX, startScroll: track.scrollLeft };
    track.classList.add('is-dragging');
  };

  const onMouseMove = (e) => {
    if (!dragRef.current.active) return;
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = dragRef.current.startScroll - (e.clientX - dragRef.current.startX);
  };

  const onMouseUp = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    trackRef.current?.classList.remove('is-dragging');
  };

  if (!items.length) {
    return (
      <div className="v2-empty-gallery">
        {t('Видео AR-эффектов пока нет — добавьте их в личном кабинете')}
      </div>
    );
  }

  return (
    <div
      className="v2-ar-carousel"
      role="region"
      aria-label={t('Галерея AR-эффектов')}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
        onMouseUp();
      }}
    >
      <div
        className="v2-ar-carousel__track"
        ref={trackRef}
        onScroll={updateActive}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {items.map((item, idx) => (
          <ArVideoSlide
            key={item.id || idx}
            item={item}
            isActive={idx === activeIndex}
            onActivate={() => scrollToIndex(idx)}
            onProgress={idx === activeIndex ? handleProgress : undefined}
            onEnded={idx === activeIndex ? handleEnded : undefined}
          />
        ))}
      </div>

      <RailIndicator
        total={items.length}
        activeIndex={activeIndex}
        progressRef={railRef}
        still={still}
        onSelect={scrollToIndex}
        ariaLabel="Галерея AR-эффектов"
      />
    </div>
  );
}
