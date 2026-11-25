import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCms } from '../data/CmsContext';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { RailIndicator } from './RailIndicator';

const FLOW_SPEED_PX_PER_SEC = 40;

export function FlowCarousel({
  items = [],
  variant = 'card', // 'card' | 'wide' | 'photo'
  ariaLabel = 'Галерея работ',
  onSelect,
}) {
  const { resolveUrl } = useCms();
  const { t } = useI18n();
  const still = useStillMode();

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const railRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);

  // Triple the items for seamless infinite looping (matching old portfolio initFlow)
  const loopEnabled = items.length > 1;
  const renderedItems = useMemo(() => {
    if (!loopEnabled) return items.map((item, idx) => ({ item, origIdx: idx, copy: 1 }));
    return [
      ...items.map((item, idx) => ({ item, origIdx: idx, copy: 0 })),
      ...items.map((item, idx) => ({ item, origIdx: idx, copy: 1 })),
      ...items.map((item, idx) => ({ item, origIdx: idx, copy: 2 })),
    ];
  }, [items, loopEnabled]);

  // Mutable animation state kept in refs for silky 60fps without React re-renders
  const stateRef = useRef({
    x: 0,
    offsets: [],
    widths: [],
    stride: 0,
    initialized: false,
    onScreen: true,
    hovered: false,
    drag: null,
    anim: null,
    moved: false,
    activeIdx: 0,
  });

  const measure = useCallback(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;
    const slides = Array.from(track.querySelectorAll('.v2-flow__slide'));
    if (!slides.length) return;

    const st = stateRef.current;
    const n = items.length;
    const vw = viewport.clientWidth;

    st.offsets = slides.map((el) => el.offsetLeft - (vw - el.offsetWidth) / 2);
    st.widths = slides.map((el) => el.offsetWidth);

    if (loopEnabled && slides.length >= n * 2) {
      const s = slides[n].offsetLeft - slides[0].offsetLeft;
      if (s > 0) {
        st.stride = s;
        if (!st.initialized) {
          st.x = st.offsets[n] ?? 0;
          st.initialized = true;
          track.style.transform = `translate3d(${(-st.x).toFixed(2)}px, 0, 0)`;
        }
      }
    } else if (!st.initialized) {
      st.x = st.offsets[0] ?? 0;
      st.initialized = true;
      track.style.transform = `translate3d(${(-st.x).toFixed(2)}px, 0, 0)`;
    }
  }, [items.length, loopEnabled]);

  useEffect(() => {
    stateRef.current.initialized = false;
    stateRef.current.activeIdx = 0;
    setActiveIndex(0);
    measure();

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(viewport);
    ro?.observe(track);
    window.addEventListener('resize', measure);

    // Intersection observer so offscreen carousels pause CPU work
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          stateRef.current.onScreen = entries.some((e) => e.isIntersecting);
        },
        { rootMargin: '120px' }
      );
      io.observe(viewport);
    }

    return () => {
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, items]);

  // Continuous smooth 60fps flow + live glowing progress rail sync
  useEffect(() => {
    if (!loopEnabled) return;
    let rafId = 0;
    let lastTs = 0;

    const wrapX = (st) => {
      const n = items.length;
      if (!st.stride || st.offsets.length < n * 2) return;
      const minX = st.offsets[n] - st.stride * 0.5;
      const maxX = st.offsets[n] + st.stride * 1.5;
      if (st.x >= maxX) st.x -= st.stride;
      else if (st.x < minX) st.x += st.stride;
    };

    const syncProgress = (st) => {
      const n = items.length;
      if (!st.stride || st.offsets.length < n * 2) return;
      const baseStart = st.offsets[n];
      let rel = (st.x - baseStart) % st.stride;
      if (rel < 0) rel += st.stride;

      // Find which slide interval [start_i, start_{i+1}) rel falls into
      let curIdx = 0;
      let segProgress = 0;
      for (let i = 0; i < n; i++) {
        const s0 = st.offsets[n + i] - baseStart;
        const s1 = i + 1 < n ? st.offsets[n + i + 1] - baseStart : st.stride;
        if (rel >= s0 && rel < s1) {
          curIdx = i;
          segProgress = s1 > s0 ? (rel - s0) / (s1 - s0) : 0;
          break;
        }
      }

      if (curIdx !== st.activeIdx) {
        st.activeIdx = curIdx;
        setActiveIndex(curIdx);
      }

      if (railRef.current) {
        railRef.current.style.setProperty(
          '--rail-progress',
          still ? '1' : Math.max(0.04, Math.min(1, segProgress)).toFixed(4)
        );
      }
    };

    const tick = (ts) => {
      const dt = Math.min(64, lastTs ? ts - lastTs : 16);
      lastTs = ts;

      const st = stateRef.current;
      const track = trackRef.current;
      if (track && st.stride > 0) {
        if (st.anim) {
          const k = Math.min(1, (ts - st.anim.t0) / st.anim.dur);
          const ease = 1 - Math.pow(1 - k, 3);
          st.x = st.anim.x0 + (st.anim.x1 - st.anim.x0) * ease;
          if (k >= 1) {
            st.anim = null;
            wrapX(st);
          }
        } else if (!st.drag && !st.hovered && !still && st.onScreen && !document.hidden) {
          st.x += (FLOW_SPEED_PX_PER_SEC * dt) / 1000;
          wrapX(st);
        }

        track.style.transform = `translate3d(${(-st.x).toFixed(2)}px, 0, 0)`;
        syncProgress(st);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [items.length, loopEnabled, still]);

  const scrollToIndex = useCallback(
    (targetIdx) => {
      const st = stateRef.current;
      const n = items.length;
      if (!n || !st.offsets.length) return;
      const clamped = ((targetIdx % n) + n) % n;

      if (!loopEnabled) {
        setActiveIndex(clamped);
        return;
      }

      // Pick the closest copy of targetIdx relative to current st.x
      const candidates = [clamped, n + clamped, 2 * n + clamped]
        .map((i) => st.offsets[i])
        .filter((v) => typeof v === 'number');

      let bestTarget = candidates[0] ?? st.x;
      let bestDist = Infinity;
      for (const c of candidates) {
        const d = Math.abs(c - st.x);
        if (d < bestDist) {
          bestDist = d;
          bestTarget = c;
        }
      }

      st.anim = {
        x0: st.x,
        x1: bestTarget,
        t0: performance.now(),
        dur: 520,
      };
      st.activeIdx = clamped;
      setActiveIndex(clamped);
    },
    [items.length, loopEnabled]
  );

  // Pointer drag (desktop mouse + touch swipe)
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const st = stateRef.current;
    st.anim = null;
    st.moved = false;
    st.drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPos: st.x,
      lockedHorizontal: false,
    };
    viewportRef.current?.classList.add('is-dragging');
  };

  const onPointerMove = (e) => {
    const st = stateRef.current;
    if (!st.drag || st.drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.drag.startX;
    const dy = e.clientY - st.drag.startY;
    if (!st.drag.lockedHorizontal) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
        // User is scrolling vertically on touch device — release horizontal drag
        st.drag = null;
        viewportRef.current?.classList.remove('is-dragging');
        return;
      }
      if (Math.abs(dx) > 6) {
        st.drag.lockedHorizontal = true;
        st.moved = true;
        try {
          viewportRef.current?.setPointerCapture?.(e.pointerId);
        } catch {
          // ignore
        }
      }
    }
    if (st.drag.lockedHorizontal) {
      st.x = st.drag.startPos - dx;
      if (st.stride > 0) {
        const n = items.length;
        const minX = st.offsets[n] - st.stride * 0.5;
        const maxX = st.offsets[n] + st.stride * 1.5;
        if (st.x >= maxX) {
          st.x -= st.stride;
          st.drag.startPos -= st.stride;
        } else if (st.x < minX) {
          st.x += st.stride;
          st.drag.startPos += st.stride;
        }
      }
    }
  };

  const onPointerUp = (e) => {
    const st = stateRef.current;
    if (!st.drag || st.drag.pointerId !== e.pointerId) return;
    try {
      if (viewportRef.current?.hasPointerCapture?.(e.pointerId)) {
        viewportRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    st.drag = null;
    viewportRef.current?.classList.remove('is-dragging');
    window.setTimeout(() => {
      st.moved = false;
    }, 40);
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
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') stateRef.current.hovered = true;
      }}
      onPointerLeave={() => {
        stateRef.current.hovered = false;
      }}
    >
      <div
        className="v2-flow__viewport"
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="v2-flow__track" ref={trackRef}>
          {renderedItems.map(({ item, origIdx, copy }) => {
            const src = resolveUrl(item.src);
            const label = item.alt ? t(item.alt) : '';
            const isClone = copy !== 1;
            return (
              <div
                key={`${copy}-${item.id || item.src}-${origIdx}`}
                className="v2-flow__slide"
                aria-hidden={isClone ? 'true' : undefined}
              >
                <button
                  type="button"
                  tabIndex={isClone ? -1 : 0}
                  className="v2-flow__card"
                  onClick={() => {
                    if (stateRef.current.moved) return;
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
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      onLoad={measure}
                    />
                  ) : (
                    <div className="v2-flow__placeholder" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <RailIndicator
        total={items.length}
        activeIndex={activeIndex}
        progressRef={railRef}
        still={still}
        onSelect={scrollToIndex}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
