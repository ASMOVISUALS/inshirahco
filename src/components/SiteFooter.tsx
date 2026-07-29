import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Youtube, Twitter } from "lucide-react";
import { Logo } from "./Logo";
import { NewsletterSignup } from "./NewsletterSignup";
import { usePillars } from "@/hooks/use-cms";
import { siteSettingQuery } from "@/lib/queries";

const ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
};

interface SocialLink { label: string; href: string; icon: string }

export function SiteFooter() {
  const pillars = usePillars();
  const { data: footer = {} } = useQuery(siteSettingQuery("footer"));

  const tagline = (footer.tagline as string) ?? "Islamic psychology, for the world of good.";
  const copyright = (footer.copyright as string) ?? "A passion project, offered freely.";
  const domain = (footer.domain as string) ?? "inshirah.co";
  const newsletterHeading = (footer.newsletter_heading as string) ?? "A gentle letter, now and then";
  const newsletterDescription = (footer.newsletter_description as string) ?? "";
  const newsletterCta = (footer.newsletter_cta as string) ?? "Subscribe";
  const socials = (Array.isArray(footer.social) ? footer.social : []) as SocialLink[];

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
              {tagline}
            </p>

            <div className="mt-8 flex items-center gap-2">
              {socials.map((s, i) => {
                const Icon = ICONS[s.icon?.toLowerCase()] ?? Instagram;
                return (
                  <a
                    key={i}
                    href={s.href || "#"}
                    aria-label={s.label || "Social link"}
                    className="grid h-11 w-11 place-items-center rounded-full border transition-colors hover:bg-white/10"
                    style={{ borderColor: "color-mix(in oklab, var(--paper) 25%, transparent)" }}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.6} style={{ color: "var(--paper)" }} />
                  </a>
                );
              })}
            </div>
          </div>

          <NewsletterSignup
            variant="dark"
            heading={newsletterHeading}
            description={newsletterDescription}
            cta={newsletterCta}
          />
        </div>

        <div className="mt-16 grid gap-8 border-t pt-10 md:grid-cols-4" style={{ borderColor: "color-mix(in oklab, var(--paper) 15%, transparent)" }}>
          <FooterCol title="Read">
            {pillars.map((p) => (
              <FooterLink key={p.slug} to={p.href}>{p.label}</FooterLink>
            ))}
          </FooterCol>
          <FooterCol title="Library">
            <FooterLink to="/saved">Your saved</FooterLink>
          </FooterCol>
          <FooterCol title="Inshirah">
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact & support</FooterLink>
            <FooterLink to="/suhbah">Suhbah</FooterLink>
          </FooterCol>
          <FooterCol title="Small print">
            <p className="text-sm" style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}>
              © {new Date().getFullYear()} Inshirah. {copyright}
            </p>
            <p className="mt-2 text-sm" style={{ color: "color-mix(in oklab, var(--paper) 60%, transparent)" }}>
              {domain}
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

void Logo;
