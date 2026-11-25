import React from 'react';
import { motion } from 'framer-motion';
import { useStillMode } from '../hooks/useA11y';

export const EASE_OUT = [0.22, 1, 0.36, 1];

export function Reveal({ children, className, as = 'p', delay = 0, stagger = 0, ...rest }) {
  const still = useStillMode();
  const Tag = motion[as] || motion.p;
  const d = delay || stagger;

  return (
    <Tag
      className={className}
      data-reveal="1"
      data-paragraph-reveal="1"
      initial={still ? false : { opacity: 0, y: 24 }}
      animate={still ? { opacity: 1, y: 0 } : undefined}
      whileInView={still ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: still ? 0 : 0.65, delay: still ? 0 : d, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
