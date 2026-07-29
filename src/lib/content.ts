// Static UI config (pillars/formats) + type definitions.
// Actual editorial content (articles, reflections, testimonials) lives in Supabase.

export type Pillar =
  | "tadabbur"
  | "tazkiyah"
  | "youth"
  | "suhbah";

export type ResourceType =
  | "article"
  | "reflection"
  | "blog"
  | "video"
  | "podcast"
  | "book"
  | "course"
  | "tadabbur"
  | "worksheet";

export type ContentBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "quote"; text: string; arabic?: string; source?: string; tint?: string }
  | { kind: "plain_quote"; text: string; source?: string }
  | { kind: "callout"; text: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | { kind: "image"; src: string; alt?: string; caption?: string; width?: number }
  | { kind: "divider" }
  | { kind: "video"; src: string; caption?: string; width?: number }

  | { kind: "audio"; src: string; caption?: string }
  | { kind: "hyperlink"; url: string; label: string; description?: string }
  | { kind: "recommended"; slug: string }
  | { kind: "arabic_large"; arabic: string; english?: string }
  | { kind: "columns"; items: ContentBlock[] };

export interface ContentItem {
  slug: string;
  title: string;
  description: string;
  pillar: Pillar;
  type: ResourceType;
  readTime?: string;
  date: string; // ISO
  author: { name: string; role?: string };
  tags: string[];
  downloadable?: boolean;
  body?: ContentBlock[];
}

export const PILLARS: Record<Pillar, { label: string; short: string; letter: string; tint: string; description: string; href: string; }> = {
  "tadabbur": {
    label: "Tadabbur",
    short: "Tadabbur",
    letter: "ق",
    tint: "heart",
    description: "Slow, tadabbur-first readings of the Book — verse by verse, ayah by ayah.",
    href: "/tadabbur",
  },
  "tazkiyah": {
    label: "Tazkiyah",
    short: "Tazkiyah",
    letter: "ت",
    tint: "tazkiyah",
    description: "Practices, printables, and gentle exercises to soften and steady the heart.",
    href: "/tazkiyah",
  },
  "youth": {
    label: "Youth",
    short: "Youth",
    letter: "ي",
    tint: "heart-soft",
    description: "Honest, warm writing for teens and young adults finding their footing.",
    href: "/youth",
  },
  "suhbah": {
    label: "Suhbah",
    short: "Suhbah",
    letter: "ح",
    tint: "gold",
    description: "A mentor-led course, coming soon — building a life with intention.",
    href: "/suhbah",
  },
};


// Map a raw articles row from Supabase into the UI's ContentItem shape.
export function mapArticleRow(row: {
  slug: string;
  title: string;
  description: string;
  pillar: string;
  
  read_time: string | null;
  author_name: string;
  author_role: string | null;
  tags: string[];
  downloadable: boolean;
  body: unknown;
  published_at: string;
}): ContentItem {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    pillar: row.pillar as Pillar,
    
    readTime: row.read_time ?? undefined,
    author: { name: row.author_name, role: row.author_role ?? undefined },
    tags: row.tags ?? [],
    downloadable: row.downloadable,
    date: row.published_at,
    body: Array.isArray(row.body) ? (row.body as ContentBlock[]) : [],
  };
}
