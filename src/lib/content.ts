// Mock content store. Structured to be easily swappable with a CMS later.

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
  body?: Array<
    | { kind: "p"; text: string }
    | { kind: "h2"; text: string }
    | { kind: "quote"; text: string; arabic?: string; source?: string }
  >;
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

const P = (text: string) => ({ kind: "p" as const, text });
const H2 = (text: string) => ({ kind: "h2" as const, text });
const Q = (text: string, arabic?: string, source?: string) => ({ kind: "quote" as const, text, arabic, source });

const bodyBase = [
  P("There is a difference between reading a verse and letting it read you. The Qur'an, in its own words, was sent down thiqalan — heavy — not because it burdens us, but because it settles in a place inside us that nothing lighter can reach."),
  Q("Did We not expand for you your chest?", "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ", "Surah Ash-Sharh, 94:1"),
  H2("Sitting with the word"),
  P("Tadabbur is not analysis. It is not exegesis. It is the quiet, unhurried sitting-with a verse until something in you shifts — a knot loosens, a resistance softens, a small door in the chest opens."),
  P("Try this: pick one ayah this week. Not a whole surah. One verse. Return to it before sleep and on waking. Let it be the last thing your tongue tastes at night and the first thing it reaches for at dawn."),
  H2("The expansion that follows"),
  P("Notice the sequence in the surah. First, the chest opens. Only then does the mention of the burden come — and it is spoken of in the past tense, as something already lifted. Ease does not come after you fix yourself. It comes as the fixing."),
];

export const CONTENT: ContentItem[] = [
  {
    slug: "the-chest-that-opens",
    title: "The chest that opens",
    description: "On Surah Ash-Sharh, and the ease that arrives inside the hardship — not after it.",
    pillar: "quranic-reflections",
    type: "reflection",
    readTime: "6 min read",
    date: "2026-07-18",
    author: { name: "The Inshirah team" },
    tags: ["surah ash-sharh", "sabr", "ease"],
    body: bodyBase,
  },
  {
    slug: "muraqabah-in-five-breaths",
    title: "Muraqabah in five breaths",
    description: "A short daily practice for remembering that you are seen — and softening because of it.",
    pillar: "tazkiyah-toolkit",
    type: "worksheet",
    readTime: "3 min practice",
    date: "2026-07-14",
    author: { name: "The Inshirah team" },
    tags: ["muraqabah", "practice", "morning"],
    downloadable: true,
    body: bodyBase,
  },
  {
    slug: "when-nothing-feels-like-yours",
    title: "When nothing feels like yours",
    description: "A letter to the young heart caught between what the world wants and what Allah asks.",
    pillar: "young-hearts",
    type: "article",
    readTime: "8 min read",
    date: "2026-07-10",
    author: { name: "Yasmeen H.", role: "Contributor" },
    tags: ["identity", "youth", "belonging"],
    body: bodyBase,
  },
  {
    slug: "what-life-architecture-is",
    title: "What Life Architecture is (and isn't)",
    description: "A first glimpse at the mentor-led course we are building — and why we are taking our time.",
    pillar: "life-architecture",
    type: "blog",
    readTime: "5 min read",
    date: "2026-07-02",
    author: { name: "The Inshirah team" },
    tags: ["course", "intentional life"],
    body: bodyBase,
  },
  {
    slug: "tadabbur-on-al-fatiha",
    title: "Sitting with Al-Fatiha",
    description: "A slow tadabbur session on the surah we recite most, and hear least.",
    pillar: "quranic-reflections",
    type: "tadabbur",
    readTime: "24 min listen",
    date: "2026-06-28",
    author: { name: "The Inshirah team" },
    tags: ["al-fatiha", "tadabbur"],
    body: bodyBase,
  },
  {
    slug: "the-heart-is-a-mirror",
    title: "The heart is a mirror",
    description: "A short reflection on why polishing the qalb matters more than performing it.",
    pillar: "tazkiyah-toolkit",
    type: "article",
    readTime: "4 min read",
    date: "2026-06-22",
    author: { name: "The Inshirah team" },
    tags: ["qalb", "tazkiyah"],
    body: bodyBase,
  },
  {
    slug: "a-book-for-quiet-nights",
    title: "A book for quiet nights",
    description: "Notes on Al-Ghazali's Ihya, and why it still speaks to a phone-lit generation.",
    pillar: "young-hearts",
    type: "book",
    readTime: "10 min read",
    date: "2026-06-18",
    author: { name: "The Inshirah team" },
    tags: ["ghazali", "reading"],
    body: bodyBase,
  },
  {
    slug: "podcast-01-what-is-inshirah",
    title: "Ep 01 — What is Inshirah?",
    description: "The story behind the name, and what we're trying to build together.",
    pillar: "quranic-reflections",
    type: "podcast",
    readTime: "38 min listen",
    date: "2026-06-12",
    author: { name: "The Inshirah team" },
    tags: ["intro", "podcast"],
    body: bodyBase,
  },
  {
    slug: "video-morning-dhikr",
    title: "A morning dhikr you'll actually keep",
    description: "Short video: three phrases, sixty seconds, every morning.",
    pillar: "tazkiyah-toolkit",
    type: "video",
    readTime: "6 min watch",
    date: "2026-06-05",
    author: { name: "The Inshirah team" },
    tags: ["dhikr", "morning"],
    body: bodyBase,
  },
  {
    slug: "letter-to-a-tired-friend",
    title: "Letter to a tired friend",
    description: "For the reader who is doing more than anyone knows, and still feels behind.",
    pillar: "young-hearts",
    type: "blog",
    readTime: "5 min read",
    date: "2026-05-28",
    author: { name: "The Inshirah team" },
    tags: ["burnout", "hope"],
    body: bodyBase,
  },
  {
    slug: "worksheet-a-week-of-muhasabah",
    title: "A week of muhasabah",
    description: "A printable seven-day self-accounting worksheet — gentle, honest, unhurried.",
    pillar: "tazkiyah-toolkit",
    type: "worksheet",
    readTime: "Printable",
    date: "2026-05-20",
    author: { name: "The Inshirah team" },
    tags: ["muhasabah", "printable"],
    downloadable: true,
    body: bodyBase,
  },
  {
    slug: "on-choosing-a-path",
    title: "On choosing a path (without knowing the ending)",
    description: "A meditation on tawakkul and career decisions for the honestly uncertain.",
    pillar: "life-architecture",
    type: "article",
    readTime: "7 min read",
    date: "2026-05-12",
    author: { name: "The Inshirah team" },
    tags: ["tawakkul", "career"],
    body: bodyBase,
  },
];

