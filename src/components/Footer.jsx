import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Matter from 'matter-js';
import { useI18n } from '../i18n/I18nContext';
import { useStillMode } from '../hooks/useA11y';
import { EASE_OUT, Reveal } from './Reveal';

const SOCIAL_PUCKS = [
  {
    name: 'Telegram',
    className: 'puck--tg',
    img: './assets/figma/f37b3.webp',
    href: 'https://t.me/lednique',
    natW: 445,
    natH: 251,
    angleDeg: -11.33,
    chamfer: 34,
    // Well-spaced initial center ratios (desktop & mobile)
    deskX: 0.11,
    deskY: 0.28,
    mobX: 0.24,
    mobY: 0.18,
  },
  {
    name: 'Boosty',
    className: 'puck--boosty',
    img: './assets/figma/7f0d3.webp',
    href: 'https://boosty.to/lednique',
    natW: 502,
    natH: 499,
    angleDeg: 8.75,
    chamfer: 64,
    deskX: 0.28,
    deskY: 0.66,
    mobX: 0.30,
    mobY: 0.56,
  },
  {
    name: 'Behance',
    className: 'puck--be',
    img: './assets/figma/3fb4e.webp',
    href: 'https://behance.net/lednique',
    natW: 352,
    natH: 308,
    angleDeg: -4.41,
    chamfer: 28,
    deskX: 0.47,
    deskY: 0.34,
    mobX: 0.72,
    mobY: 0.22,
  },
  {
    name: 'Instagram',
    className: 'puck--ig',
    img: './assets/figma/028e5.webp',
    href: 'https://instagram.com/lednique',
    natW: 324,
    natH: 334,
    angleDeg: 19.41,
    chamfer: 44,
    deskX: 0.64,
    deskY: 0.60,
    mobX: 0.74,
    mobY: 0.54,
  },
  {
    name: 'Threads',
    className: 'puck--thr',
    img: './assets/figma/133c0.webp',
    href: 'https://www.threads.com/@lednique',
    natW: 368,
    natH: 389,
    angleDeg: 5.56,
    chamfer: 32,
    deskX: 0.80,
    deskY: 0.32,
    mobX: 0.28,
    mobY: 0.84,
  },
  {
    name: 'Kwork',
    className: 'puck--kwork',
    img: './assets/figma/6cb70.webp',
    href: 'https://kwork.ru/user/lednique',
    natW: 238,
    natH: 612,
    angleDeg: 59.74,
    chamfer: 10,
    deskX: 0.89,
    deskY: 0.68,
    mobX: 0.74,
    mobY: 0.84,
  },
];

const MAX_THROW_SPEED = 26;
const MAX_DRAG_SPEED = 32;

