// Static UI config (pillars/formats) + type definitions.
// Actual editorial content (articles, reflections, testimonials) lives in Supabase.

export type Pillar =
  | "quranic-reflections"
  | "tazkiyah-toolkit"
  | "young-hearts"
  | "life-architecture";

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
  | { kind: "quote"; text: string; arabic?: string; source?: string };

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
  "quranic-reflections": {
    label: "Qur'anic Reflections",
    short: "Reflections",
    letter: "ق",
    tint: "heart",
    description: "Slow, tadabbur-first readings of the Book — verse by verse, ayah by ayah.",
    href: "/quranic-reflections",
  },
  "tazkiyah-toolkit": {
    label: "Tazkiyah Toolkit",
    short: "Toolkit",
    letter: "ت",
    tint: "tazkiyah",
    description: "Practices, printables, and gentle exercises to soften and steady the heart.",
    href: "/tazkiyah-toolkit",
  },
  "young-hearts": {
    label: "Young Hearts",
    short: "Youth",
    letter: "ي",
    tint: "heart-soft",
    description: "Honest, warm writing for teens and young adults finding their footing.",
    href: "/young-hearts",
  },
  "life-architecture": {
    label: "Life Architecture",
    short: "Architecture",
    letter: "ح",
    tint: "gold",
    description: "A mentor-led course, coming soon — building a life with intention.",
    href: "/life-architecture",
  },
};

export const RESOURCE_TYPES: Record<ResourceType, { label: string; plural: string; letter: string }> = {
  article: { label: "Article", plural: "Articles", letter: "م" },
  reflection: { label: "Reflection", plural: "Reflections", letter: "ت" },
  blog: { label: "Blog post", plural: "Blog posts", letter: "و" },
  video: { label: "Video", plural: "Videos", letter: "ف" },
  podcast: { label: "Podcast", plural: "Podcasts", letter: "ص" },
  book: { label: "Book", plural: "Books", letter: "ك" },
  course: { label: "Course", plural: "Courses", letter: "د" },
  tadabbur: { label: "Tadabbur", plural: "Tadabbur", letter: "ن" },
  worksheet: { label: "Worksheet", plural: "Worksheets", letter: "ع" },
};

// Map a raw articles row from Supabase into the UI's ContentItem shape.
export function mapArticleRow(row: {
  slug: string;
  title: string;
  description: string;
  pillar: string;
  type: string;
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
    type: row.type as ResourceType,
    readTime: row.read_time ?? undefined,
    author: { name: row.author_name, role: row.author_role ?? undefined },
    tags: row.tags ?? [],
    downloadable: row.downloadable,
    date: row.published_at,
    body: Array.isArray(row.body) ? (row.body as ContentBlock[]) : [],
  };
}
