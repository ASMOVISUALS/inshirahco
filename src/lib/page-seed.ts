import { newBlock, type Block } from "@/lib/page-blocks";

/**
 * Given a page key and its current legacy `content` JSON,
 * return a default block set that mirrors the current hardcoded layout.
 * Used to pre-populate the visual builder for existing pages so users
 * can edit them without starting from a blank canvas.
 */
export function seedBlocksFor(key: string, content: Record<string, unknown>): Block[] {
  const s = (k: string, f = "") => (typeof content[k] === "string" ? (content[k] as string) : f);
  const arr = <T,>(k: string): T[] => (Array.isArray(content[k]) ? (content[k] as T[]) : []);

  const mk = (type: Parameters<typeof newBlock>[0], props: Record<string, unknown>): Block => {
    const b = newBlock(type);
    b.props = { ...b.props, ...props };
    return b;
  };

  switch (key) {
    case "home":
      return [
        mk("hero", {
          arabic: s("hero_arabic", "انشراح"),
          title_line1: s("hero_title_line1", "an expansion"),
          title_line2: s("hero_title_line2", "of the chest."),
          description: s("hero_description", ""),
          cta_primary_label: s("hero_cta_primary_label", "Start reading"),
          cta_primary_href: s("hero_cta_primary_href", "/quranic-reflections"),
          cta_secondary_label: s("hero_cta_secondary_label", "Our story"),
          cta_secondary_href: s("hero_cta_secondary_href", "/about"),
          background: "radial",
        }),
        mk("pillar_cards", {
          eyebrow: s("pillars_eyebrow", "Four rooms in one house"),
          title: s("pillars_title", "Where to begin"),
          description: s("pillars_description", ""),
        }),
        mk("latest_articles", {
          eyebrow: s("latest_eyebrow", "Latest writing"),
          title: s("latest_title", "Recently, from us to you"),
          pillar: "",
          count: 3,
        }),
        mk("reflection_spotlight", {}),
        mk("testimonials_row", {
          eyebrow: s("testimonials_eyebrow", "Community voices"),
          title: s("testimonials_title", "Notes from readers"),
        }),
        mk("newsletter", {}),
      ];

    case "about": {
      const paragraphs = arr<string>("body_paragraphs");
      return [
        mk("hero", {
          arabic: s("hero_arabic", "انشراح"),
          title_line1: s("hero_title", "Islamic psychology, for the world of good."),
          title_line2: "",
          description: s("hero_description", ""),
          cta_primary_label: "",
          cta_secondary_label: "",
          background: "radial",
        }),
        mk("rich_text", { paragraphs: paragraphs.length ? paragraphs : ["Write the About story here."] }),
        mk("founder_letter", {
          eyebrow: s("founder_eyebrow", "Behind the words"),
          title: s("founder_title", "The founder"),
          letter: s("founder_letter", "ف"),
          name: s("founder_name", "Founder"),
          role: s("founder_role", ""),
          bio: s("founder_bio", ""),
          tint: "heart",
        }),
      ];
    }

    case "life-architecture": {
      const previews = arr<{ icon?: string; tag?: string; title: string; description: string }>("previews");
      return [
        mk("hero", {
          eyebrow: s("eyebrow", "Pillar 04 · Architecture"),
          arabic: "",
          title_line1: s("title", "Life Architecture"),
          title_line2: "",
          description: s("description", ""),
          cta_primary_label: "",
          cta_secondary_label: "",
          background: "radial",
        }),
        mk("newsletter", {
          heading: s("waitlist_heading", "Be first when the door opens"),
          description: s("waitlist_description", ""),
          cta: s("waitlist_cta", "Join the waitlist"),
        }),
        mk("section_header", {
          eyebrow: s("previews_eyebrow", "What to look forward to"),
          title: s("previews_title", "The shape of what's coming"),
          description: s("previews_description", ""),
          align: "left",
        }),
        mk("feature_grid", {
          columns: 3,
          items: previews.length ? previews : [
            { icon: "users", tag: "Cohorts", title: "Mentor-led courses", description: "Small cohorts with a mentor who knows your name." },
            { icon: "mountain", tag: "Retreats", title: "In-person retreats", description: "A few days away from the noise." },
            { icon: "calendar", tag: "Gatherings", title: "Exclusive events", description: "Intimate salons and dinners." },
          ],
        }),
      ];
    }

    case "contact":
      return [
        mk("hero", {
          eyebrow: s("eyebrow", "Say salaam"),
          arabic: "",
          title_line1: s("title", "We'd love to hear from you"),
          title_line2: "",
          description: s("description", ""),
          cta_primary_label: "",
          cta_secondary_label: "",
          background: "radial",
        }),
        mk("cta_banner", {
          title: s("support_title", "Support this project"),
          description: s("support_body", ""),
          cta_label: "",
          tint: "heart",
        }),
      ];

    default: {
      // Generic seed: try common hero keys.
      const heroTitle = s("hero_title") || s("title");
      if (heroTitle) {
        return [
          mk("hero", {
            eyebrow: s("eyebrow", ""),
            arabic: s("hero_arabic", ""),
            title_line1: heroTitle,
            title_line2: "",
            description: s("hero_description") || s("description", ""),
            cta_primary_label: "",
            cta_secondary_label: "",
            background: "radial",
          }),
        ];
      }
      return [];
    }
  }
}