function usePuckPhysics(containerRef, stageSpaceRef, enabled) {
  const [sizeBucket, setSizeBucket] = useState(0);
  const lastSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const w = rect?.width || el.clientWidth;
      const h = rect?.height || el.clientHeight;
      if (
        w > 40 &&
        h > 40 &&
        (Math.abs(w - lastSizeRef.current.w) > 24 || Math.abs(h - lastSizeRef.current.h) > 24)
      ) {
        lastSizeRef.current = { w, h };
        setSizeBucket((n) => n + 1);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const W = container.clientWidth;
    const H = container.clientHeight;
    if (W < 60 || H < 60) return;
    lastSizeRef.current = { w: W, h: H };

    const isMobile = W <= 640;

    // Measure the lower resting zone under the footer headings so pucks start cleanly
    // below "@lednique" & "не забудьте соус", while physics walls cover the ENTIRE footer.
    const containerRect = container.getBoundingClientRect();
    const stageEl = stageSpaceRef?.current;
    const stageRect = stageEl ? stageEl.getBoundingClientRect() : null;
    const stageTop = stageRect
      ? Math.max(0, stageRect.top - containerRect.top)
      : Math.max(0, H - (isMobile ? 460 : 430));
    const stageH =
      stageRect && stageRect.height > 60 ? stageRect.height : Math.max(60, H - stageTop);

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
      enableSleeping: false,
      positionIterations: 16,
      velocityIterations: 12,
    });

    const wallThick = 200;
    const wallOpts = {
      isStatic: true,
      restitution: 0.74,
      friction: 0.08,
      frictionStatic: 0.1,
      slop: 0.01,
    };
    const walls = [
      Matter.Bodies.rectangle(W / 2, -wallThick / 2, W + wallThick * 2, wallThick, wallOpts),
      Matter.Bodies.rectangle(W / 2, H + wallThick / 2, W + wallThick * 2, wallThick, wallOpts),
      Matter.Bodies.rectangle(-wallThick / 2, H / 2, wallThick, H + wallThick * 2, wallOpts),
      Matter.Bodies.rectangle(W + wallThick / 2, H / 2, wallThick, H + wallThick * 2, wallOpts),
    ];

    const puckEls = Array.from(container.querySelectorAll('.puck'));
    const items = [];

    const getHalfExtents = ({ body, w, h }) => {
      const c = Math.abs(Math.cos(body.angle));
      const s = Math.abs(Math.sin(body.angle));
      return {
        hx: Math.min(W / 2 - 2, (c * w + s * h) / 2),
        hy: Math.min(H / 2 - 2, (s * w + c * h) / 2),
      };
    };

    const clampPoint = (item, x, y) => {
      const { hx, hy } = getHalfExtents(item);
      return {
        x: Math.max(hx, Math.min(W - hx, x)),
        y: Math.max(hy, Math.min(H - hy, y)),
      };
    };

    const clampToStage = (item, x, y) => {
      const { hx, hy } = getHalfExtents(item);
      const minY = stageTop + hy;
      const maxY = Math.min(H - hy, stageTop + stageH - hy);
      return {
        x: Math.max(hx, Math.min(W - hx, x)),
        y: minY <= maxY ? Math.max(minY, Math.min(maxY, y)) : Math.max(hy, Math.min(H - hy, y)),
      };
    };

    const keepInsideWithBounce = (item) => {
      const { body } = item;
      const { hx, hy } = getHalfExtents(item);
      let x = body.position.x;
      let y = body.position.y;
      let vx = body.velocity.x;
      let vy = body.velocity.y;
      let bounced = false;

      if (x < hx) {
        x = hx;
        if (vx < 0) vx = -vx * 0.68;
        bounced = true;
      } else if (x > W - hx) {
        x = W - hx;
        if (vx > 0) vx = -vx * 0.68;
        bounced = true;
      }

      if (y < hy) {
        y = hy;
        if (vy < 0) vy = -vy * 0.68;
        bounced = true;
      } else if (y > H - hy) {
        y = H - hy;
        if (vy > 0) vy = -vy * 0.68;
        bounced = true;
      }

      if (bounced) {
        Matter.Body.setPosition(body, { x, y });
        Matter.Body.setVelocity(body, { x: vx, y: vy });
      }
    };

    puckEls.forEach((el, idx) => {
      const spec = SOCIAL_PUCKS[idx];
      if (!spec) return;

      // Measure real width and derive exact aspect-ratio height so height is NEVER 0!
      const rectW = el.offsetWidth || (isMobile ? 120 : 155);
      const expectedH = Math.round((rectW * spec.natH) / spec.natW);
      const rectH = el.offsetHeight > 20 ? el.offsetHeight : expectedH;

      const angle = (spec.angleDeg * Math.PI) / 180;
      const initX = W * (isMobile ? spec.mobX : spec.deskX);
      const initY = stageTop + stageH * (isMobile ? spec.mobY : spec.deskY);

      const chamferR = Math.min(spec.chamfer, Math.min(rectW, rectH) * 0.42);
      const body = Matter.Bodies.rectangle(initX, initY, rectW, rectH, {
        angle,
        chamfer: chamferR > 2 ? { radius: chamferR } : undefined,
        frictionAir: 0.024,
        friction: 0.12,
        frictionStatic: 0.25,
        restitution: 0.68,
        density: 0.004,
        slop: 0.01,
        label: `social-${idx}`,
      });

      const item = { el, body, w: rectW, h: rectH };
      const clamped = clampToStage(item, initX, initY);
      Matter.Body.setPosition(body, clamped);
      items.push(item);
    });

    // Robust non-overlapping startup separation pass (using rotated AABBs + padding)
    const pad = isMobile ? 6 : 14;
    for (let iter = 0; iter < 60; iter++) {
      let anyOverlap = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          const ea = getHalfExtents(a);
          const eb = getHalfExtents(b);
          const dx = b.body.position.x - a.body.position.x;
          const dy = b.body.position.y - a.body.position.y;
          const ox = ea.hx + eb.hx + pad - Math.abs(dx);
          const oy = ea.hy + eb.hy + pad - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            anyOverlap = true;
            if (ox < oy) {
              const push = ox * 0.52;
              const dir = dx >= 0 ? 1 : -1;
              Matter.Body.setPosition(a.body, { x: a.body.position.x - dir * push, y: a.body.position.y });
              Matter.Body.setPosition(b.body, { x: b.body.position.x + dir * push, y: b.body.position.y });
            } else {
              const push = oy * 0.52;
              const dir = dy >= 0 ? 1 : -1;
              Matter.Body.setPosition(a.body, { x: a.body.position.x, y: a.body.position.y - dir * push });
              Matter.Body.setPosition(b.body, { x: b.body.position.x, y: b.body.position.y + dir * push });
            }
          }
        }
      }
      for (const item of items) {
        const p = clampToStage(item, item.body.position.x, item.body.position.y);
        Matter.Body.setPosition(item.body, p);
      }
      if (!anyOverlap) break;
    }

    Matter.Composite.add(engine.world, [...walls, ...items.map((it) => it.body)]);

    const clampSpeed = (vx, vy, max) => {
      const mag = Math.hypot(vx, vy);
      if (mag <= max) return { x: vx, y: vy };
      const k = max / mag;
      return { x: vx * k, y: vy * k };
    };

    let dragState = null;
    const draggedLinks = new WeakSet();

    const toLocal = (e) => {
      const rect = container.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onPointerDown = (e) => {
      if (e.button !== 0 || !e.isPrimary) return;
      const el = e.target.closest('.puck');
      if (!el) return;
      const item = items.find((it) => it.el === el);
      if (!item) return;

      const pt = toLocal(e);
      draggedLinks.delete(el);
      const now = performance.now();
      dragState = {
        item,
        pointerId: e.pointerId,
        offsetX: item.body.position.x - pt.x,
        offsetY: item.body.position.y - pt.y,
        targetX: item.body.position.x,
        targetY: item.body.position.y,
        startX: pt.x,
        startY: pt.y,
        moved: false,
        samples: [{ x: pt.x, y: pt.y, t: now }],
      };

      Matter.Body.setVelocity(item.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(item.body, 0);
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        // Ignore
      }
      el.classList.add('is-dragging');
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!dragState || e.pointerId !== dragState.pointerId) return;
      const pt = toLocal(e);
      if (Math.hypot(pt.x - dragState.startX, pt.y - dragState.startY) > 6) {
        dragState.moved = true;
        draggedLinks.add(dragState.item.el);
      }
      const clamped = clampPoint(
        dragState.item,
        pt.x + dragState.offsetX,
        pt.y + dragState.offsetY
      );
      dragState.targetX = clamped.x;
      dragState.targetY = clamped.y;

      const now = performance.now();
      dragState.samples.push({ x: pt.x, y: pt.y, t: now });
      // Keep only samples within last 80ms for crisp flick velocity
      while (dragState.samples.length > 2 && now - dragState.samples[0].t > 80) {
        dragState.samples.shift();
      }
      e.preventDefault();
    };

    const releaseDrag = (e) => {
      if (!dragState) return;
      if (e && e.pointerId != null && e.pointerId !== dragState.pointerId) return;

      const { item, moved, samples, pointerId } = dragState;
      if (moved && samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dt = Math.max(last.t - first.t, 12);
        const rawVx = ((last.x - first.x) / dt) * 16.67;
        const rawVy = ((last.y - first.y) / dt) * 16.67;
        const throwVel = clampSpeed(rawVx * 0.85, rawVy * 0.85, MAX_THROW_SPEED);
        Matter.Body.setVelocity(item.body, throwVel);
        Matter.Body.setAngularVelocity(
          item.body,
          Math.max(-0.08, Math.min(0.08, (throwVel.x - throwVel.y) * 0.0025))
        );
      } else {
        Matter.Body.setVelocity(item.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(item.body, 0);
      }

      item.el.classList.remove('is-dragging');
      try {
        if (item.el.hasPointerCapture?.(pointerId)) {
          item.el.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore
      }
      keepInsideWithBounce(item);
      dragState = null;
    };

    const onLostCapture = (e) => {
      if (dragState?.pointerId === e.pointerId) releaseDrag(e);
    };

    const onWindowBlur = () => {
      if (dragState) releaseDrag();
    };

    const onClickCapture = (e) => {
      const el = e.target.closest('.puck');
      if (el && draggedLinks.has(el)) {
        draggedLinks.delete(el);
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', releaseDrag);
    window.addEventListener('pointercancel', releaseDrag);
    window.addEventListener('blur', onWindowBlur);
    for (const item of items) {
      item.el.addEventListener('lostpointercapture', onLostCapture);
    }
    container.addEventListener('click', onClickCapture, true);

    // Prepare DOM positioning so transforms map 1:1 from top-left (0, 0)
    for (const item of items) {
      item.el.style.left = '0px';
      item.el.style.top = '0px';
      item.el.style.transformOrigin = 'center center';
    }

    let rafId = 0;
    let prevTs = performance.now();

    const step = (now) => {
      const dt = Math.min(now - prevTs, 24);
      prevTs = now;

      // Velocity-driven spring follow during drag so dragged puck pushes other pucks naturally
      if (dragState) {
        const { item, targetX, targetY } = dragState;
        const dx = targetX - item.body.position.x;
        const dy = targetY - item.body.position.y;
        const vel = clampSpeed(dx * 0.42, dy * 0.42, MAX_DRAG_SPEED);
        Matter.Body.setVelocity(item.body, vel);
        Matter.Body.setAngularVelocity(item.body, item.body.angularVelocity * 0.8);
      }

      // Two sub-steps per frame for rock-solid zero-tunneling collisions
      Matter.Engine.update(engine, dt * 0.5);
      Matter.Engine.update(engine, dt * 0.5);

      for (const item of items) {
        keepInsideWithBounce(item);
        const { el, body, w, h } = item;
        el.style.transform = `translate3d(${(body.position.x - w / 2).toFixed(2)}px, ${(
          body.position.y -
          h / 2
        ).toFixed(2)}px, 0) rotate(${body.angle.toFixed(4)}rad)`;
      }

      rafId = requestAnimationFrame(step);
    };

    // Only animate while the footer is actually on screen (Matter.js runs two
    // sub-steps per frame; keeping it alive in the background wasted CPU).
    let visible = true;
    let visibilityObserver = null;
    const startLoop = () => {
      if (rafId) return;
      prevTs = performance.now();
      rafId = requestAnimationFrame(step);
    };
    const stopLoop = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    if ('IntersectionObserver' in window) {
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          visible = !!entry?.isIntersecting;
          if (visible) startLoop();
          else stopLoop();
        },
        { rootMargin: '120px' }
      );
      visibilityObserver.observe(container);
    }
    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else if (visible) startLoop();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    startLoop();

    return () => {
      stopLoop();
      visibilityObserver?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseDrag);
      window.removeEventListener('pointercancel', releaseDrag);
      window.removeEventListener('blur', onWindowBlur);
      for (const item of items) {
        item.el.removeEventListener('lostpointercapture', onLostCapture);
      }
      container.removeEventListener('click', onClickCapture, true);
      for (const { el } of items) {
        el.classList.remove('is-dragging');
        el.style.removeProperty('transform');
        el.style.removeProperty('left');
        el.style.removeProperty('top');
        el.style.removeProperty('transform-origin');
      }
    };
  }, [containerRef, stageSpaceRef, enabled, sizeBucket]);
}

