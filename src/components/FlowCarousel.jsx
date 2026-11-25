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
}) {
  const { resolveUrl } = useCms();
  const { t } = useI18n();
  const still = useStillMode();

  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const railRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);

  // Triple the items for seamless infinite looping (matching original initFlow)
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
    vx: 0, // momentum velocity (px / ms) after touch/pointer swipe
    offsets: [],
    widths: [],
    stride: 0,
    initialized: false,
    onScreen: true,
    drag: null,
    anim: null,
    activeIdx: 0,
  });

  const wrapX = useCallback(
    (st) => {
      const n = items.length;
      if (!st.stride || st.offsets.length < n * 2) return 0;
      const minX = st.offsets[n] - st.stride * 0.5;
      const maxX = st.offsets[n] + st.stride * 1.5;
      if (st.x >= maxX) {
        st.x -= st.stride;
        return -st.stride;
      }
      if (st.x < minX) {
        st.x += st.stride;
        return st.stride;
      }
      return 0;
    },
    [items.length]
  );

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
    stateRef.current.vx = 0;
    setActiveIndex(0);
    measure();

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(viewport);
    ro?.observe(track);
    window.addEventListener('resize', measure);

    // Trackpad horizontal two-finger swipe & Shift+wheel scrolling
    const onWheel = (e) => {
      const st = stateRef.current;
      if (!st.stride) return;
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const isHorizontal = absX > absY && absX > 1;
      const isShiftScroll = e.shiftKey && absY > 1;
      if (!isHorizontal && !isShiftScroll) return;

      e.preventDefault();
      st.anim = null;
      st.vx = 0;
      const delta = isHorizontal ? e.deltaX : e.deltaY;
      st.x += delta;
      wrapX(st);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });

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
      viewport.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', measure);
    };
  }, [measure, items, wrapX]);

  // Continuous smooth 60fps flow (NEVER pauses on hover!) + momentum decay + rail sync
  useEffect(() => {
    if (!loopEnabled) return;
    let rafId = 0;
    let lastTs = 0;

    const syncProgress = (st) => {
      const n = items.length;
      if (!st.stride || st.offsets.length < n * 2) return;
      const baseStart = st.offsets[n];
      let rel = (st.x - baseStart) % st.stride;
      if (rel < 0) rel += st.stride;

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
        } else if (!st.drag) {
          if (Math.abs(st.vx) > 0.02) {
            st.x += st.vx * dt;
            st.vx *= Math.pow(0.92, dt / 16);
            if (Math.abs(st.vx) <= 0.02) st.vx = 0;
            wrapX(st);
          } else if (!still && st.onScreen && !document.hidden) {
            st.x += (FLOW_SPEED_PX_PER_SEC * dt) / 1000;
            wrapX(st);
          }
        }

        track.style.transform = `translate3d(${(-st.x).toFixed(2)}px, 0, 0)`;
        syncProgress(st);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [items.length, loopEnabled, still, wrapX]);

  // Homepage-style slider step: delta = -1 (left half) or +1 (right half)
  const stepBy = useCallback(
    (delta) => {
      const st = stateRef.current;
      const n = items.length;
      if (!n || !st.offsets.length) return;

      st.vx = 0;
      const baseIdx = st.anim ? st.anim.targetIdx : st.activeIdx;
      const targetIdx = ((baseIdx + delta) % n + n) % n;

      if (!loopEnabled) {
        setActiveIndex(targetIdx);
        return;
      }

      const refX = st.anim ? st.anim.x1 : st.x;
      const candidates = [targetIdx, n + targetIdx, 2 * n + targetIdx]
        .map((i) => st.offsets[i])
        .filter((v) => typeof v === 'number');

      let bestTarget = null;
      if (delta > 0) {
        // Pick the nearest candidate strictly to the RIGHT of current position
        const ahead = candidates.filter((c) => c > refX + 8).sort((a, b) => a - b);
        bestTarget = ahead[0];
      } else {
        // Pick the nearest candidate strictly to the LEFT of current position
        const behind = candidates.filter((c) => c < refX - 8).sort((a, b) => b - a);
        bestTarget = behind[0];
      }

      if (bestTarget == null) {
        // Fallback: closest copy
        bestTarget = candidates.reduce((best, c) =>
          Math.abs(c - refX) < Math.abs(best - refX) ? c : best
        );
      }

      st.anim = {
        x0: st.x,
        x1: bestTarget,
        targetIdx,
        t0: performance.now(),
        dur: 480,
      };
      st.activeIdx = targetIdx;
      setActiveIndex(targetIdx);
    },
    [items.length, loopEnabled]
  );

  // Touch swipe & mouse drag with smooth inertia
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const st = stateRef.current;
    st.anim = null;
    st.vx = 0;
    st.drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTs: performance.now(),
      startPos: st.x,
      vx: 0,
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
        st.drag = null;
        viewportRef.current?.classList.remove('is-dragging');
        return;
      }
      if (Math.abs(dx) > 5) {
        st.drag.lockedHorizontal = true;
        try {
          viewportRef.current?.setPointerCapture?.(e.pointerId);
        } catch {
          // ignore
        }
      }
    }
    if (st.drag.lockedHorizontal) {
      const now = performance.now();
      const dt = Math.max(1, now - st.drag.lastTs);
      const stepDx = e.clientX - st.drag.lastX;
      // Exponentially smoothed velocity (px / ms), positive = moving forward (right-to-left swipe)
      const instV = -stepDx / dt;
      st.drag.vx = st.drag.vx * 0.55 + instV * 0.45;
      st.drag.lastX = e.clientX;
      st.drag.lastTs = now;

      st.x = st.drag.startPos - dx;
      const shift = wrapX(st);
      if (shift) {
        st.drag.startPos += shift;
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
    // Apply swipe momentum if released shortly after motion
    const fresh = performance.now() - st.drag.lastTs < 90;
    if (st.drag.lockedHorizontal && fresh && Math.abs(st.drag.vx) > 0.08) {
      st.vx = Math.max(-2.6, Math.min(2.6, st.drag.vx));
    }
    st.drag = null;
    viewportRef.current?.classList.remove('is-dragging');
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
                <figure className="v2-flow__card">
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
                </figure>
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
        onStep={stepBy}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}
