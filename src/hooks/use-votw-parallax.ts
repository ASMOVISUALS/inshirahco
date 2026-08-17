import { useEffect, useState } from "react";

/**
 * Parallax helper for the Verse of the Week page background.
 * Returns a callback ref to attach to the page container. Once the element is
 * mounted, the fixed girih pattern is shifted by a fraction of the scroll
 * distance as the user scrolls, giving it a slow, far-away depth effect.
 */
export function useVotwParallax<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (!node) return;

    let raf = 0;
    let lastScroll = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      if (y !== lastScroll) {
        node.style.setProperty("--votw-scroll", `${y}px`);
        lastScroll = y;
      }
      raf = requestAnimationFrame(update);
    };

    node.style.setProperty("--votw-scroll", `${lastScroll}px`);
    raf = requestAnimationFrame(update);

    return () => cancelAnimationFrame(raf);
  }, [node]);

  return setNode;
}