export function Footer() {
  const still = useStillMode();
  const { t } = useI18n();
  const pucksRef = useRef(null);
  const stageSpaceRef = useRef(null);

  usePuckPhysics(pucksRef, stageSpaceRef, !still);

  return (
    <footer className={`footer${still ? ' footer--still' : ''}`} id="contact">
      <div className="footer__inner content">
        <div className="footer__top">
          <Reveal as="p" className="footer__handle" stagger={0.06}>
            @lednique
          </Reveal>
          <Reveal as="p" className="footer__role" delay={0.12} stagger={0.04}>
            graphic designer / AI
            <br />/ e-commerce / AR
          </Reveal>
        </div>

        <Reveal as="h2" className="footer__sauce" delay={0.24} stagger={0.055}>
          {t('не забудьте соус')}
        </Reveal>
      </div>

      <div className="footer__stage-space" ref={stageSpaceRef} aria-hidden="true" />

      <motion.div
        className={`footer__pucks${still ? ' footer__pucks--still' : ''}`}
        ref={pucksRef}
        initial={still ? false : { opacity: 0 }}
        animate={still ? { opacity: 1 } : undefined}
        whileInView={still ? undefined : { opacity: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        {SOCIAL_PUCKS.map((puck) => (
          <a
            key={puck.name}
            className={`puck ${puck.className}`}
            href={puck.href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={puck.name}
            style={{ aspectRatio: `${puck.natW} / ${puck.natH}` }}
          >
            <img
              src={puck.img}
              alt={puck.name}
              width={puck.natW}
              height={puck.natH}
              loading="eager"
              decoding="async"
              draggable={false}
            />
          </a>
        ))}
      </motion.div>
    </footer>
  );
}
