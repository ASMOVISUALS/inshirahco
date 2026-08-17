import { useEffect } from "react";

/**
 * Parallax helper for .verse-page.
 * As the page scrolls, the fixed girih background is shifted by a fraction of
 * the scroll distance so the pattern feels deep and far away.
 */
export function useVotwParallax() {
  useEffect(() => {
    console.log("[parallax] hook mounted");
    const page = document.querySelector<HTMLElement>(".verse-page");
    if (!page) {
      console.log("[parallax] no page found");
      return;
    }
    console.log("[parallax] page found", page);

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
}
