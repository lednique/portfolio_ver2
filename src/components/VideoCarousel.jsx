import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { RailIndicator } from './RailIndicator';

const AUTO_MS = 8000;
const PRELOAD_AHEAD = 2;

function ArVideoSlide({ item, isActive, shouldPreload, onActivate }) {
  const { resolveUrl } = useCms();
  const { t } = useI18n();
  const still = useStillMode();
  const videoRef = useRef(null);
  const [live, setLive] = useState(false);

  const videoSrc = resolveUrl(item.videoSrc);
  const posterSrc = resolveUrl(item.posterSrc);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    // Always muted — no audio button
    vid.muted = true;
    vid.defaultMuted = true;

    if (isActive && !still) {
      const playPromise = vid.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
      if (vid.readyState >= 3) {
        setLive(true);
      }
    } else {
      vid.pause();
      setLive(false);
    }
  }, [isActive, still, videoSrc]);

  return (
    <article
      className={`v2-ar-slide${isActive ? ' is-center' : ''}`}
      onClick={() => {
        if (!isActive) onActivate?.();
      }}
    >
      <div
        className="v2-ar-slide__frame"
        style={
          posterSrc
            ? { background: `url("${posterSrc}") lightgray 50% / cover no-repeat` }
            : undefined
        }
      >
        {posterSrc && (
          <img
            className="v2-ar-slide__poster"
            src={posterSrc}
            alt={item.title ? t(item.title) : ''}
            loading="lazy"
            draggable={false}
          />
        )}

        {videoSrc ? (
          <video
            ref={videoRef}
            className={`v2-ar-slide__video${live ? ' is-live' : ''}`}
            src={isActive || shouldPreload ? videoSrc : undefined}
            poster={posterSrc || undefined}
            playsInline
            muted
            loop
            preload={isActive || shouldPreload ? 'auto' : 'none'}
            onPlaying={() => setLive(true)}
            onEmptied={() => setLive(false)}
          />
        ) : !posterSrc ? (
          <div className="v2-ar-slide__empty">{t('Видео не загружено')}</div>
        ) : null}

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
      </div>
    </article>
  );
}

