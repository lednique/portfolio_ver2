import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function useA11yMode() {
  const [a11y, setA11y] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.a11y === 'true'
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setA11y(root.dataset.a11y === 'true');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['data-a11y'] });
    return () => obs.disconnect();
  }, []);

  return a11y;
}

export function useStillMode() {
  const reduced = useReducedMotion();
  const a11y = useA11yMode();
  return Boolean(reduced) || a11y;
}
