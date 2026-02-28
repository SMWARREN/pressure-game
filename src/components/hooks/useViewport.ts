import { useState, useEffect } from 'react';

/**
 * Hook that tracks viewport size and updates on resize/orientation change
 */
export function useViewport() {
  const [size, setSize] = useState({ w: globalThis.innerWidth, h: globalThis.innerHeight });
  useEffect(() => {
    const update = () => setSize({ w: globalThis.innerWidth, h: globalThis.innerHeight });
    globalThis.addEventListener('resize', update);
    globalThis.addEventListener('orientationchange', update);
    return () => {
      globalThis.removeEventListener('resize', update);
      globalThis.removeEventListener('orientationchange', update);
    };
  }, []);
  return size;
}
