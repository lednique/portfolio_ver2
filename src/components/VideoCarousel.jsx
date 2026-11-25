import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { useStillMode } from '../hooks/useA11y';

function ArVideoSlide({ item, isActive, globalMuted, onToggleMute, onActivate }) {
  const { resolveUrl } = useCms();
  const still = useStillMode();
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const videoSrc = resolveUrl(item.videoSrc);
  const posterSrc = resolveUrl(item.posterSrc);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = globalMuted;
    if (isActive && !still && !paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isActive, still, paused, globalMuted, videoSrc]);

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
            loop
            muted={globalMuted}
            preload={isActive ? 'metadata' : 'none'}
          />
        ) : posterSrc ? (
          <img src={posterSrc} alt={item.title || ''} />
        ) : (
          <div className="v2-ar-slide__empty">Видео не загружено</div>
        )}

        <div className="v2-ar-slide__top-badges">
          {item.tag && <span className="v2-ar-slide__tag">{item.tag}</span>}
          {isActive && videoSrc && (
            <button
              type="button"
              className="v2-ar-slide__mute"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              aria-label={globalMuted ? 'Включить звук' : 'Выключить звук'}
              title={globalMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {globalMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>

        <div className="v2-ar-slide__gradient" aria-hidden="true" />

        <div className="v2-ar-slide__meta">
          <h3 className="v2-ar-slide__title">{item.title}</h3>
          {item.subtitle && <p className="v2-ar-slide__sub">{item.subtitle}</p>}
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
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

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
    setActiveIndex(bestIdx);
  }, []);

  const scrollToIndex = useCallback((idx) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll('.v2-ar-slide'));
    if (!slides.length) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, idx));
    const slide = slides[clamped];
    const target = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, []);

  useEffect(() => {
    updateActive();
    window.addEventListener('resize', updateActive);
    return () => window.removeEventListener('resize', updateActive);
  }, [updateActive, items.length]);

  if (!items.length) {
    return (
      <div className="v2-empty-gallery">
        Видео AR-эффектов пока нет — добавьте их в личном кабинете
      </div>
    );
  }

  return (
    <div className="v2-ar-carousel" role="region" aria-label="Галерея AR-эффектов">
      <div className="v2-ar-carousel__track" ref={trackRef} onScroll={updateActive}>
        {items.map((item, idx) => (
          <ArVideoSlide
            key={item.id || idx}
            item={item}
            isActive={idx === activeIndex}
            globalMuted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onActivate={() => scrollToIndex(idx)}
          />
        ))}
      </div>

      {items.length > 1 && (
        <div className="v2-flow__controls">
          <button
            type="button"
            className="v2-flow__nav"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex <= 0}
            aria-label="Предыдущий эффект"
          >
            ←
          </button>
          <div className="v2-flow__dots">
            {items.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                className={`v2-flow__dot${idx === activeIndex ? ' is-active' : ''}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={item.title || `Эффект ${idx + 1}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="v2-flow__nav"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex >= items.length - 1}
            aria-label="Следующий эффект"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
