import { useEffect, useRef } from 'react';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Restores the original category hero background scroll-zoom (scale 1 -> 3
 * with transform-origin: 50% 32% as the hero scrolls out) plus the Design
 * page interactive fish parallax + mobile pink-fish alignment.
 */
export function useSubHeroMotion() {
  const heroRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const bg = hero.querySelector('[data-bg]');
    const fishNodes = Array.from(hero.querySelectorAll('[data-depth]'));
    const fishes = fishNodes.map((el) => ({
      el,
      d: parseFloat(el.dataset.depth) || 1,
      o: 0,
      w: 0,
      ph: Math.random() * 6.28,
      sp: 0.8 + Math.random() * 0.5,
    }));

    const zoomBg = () => {
      if (!bg) return;
      const r = hero.getBoundingClientRect();
      const h = Math.max(1, r.height);
      const p = clamp(-r.top / h, 0, 1);
      bg.style.transform = `scale(${(1 + 2 * p).toFixed(4)})`;
    };

    const alignMobilePinkFish = () => {
      const layer = hero.querySelector('.sub-design-heroimg__fish-layer');
      const fish = layer?.querySelector('.pfish--1 img');
      const title = hero.querySelector('.sub-hero__title');
      if (!layer || !fish || !title) return;

      if (window.innerWidth > 720) {
        layer.style.removeProperty('--fish-mobile-shift');
        return;
      }
      if (!fish.complete || !fish.naturalHeight) return;

      const prevShift = layer.style.getPropertyValue('--fish-mobile-shift');
      const prevTranslate = fish.parentElement.style.translate;
      const prevRotate = fish.parentElement.style.rotate;

      layer.style.removeProperty('--fish-mobile-shift');
      fish.parentElement.style.translate = 'none';
      fish.parentElement.style.rotate = 'none';

      const fishBox = fish.getBoundingClientRect();
      const titleBox = title.getBoundingClientRect();

      fish.parentElement.style.translate = prevTranslate;
      fish.parentElement.style.rotate = prevRotate;
      if (prevShift) layer.style.setProperty('--fish-mobile-shift', prevShift);

      // group1.svg has transparent top padding (~29.3%); align visible silhouette (+100px downward shift).
      const visibleTop = fishBox.top + fishBox.height * 0.293;
      const targetTop = titleBox.top + 45;
      layer.style.setProperty('--fish-mobile-shift', `${(targetTop - visibleTop).toFixed(2)}px`);
    };

    const pinkFishImg = hero.querySelector('.pfish--1 img');
    const onPinkFishLoad = () => requestAnimationFrame(alignMobilePinkFish);
    if (pinkFishImg) {
      pinkFishImg.addEventListener('load', onPinkFishLoad, { once: true });
    }
    const onResize = () => {
      zoomBg();
      requestAnimationFrame(alignMobilePinkFish);
    };
    window.addEventListener('resize', onResize, { passive: true });
    (document.fonts?.ready || Promise.resolve()).then(() => requestAnimationFrame(alignMobilePinkFish));
    requestAnimationFrame(alignMobilePinkFish);

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    zoomBg();

    if (prefersReduced || fishes.length === 0) {
      const onScroll = () => zoomBg();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        pinkFishImg?.removeEventListener('load', onPinkFishLoad);
      };
    }

    let mx = 0;
    let my = 0;
    let cx = 0;
    let cy = 0;
    let lastY = window.scrollY;
    let energy = 0;
    let pmx = 0;
    let pmy = 0;
    let last = performance.now();
    let raf = 0;

    const onPointerMove = (e) => {
      mx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      my = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const tick = (now) => {
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      const y = window.scrollY;
      const v = clamp(y - lastY, -90, 90);
      lastY = y;

      zoomBg();

      const still = document.body.classList.contains('is-still');
      if (still) {
        fishes.forEach((f) => {
          f.el.style.translate = '0px 0px';
          f.el.style.rotate = '0deg';
        });
      } else {
        cx += (mx - cx) * 0.06 * dt;
        cy += (my - cy) * 0.06 * dt;
        const mv = Math.hypot(cx - pmx, cy - pmy) * 14;
        pmx = cx;
        pmy = cy;
        const sp = Math.abs(v) / 24 + mv;
        energy += (sp - energy) * (sp > energy ? 0.12 : 0.025) * dt;
        energy = clamp(energy, 0, 2.2);

        fishes.forEach((f) => {
          const r = f.el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
          f.w += -v * f.d * 0.32;
          f.w += -f.o * 0.07;
          f.w *= 0.84;
          f.o = clamp(f.o + f.w, -140, 140);
          f.ph += dt * 0.035 * f.sp * (1 + energy * 2.6);
          const rot = Math.sin(f.ph) * (1.4 + energy * 6) + cx * f.d * 2;
          const sx = Math.sin(f.ph * 0.8 + 1.3) * (3 + energy * 9);
          const sy = Math.cos(f.ph * 1.1) * (2 + energy * 6);
          f.el.style.translate = `${(cx * f.d * 46 + sx).toFixed(2)}px ${(cy * f.d * 28 + f.o + sy).toFixed(2)}px`;
          f.el.style.rotate = `${rot.toFixed(2)}deg`;
        });
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      pinkFishImg?.removeEventListener('load', onPinkFishLoad);
    };
  }, []);

  return heroRef;
}
