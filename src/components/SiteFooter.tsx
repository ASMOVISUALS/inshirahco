import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Twitter } from "lucide-react";
import { Logo } from "./Logo";
import { NewsletterSignup } from "./NewsletterSignup";
import { PILLARS } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="mt-24" style={{ background: "color-mix(in oklab, var(--ink) 95%, black)", color: "var(--paper)" }}>
      <div className="container-wide py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl" style={{ color: "var(--paper)", fontVariationSettings: '"SOFT" 80, "WONK" 1' }}>inshirah</span>
              <span className="font-arabic text-3xl" style={{ color: "var(--gold-decorative)" }}>انشراح</span>
            </div>
            <p className="mt-4 max-w-md text-[1.05rem] leading-relaxed" style={{ color: "color-mix(in oklab, var(--paper) 78%, transparent)" }}>
              Islamic psychology, for the world of good. A quiet corner for reflection, tazkiyah, and the slow work of the heart.
            </p>

            <div className="mt-8 flex items-center gap-2">
              {[Instagram, Youtube, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="grid h-11 w-11 place-items-center rounded-full border transition-colors hover:bg-white/10"
                  style={{ borderColor: "color-mix(in oklab, var(--paper) 25%, transparent)" }}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.6} style={{ color: "var(--paper)" }} />
                </a>
              ))}
            </div>
          </div>

          <NewsletterSignup
            variant="dark"
            heading="A gentle letter, now and then"
            description="Slow writing, occasional resources, and the reflection of the week — sent when it's ready, never on a schedule."
            cta="Subscribe"
          />
        </div>

        <div className="mt-16 grid gap-8 border-t pt-10 md:grid-cols-4" style={{ borderColor: "color-mix(in oklab, var(--paper) 15%, transparent)" }}>
          <FooterCol title="Read">
            {Object.values(PILLARS).map((p) => (
              <FooterLink key={p.href} to={p.href}>{p.label}</FooterLink>
            ))}
          </FooterCol>
          <FooterCol title="Resources">
            <FooterLink to="/resources">All resources</FooterLink>
            <FooterLink to="/saved">Your saved</FooterLink>
          </FooterCol>
          <FooterCol title="Inshirah">
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact & support</FooterLink>
            <FooterLink to="/life-architecture">Life Architecture</FooterLink>
          </FooterCol>
          <FooterCol title="Small print">
            <p className="text-sm" style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}>
              © {new Date().getFullYear()} Inshirah. A passion project, offered freely.
            </p>
            <p className="mt-2 text-sm" style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}>
              inshirah.co
            </p>
          </FooterCol>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-widest" style={{ color: "var(--gold-decorative)", fontFamily: "var(--font-sans)", letterSpacing: "0.16em" }}>
        {title}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {children}
      </ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="text-[0.95rem] transition-colors hover:text-white" style={{ color: "color-mix(in oklab, var(--paper) 78%, transparent)" }}>
        {children}
      </Link>
    </li>
  );
}

// Suppress the unused Logo import warning if bundler is strict
void Logo;