export function VideoCarousel({ items = [] }) {
  const { t } = useI18n();
  const still = useStillMode();

  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const railRef = useRef(null);

  const n = items.length;
  const loop = n > 1;
  const base = loop ? n : 0;

  // Infinite loop via ×3 clones — matching original AR video carousel engine
  const slidesData = useMemo(() => {
    if (!loop) return items.map((item, origIdx) => ({ item, origIdx, copy: 1 }));
    return [
      ...items.map((item, origIdx) => ({ item, origIdx, copy: 0 })),
      ...items.map((item, origIdx) => ({ item, origIdx, copy: 1 })),
      ...items.map((item, origIdx) => ({ item, origIdx, copy: 2 })),
    ];
  }, [items, loop]);

  const [curIdx, setCurIdx] = useState(base);
  const [visible, setVisible] = useState(true);

  const curIdxRef = useRef(base);
  curIdxRef.current = curIdx;

  const holdUntilRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStateRef = useRef({ active: false, startX: 0, startScroll: 0, moved: false, startIdx: base });
  const suppressClickRef = useRef(false);
  const idleTimerRef = useRef(0);

  const realIndex = n > 0 ? ((curIdx % n) + n) % n : 0;

  const getSlideNodes = useCallback(() => {
    const track = trackRef.current;
    if (!track) return [];
    return Array.from(track.querySelectorAll('.v2-ar-slide'));
  }, []);

  const targetScrollFor = useCallback(
    (idx) => {
      const track = trackRef.current;
      const nodes = getSlideNodes();
      if (!track || !nodes[idx]) return 0;
      const el = nodes[idx];
      return Math.max(0, el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2);
    },
    [getSlideNodes]
  );

  const findNearest = useCallback(() => {
    const track = trackRef.current;
    const nodes = getSlideNodes();
    if (!track || !nodes.length) return base;
    const scLeft = track.scrollLeft;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const target = nodes[i].offsetLeft - (track.clientWidth - nodes[i].offsetWidth) / 2;
      const dist = Math.abs(target - scLeft);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }, [base, getSlideNodes]);

  const scrollToSlide = useCallback(
    (idx, smooth = true) => {
      const track = trackRef.current;
      const nodes = getSlideNodes();
      if (!track || !nodes.length) return;
      const clamped = Math.max(0, Math.min(nodes.length - 1, idx));
      holdUntilRef.current = performance.now() + (smooth ? 950 : 120);
      setCurIdx(clamped);
      railRef.current?.style.setProperty('--rail-progress', '0.04');
      if (!smooth) {
        track.classList.add('no-snap');
        track.scrollLeft = targetScrollFor(clamped);
        requestAnimationFrame(() => track.classList.remove('no-snap'));
      } else {
        track.scrollTo({
          left: targetScrollFor(clamped),
          behavior: still ? 'auto' : 'smooth',
        });
      }
    },
    [getSlideNodes, still, targetScrollFor]
  );

  // Silent re-center back into the middle clone band [n, 2n - 1] once scroll settles
  const settleLoop = useCallback(() => {
    const track = trackRef.current;
    const nodes = getSlideNodes();
    if (!track || !nodes.length) return;

    let i = findNearest();
    if (loop && nodes.length >= n * 2 && (i < n || i >= 2 * n)) {
      const delta = i < n ? n : -n;
      const stride = nodes[n].offsetLeft - nodes[0].offsetLeft;
      if (stride > 0) {
        track.classList.add('no-snap');
        track.scrollLeft += Math.sign(delta) * stride;
        requestAnimationFrame(() => track.classList.remove('no-snap'));
        i += delta;
      }
    }

    if (i !== curIdxRef.current) {
      setCurIdx(i);
      railRef.current?.style.setProperty('--rail-progress', '0.04');
    }
  }, [findNearest, getSlideNodes, loop, n]);

  // Initial mount & resize positioning at middle clone `base`
  useEffect(() => {
    setCurIdx(base);
    curIdxRef.current = base;

    const place = () => {
      if (draggingRef.current) return;
      scrollToSlide(curIdxRef.current, false);
    };

    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
    };
  }, [base, n, scrollToSlide]);

  // IntersectionObserver so auto-advance runs when carousel is on screen (like original app.js)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        setVisible(entries.some((e) => e.isIntersecting));
      },
      { threshold: 0.25 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  // Original automatic case rotation (every AUTO_MS = 8000ms) synced with glowing RailIndicator
  useEffect(() => {
    if (still || !visible || n <= 1) return undefined;
    let rafId = 0;
    const startedAt = performance.now();

    const tick = (now) => {
      if (draggingRef.current || document.hidden) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / AUTO_MS);
      if (railRef.current) {
        railRef.current.style.setProperty(
          '--rail-progress',
          Math.max(0.04, progress).toFixed(4)
        );
      }
      if (elapsed >= AUTO_MS) {
        const next = curIdxRef.current + 1;
        // If near the right edge of 3rd clone, re-center silently before advancing
        const track = trackRef.current;
        const nodes = getSlideNodes();
        if (loop && track && nodes.length >= n * 3 && next >= n * 2 + Math.min(2, n - 1)) {
          const stride = nodes[n].offsetLeft - nodes[0].offsetLeft;
          if (stride > 0) {
            track.classList.add('no-snap');
            track.scrollLeft -= stride;
            track.classList.remove('no-snap');
            const shifted = curIdxRef.current - n;
            curIdxRef.current = shifted;
            scrollToSlide(shifted + 1, true);
            return;
          }
        }
        scrollToSlide(next, true);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [curIdx, still, visible, n, loop, getSlideNodes, scrollToSlide]);

  const stepBy = useCallback(
    (delta) => {
      if (n <= 1) return;
      const track = trackRef.current;
      const nodes = getSlideNodes();
      let current = curIdxRef.current;
      // Keep inside middle clone before stepping so infinite steps never hit the edge
      if (loop && track && nodes.length >= n * 2 && (current < n || current >= 2 * n)) {
        const shift = current < n ? n : -n;
        const stride = nodes[n].offsetLeft - nodes[0].offsetLeft;
        if (stride > 0) {
          track.classList.add('no-snap');
          track.scrollLeft += Math.sign(shift) * stride;
          track.classList.remove('no-snap');
          current += shift;
          curIdxRef.current = current;
        }
      }
      scrollToSlide(current + delta, true);
    },
    [getSlideNodes, loop, n, scrollToSlide]
  );

  const onScroll = () => {
    window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(settleLoop, 130);
    if (performance.now() > holdUntilRef.current) {
      const nearest = findNearest();
      if (nearest !== curIdxRef.current) {
        setCurIdx(nearest);
        railRef.current?.style.setProperty('--rail-progress', '0.04');
      }
    }
  };

  useEffect(() => () => window.clearTimeout(idleTimerRef.current), []);

  // Mouse drag support (touch & trackpad horizontal swipe work natively on overflow-x track)
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    holdUntilRef.current = 0;
    draggingRef.current = true;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: track.scrollLeft,
      moved: false,
      startIdx: findNearest(),
    };
  };

  const onMouseMove = (e) => {
    const d = dragStateRef.current;
    if (!d.active) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      track.classList.add('is-dragging');
    }
    if (d.moved) {
      track.scrollLeft = d.startScroll - dx;
    }
  };

  const onMouseUp = (e) => {
    const d = dragStateRef.current;
    if (!d.active) return;
    dragStateRef.current.active = false;
    draggingRef.current = false;
    const track = trackRef.current;
    track?.classList.remove('is-dragging');
    if (d.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      const dx = (e?.clientX ?? d.startX) - d.startX;
      let next = findNearest();
      if (Math.abs(dx) > 40 && next === d.startIdx) {
        next = d.startIdx + (dx < 0 ? 1 : -1);
      }
      scrollToSlide(next, true);
    }
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
      ref={rootRef}
      className="v2-ar-carousel"
      role="region"
      aria-label={t('Галерея AR-эффектов')}
      onMouseLeave={onMouseUp}
    >
      <div
        className="v2-ar-carousel__track"
        ref={trackRef}
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onClickCapture={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {slidesData.map(({ item, origIdx, copy }, renderIdx) => {
          const isActive = renderIdx === curIdx;
          const dist = Math.abs(renderIdx - curIdx);
          const shouldPreload = dist <= PRELOAD_AHEAD;
          return (
            <ArVideoSlide
              key={`${item.id || origIdx}-c${copy}`}
              item={item}
              isActive={isActive}
              shouldPreload={shouldPreload}
              onActivate={() => scrollToSlide(renderIdx, true)}
            />
          );
        })}
      </div>

      <RailIndicator
        total={n}
        activeIndex={realIndex}
        progressRef={railRef}
        still={still}
        onStep={stepBy}
        ariaLabel="Галерея AR-эффектов"
      />
    </div>
  );
}
