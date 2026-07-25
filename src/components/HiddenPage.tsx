import { Link } from "@tanstack/react-router";

/**
 * Placeholder shown when an admin has locked a page.
 * Warm paper background, layered Arabic geometry, Fraunces title.
 */
export function HiddenPage({ title }: { title?: string }) {
  return (
    <div className="relative isolate min-h-[calc(100svh-72px)] overflow-hidden">
      {/* Layered Arabic geometric pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, color-mix(in oklab, var(--heart) 55%, transparent) 0, transparent 42%),
            radial-gradient(circle at 82% 68%, color-mix(in oklab, var(--gold) 45%, transparent) 0, transparent 45%),
            url("data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>
                <g fill='none' stroke='#B4463D' stroke-width='0.9' opacity='0.9'>
                  <circle cx='80' cy='80' r='40'/>
                  <circle cx='80' cy='80' r='28' stroke='#D4AF37'/>
                  <polygon points='80,32 116,64 116,96 80,128 44,96 44,64' />
                  <polygon points='80,44 106,68 106,92 80,116 54,92 54,68' stroke='#D4AF37'/>
                  <polygon points='80,56 96,72 96,88 80,104 64,88 64,72'/>
                  <path d='M0 80 L160 80 M80 0 L80 160 M20 20 L140 140 M140 20 L20 140' stroke-opacity='0.35'/>
                </g>
              </svg>`,
            )}")
          `,
          backgroundRepeat: "no-repeat, no-repeat, repeat",
          backgroundSize: "auto, auto, 200px 200px",
          backgroundPosition: "center, center, center",
        }}
      />

      {/* Breathing Arabic watermark */}
      <span
        aria-hidden
        className="watermark-breathe pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-arabic text-[24vw] leading-none"
        style={{ color: "color-mix(in oklab, var(--heart) 12%, transparent)" }}
        dir="rtl"
      >
        سِرّ
      </span>

      <div className="container-wide relative z-10 flex min-h-[calc(100svh-72px)] flex-col items-center justify-center py-24 text-center">
        <p className="eyebrow mb-6" style={{ color: "var(--heart)" }}>
          {title ? title : "A quiet moment"}
        </p>
        <h1
          className="mx-auto max-w-3xl text-6xl leading-[1.02] md:text-8xl"
          style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1', color: "var(--ink)" }}
        >
          This page is hidden.
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
          Come back soon — but feel free to explore other pages below.
        </p>

        <nav aria-label="Explore" className="mt-12 flex flex-wrap items-center justify-center gap-2">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About" },
            { to: "/resources", label: "Resources" },
            { to: "/life-architecture", label: "Life Architecture" },
            { to: "/contact", label: "Contact" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full border border-border bg-card/70 px-5 py-2 text-sm backdrop-blur transition-colors hover:border-heart hover:text-heart"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p
          className="mt-10 font-arabic text-2xl"
          dir="rtl"
          style={{ color: "color-mix(in oklab, var(--heart) 70%, transparent)" }}
        >
          إن مع العسر يسرا
        </p>
      </div>
    </div>
  );
}
