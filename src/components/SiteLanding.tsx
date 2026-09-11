import { useState } from "react";
import { LetterMark } from "@/components/LetterMark";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { AdminSignInDialog } from "@/components/AdminSignInDialog";
import type { SiteModeSettings } from "@/lib/site-mode";

const DEFAULTS = {
  coming_soon: {
    eyebrow: "Coming soon",
    headline: "An expansion of the chest.",
    message:
      "Inshirah is being written, quietly. Slow reflections on the Qur'an, tazkiyah, and the long work of the heart — arriving soon.",
  },
  maintenance: {
    eyebrow: "Maintenance",
    headline: "We'll be back shortly.",
    message: "Inshirah is resting for a moment while we tend to a few things. Please come back soon, inshaAllah.",
  },
} as const;

export function SiteLanding({ settings }: { settings: SiteModeSettings }) {
  const [adminOpen, setAdminOpen] = useState(false);
  const mode = settings.mode === "maintenance" ? "maintenance" : "coming_soon";
  const d = DEFAULTS[mode];
  const headline = settings.headline?.trim() || d.headline;
  const message = settings.message?.trim() || d.message;
  const showNewsletter = mode === "coming_soon" && settings.newsletter;

  return (
    <section className="verse-page hero-radial girih-backdrop relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <LetterMark letter="ش" tint={mode === "maintenance" ? "gold" : "heart"} size={72} />
      <p className="eyebrow mt-8">{d.eyebrow}</p>
      <h1 className="mt-4 max-w-3xl font-display text-[2.75rem] leading-[1.05] tracking-tight md:text-[4.5rem]">
        {headline}
      </h1>
      <p className="mt-6 max-w-xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">{message}</p>

      {showNewsletter ? (
        <div className="mt-12 w-full max-w-2xl text-left">
          <NewsletterSignup
            heading="Be there when it opens"
            description="Leave your email and we'll write to you the day Inshirah goes live."
            cta="Keep me posted"
            source="coming-soon"
          />
        </div>
      ) : null}

      {settings.note?.trim() ? (
        <p className="mt-10 text-sm text-muted-foreground/80">{settings.note.trim()}</p>
      ) : null}

      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          onClick={() => setAdminOpen(true)}
          className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground/70 transition-colors hover:border-heart hover:text-heart"
        >
          Admin
        </button>
      </div>
      <AdminSignInDialog open={adminOpen} onOpenChange={setAdminOpen} />
    </section>
  );
}
