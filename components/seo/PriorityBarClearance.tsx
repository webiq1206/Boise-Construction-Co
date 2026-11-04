'use client';

import { useEffect } from 'react';

/** Keep the existing bar's clearance accurate when enlarged labels wrap. */
export function PriorityBarClearance() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('[data-family-bar]');
    const spacer = document.querySelector<HTMLElement>('.fam-bar-spacer');
    if (!bar || !spacer || typeof ResizeObserver === 'undefined') return;
    const originalHeight = spacer.style.height;
    const root = document.documentElement;
    const originalClearance = root.style.getPropertyValue('--priority-bar-clearance');
    const update = () => {
      const height = `${bar.getBoundingClientRect().height}px`;
      spacer.style.height = height;
      root.style.setProperty('--priority-bar-clearance', height);
    };
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    update();
    return () => {
      observer.disconnect();
      spacer.style.height = originalHeight;
      if (originalClearance) root.style.setProperty('--priority-bar-clearance', originalClearance);
      else root.style.removeProperty('--priority-bar-clearance');
    };
  }, []);
  return null;
}
