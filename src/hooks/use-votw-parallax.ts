import { useEffect, useRef } from "react";

/**
 * Parallax helper for the Verse of the Week page background.
 * Returns a ref to attach to the page container; as the user scrolls, the fixed
 * girih pattern is shifted by a fraction of the scroll distance so it feels
 * deep and far away.
 */
export function useVotwParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    console.log("[parallax] effect", ref.current);
    const page = ref.current;
    if (!page) return;

    let raf = 0;
    let lastScroll = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      if (y !== lastScroll) {
        page.style.setProperty("--votw-scroll", `${y}px`);
        lastScroll = y;
      }
      raf = requestAnimationFrame(update);
    };

    page.style.setProperty("--votw-scroll", `${lastScroll}px`);
    raf = requestAnimationFrame(update);

    return () => cancelAnimationFrame(raf);
  }, []);

  return ref;
}