export const REFLECTION_OF_THE_DAY = [
  { arabic: "أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ", en: "Did We not expand for you your chest?", ref: "Ash-Sharh 94:1" },
  { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "So verily, with hardship comes ease.", ref: "Ash-Sharh 94:5" },
  { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", en: "Truly, in the remembrance of Allah do hearts find rest.", ref: "Ar-Ra'd 13:28" },
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", en: "And say: My Lord, increase me in knowledge.", ref: "Ta-Ha 20:114" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", en: "Indeed, Allah is with the patient.", ref: "Al-Baqarah 2:153" },
  { arabic: "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", en: "And Allah loves those who do good.", ref: "Aal-Imran 3:134" },
  { arabic: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ", en: "It may be that you dislike a thing which is good for you.", ref: "Al-Baqarah 2:216" },
];

export const TESTIMONIALS = [
  { quote: "The kind of writing you save for the days when your chest feels tight. Rare, and steady, and needed.", name: "Reader, London", note: "placeholder" },
  { quote: "It doesn't try to fix me. It just sits next to me. That, honestly, is what I've been looking for.", name: "Reader, Toronto", note: "placeholder" },
  { quote: "I sent the muhasabah worksheet to my sister and to my halaqa. It's the first thing that actually made muhasabah feel possible.", name: "Reader, Kuala Lumpur", note: "placeholder" },
];

export function getContentBySlug(slug: string) {
  return CONTENT.find((c) => c.slug === slug);
}

export function getContentByPillar(pillar: Pillar) {
  return CONTENT.filter((c) => c.pillar === pillar);
}

export function getRelated(item: ContentItem, count = 3) {
  return CONTENT.filter((c) => c.pillar === item.pillar && c.slug !== item.slug).slice(0, count);
}
