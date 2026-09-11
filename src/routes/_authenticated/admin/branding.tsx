import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { LetterMark } from "@/components/LetterMark";
import { PILLARS } from "@/lib/content";
import { BRAND_TEXT_COLOURS } from "@/lib/brand-colours";

export const Route = createFileRoute("/_authenticated/admin/branding")({
  head: () => ({ meta: [{ title: "Brand guidelines — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BrandingPage,
});

/* ---------------- data ---------------- */

const CORE_COLOURS = [
  { token: "paper", light: "#FBF2E4", dark: "#1C140E", name: "Paper", use: "Page background. Warm, never pure white or black." },
  { token: "paper-warm", light: "#F5E8D3", dark: "#26190F", name: "Paper warm", use: "Cards, muted surfaces, secondary buttons." },
  { token: "ink", light: "#2E2118", dark: "#F5E8D3", name: "Ink", use: "Body text and headings." },
  { token: "heart", light: "#A63C33", dark: "#E29A91", name: "Heart", use: "Primary brand red. Buttons, links, focus ring, Tadabbur." },
  { token: "heart-soft", light: "#D98A80", dark: "#B4463D", name: "Heart soft", use: "Selection highlight, Youth tint, gentle accents." },
  { token: "tazkiyah", light: "#4F7F62", dark: "#A8CFB5", name: "Tazkiyah", use: "Brand green. Success, special members, Tazkiyah pillar." },
  { token: "tazkiyah-soft", light: "#B7D4C0", dark: "#3A5A47", name: "Tazkiyah soft", use: "Accent surfaces and soft green tints." },
  { token: "gold", light: "#A47C2D", dark: "#E0B458", name: "Gold", use: "Gold used as text — passes AA on paper." },
  { token: "gold-decorative", light: "#C99A44", dark: "#C99A44", name: "Gold decorative", use: "Ornament only — rosettes, rules, girih detail. Never body text." },
];

const SEMANTIC = [
  { name: "background", maps: "paper" },
  { name: "foreground", maps: "ink" },
  { name: "card", maps: "#FFFFFF (light) / #26190F (dark)" },
  { name: "primary", maps: "heart" },
  { name: "primary-foreground", maps: "#FFF8EE" },
  { name: "secondary / muted", maps: "paper-warm" },
  { name: "accent", maps: "tazkiyah-soft" },
  { name: "muted-foreground", maps: "#6B584A (light) / #C2AE94 (dark)" },
  { name: "border / input", maps: "ink at 12–18% alpha" },
  { name: "ring", maps: "heart" },
];

const PAIRINGS = [
  { label: "Primary action", bg: "var(--heart)", fg: "#FFF8EE", note: "Buttons, key CTAs" },
  { label: "Page default", bg: "var(--paper)", fg: "var(--ink)", note: "All body copy" },
  { label: "Card", bg: "var(--card)", fg: "var(--ink)", note: "Content tiles, panels" },
  { label: "Soft surface", bg: "var(--paper-warm)", fg: "var(--ink)", note: "Secondary buttons, chips" },
  { label: "Accent surface", bg: "var(--tazkiyah-soft)", fg: "#23392C", note: "Success, calm callouts" },
  { label: "Footer / inverse", bg: "var(--ink)", fg: "var(--paper)", note: "Footer, dark bands" },
];

const RADII = [
  { name: "sm", value: "8px" },
  { name: "md", value: "14px" },
  { name: "lg", value: "24px" },
  { name: "xl", value: "32px" },
  { name: "2xl", value: "40px" },
  { name: "pill", value: "999px" },
];

const ASSETS = [
  { path: "/patterns/girih-tile-light.svg", label: "Girih tile — light", use: "Verse of the Week hover fill, page backdrops (5–13% opacity)." },
  { path: "/patterns/girih-tile-dark.svg", label: "Girih tile — dark", use: "Same, for dark mode." },
  { path: "/favicon.ico", label: "Favicon", use: "Browser tab icon." },
];

const VOICE = [
  "Warm, editorial, unhurried — the feeling of the chest expanding.",
  "Never clinical, corporate or therapy-speak. No jargon, no hype.",
  "Sentence case everywhere except the wordmark, which is always lowercase.",
  "Arabic sits beside English as an equal, not as decoration.",
  "Speak to one person, gently. Invite, don't instruct.",
];

const DONTS = [
  "Don't hardcode colours in components — always use the tokens above.",
  "Don't use gold-decorative for text; use gold.",
  "Don't use pure black (#000) or pure white on brand surfaces.",
  "Don't set the wordmark in a font other than Fraunces, and never capitalise it.",
  "Don't stretch, rotate, recolour or outline the logo lockup.",
  "Don't raise the girih pattern above ~15% opacity behind text.",
];

/* ---------------- page ---------------- */

function BrandingPage() {
  return (
    <div className="flex flex-col gap-10 pb-16">
      <header>
        <p className="eyebrow">Brand</p>
        <h1 className="mt-1 font-display text-4xl">Inshirah brand guidelines</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          The single source of truth for colour, type, marks and tone. Everything here matches the live design
          tokens in <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">src/styles.css</code>.
        </p>
      </header>

      {/* Logo */}
      <Section title="Logo & marks" subtitle="The wordmark pairs a lowercase Fraunces setting with the Arabic انشراح.">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel style={{ background: "var(--paper)" }}>
            <Logo />
            <Caption>Primary lockup on paper</Caption>
          </Panel>
          <Panel style={{ background: "var(--ink)" }}>
            <Logo variant="footer" />
            <Caption inverse>Footer lockup on ink</Caption>
          </Panel>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-6">
          <span className="font-arabic text-6xl" style={{ color: "var(--heart)" }} aria-hidden>انشراح</span>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Arabic mark — Amiri Bold</p>
            <p>Heart red on light surfaces, gold on ink. Minimum clear space equal to the height of the alif.</p>
          </div>
        </div>
      </Section>

      {/* Colour */}
      <Section title="Colour" subtitle="Warm, earthy, never neon. Every colour exists as a CSS variable and a Tailwind token.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_COLOURS.map((c) => (
            <div key={c.token} className="overflow-hidden rounded-3xl border border-border bg-card">
              <div className="h-20 w-full" style={{ background: c.light }} />
              <div className="p-4">
                <p className="font-semibold">{c.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">--{c.token}</p>
                <p className="mt-2 font-mono text-xs">
                  <span className="text-muted-foreground">light</span> {c.light} · <span className="text-muted-foreground">dark</span> {c.dark}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{c.use}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-lg font-semibold">Semantic mapping</h3>
        <div className="mt-3 overflow-hidden rounded-3xl border border-border bg-card">
          {SEMANTIC.map((s, i) => (
            <div key={s.name} className={`flex flex-wrap justify-between gap-2 px-5 py-3 text-sm ${i ? "border-t border-border" : ""}`}>
              <span className="font-mono">--{s.name}</span>
              <span className="text-muted-foreground">{s.maps}</span>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-lg font-semibold">Approved text colours</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Member name colours and any admin-set colour must come from this list only.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {BRAND_TEXT_COLOURS.map((c) => (
            <span key={c.value} className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
              <span className="size-4 rounded-full border border-border" style={{ background: `var(--${c.value})` }} />
              <span style={{ color: `var(--${c.value})` }}>{c.label}</span>
              <span className="font-mono text-muted-foreground">{c.hex}</span>
            </span>
          ))}
        </div>
      </Section>

      {/* Pairings */}
      <Section title="Colour pairings" subtitle="Tested combinations that meet WCAG AA for body text.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAIRINGS.map((p) => (
            <div key={p.label} className="rounded-3xl border border-border p-6" style={{ background: p.bg, color: p.fg }}>
              <p className="font-display text-2xl" style={{ color: p.fg }}>Aa</p>
              <p className="mt-2 text-sm font-semibold">{p.label}</p>
              <p className="text-xs opacity-80">{p.note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Type */}
      <Section title="Typography" subtitle="Three families, loaded from Google Fonts in the root document head.">
        <div className="grid gap-4 lg:grid-cols-3">
          <TypeCard
            family="Fraunces"
            role="Display / headings"
            css="--font-display"
            note="Variable: opsz 144, SOFT 60–80, WONK 1. Weight 300–700. Letter-spacing −0.02em."
          >
            <p className="font-display text-4xl">Expansion of the chest</p>
            <p className="font-display text-xl">Aa Bb Cc — 0123456789</p>
          </TypeCard>
          <TypeCard family="Nunito" role="Body / UI" css="--font-sans" note="Weights 400–800. All body copy, buttons, labels, navigation.">
            <p className="text-lg">The heart steadies when it is remembered.</p>
            <p className="text-sm text-muted-foreground">Aa Bb Cc — 0123456789</p>
          </TypeCard>
          <TypeCard family="Amiri" role="Arabic" css="--font-arabic" note="Weight 700. Qur'anic text, the wordmark, letter marks.">
            <p className="font-arabic text-4xl" dir="rtl">بِسْمِ ٱللَّٰهِ</p>
            <p className="font-arabic text-2xl" dir="rtl">انشراح</p>
          </TypeCard>
        </div>

        <h3 className="mt-8 text-lg font-semibold">Font pairings in practice</h3>
        <div className="mt-3 rounded-3xl border border-border bg-card p-6 md:p-8">
          <p className="eyebrow">Eyebrow — Nunito 700, uppercase, tracked</p>
          <h2 className="mt-2 font-display text-3xl">Fraunces heading sits above Nunito body</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Body copy stays in Nunito at a comfortable measure of roughly 65–75 characters. Never set long paragraphs
            in Fraunces, and never set headings in Nunito.
          </p>
          <p className="mt-4 font-arabic text-2xl" style={{ color: "var(--heart)" }} dir="rtl">أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ</p>
          <p className="mt-1 text-xs text-muted-foreground">Amiri for Arabic, always with its English translation nearby.</p>
        </div>
      </Section>

      {/* Pillars */}
      <Section title="Pillars" subtitle="Each pillar carries an Arabic letter mark and a fixed tint.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PILLARS).map(([slug, p]) => (
            <div key={slug} className="rounded-3xl border border-border bg-card p-6">
              <LetterMark letter={p.letter} tint={p.tint as never} size={52} />
              <p className="mt-3 font-display text-2xl">{p.label}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">/{slug} · tint: {p.tint}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Assets */}
      <Section title="Assets" subtitle="Shipped in the repository under /public — safe to use on any deployment.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ASSETS.map((a) => (
            <div key={a.path} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex h-32 items-center justify-center rounded-2xl" style={{ background: "var(--paper-warm)" }}>
                <img src={a.path} alt={a.label} className="max-h-24 max-w-24" />
              </div>
              <p className="mt-3 font-semibold">{a.label}</p>
              <p className="font-mono text-xs text-muted-foreground">{a.path}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.use}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Icons come from <strong>lucide-react</strong> at 1.5px stroke, sized 16–20px inline and 24px standalone.
          Never mix in a second icon set.
        </p>
      </Section>

      {/* Shape & motion */}
      <Section title="Shape, elevation & motion" subtitle="Soft, rounded, unhurried.">
        <div className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div className="size-20 border border-border bg-card" style={{ borderRadius: r.value }} />
              <p className="text-xs text-muted-foreground">radius-{r.name} · {r.value}</p>
            </div>
          ))}
        </div>
        <ul className="mt-6 flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          <li>Shadows are warm and diffuse — tinted with ink or heart, never neutral grey.</li>
          <li>Transitions run 220–400ms with ease; hover lifts are subtle (2–4px).</li>
          <li>Ambient motion (breathing watermark, floating reflections, girih ripple) stays slow and low-amplitude.</li>
          <li>All motion respects <code className="rounded bg-secondary px-1 text-xs">prefers-reduced-motion</code>.</li>
        </ul>
      </Section>

      {/* Buttons */}
      <Section title="Components" subtitle="Core interactive styles.">
        <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-6">
          <button className="btn-primary" type="button">Primary action</button>
          <button className="btn-ghost" type="button">Ghost action</button>
          <span className="eyebrow">Eyebrow label</span>
          <span className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold">Chip</span>
        </div>
      </Section>

      {/* Voice */}
      <Section title="Voice & tone">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
          {VOICE.map((v) => <li key={v}>{v}</li>)}
        </ul>
      </Section>

      <Section title="Don'ts">
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm" style={{ color: "var(--heart)" }}>
          {DONTS.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </Section>
    </div>
  );
}

/* ---------------- bits ---------------- */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-3xl border border-border p-8" style={style}>
      {children}
    </div>
  );
}

function Caption({ children, inverse }: { children: React.ReactNode; inverse?: boolean }) {
  return (
    <p className="text-xs" style={{ color: inverse ? "color-mix(in oklab, var(--paper) 70%, transparent)" : "var(--muted-foreground)" }}>
      {children}
    </p>
  );
}

function TypeCard({
  family, role, css, note, children,
}: { family: string; role: string; css: string; note: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{role}</p>
      <p className="mt-1 font-display text-2xl">{family}</p>
      <p className="font-mono text-xs text-muted-foreground">{css}</p>
      <div className="mt-4 flex flex-col gap-2">{children}</div>
      <p className="mt-4 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
