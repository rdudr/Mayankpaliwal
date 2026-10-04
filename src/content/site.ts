// ─────────────────────────────────────────────────────────────
// ALL PORTFOLIO TEXT + LINKS LIVE HERE.
// Anything still marked "TODO" is hidden on the live site until filled.
// Media paths point into /public/media.
// ─────────────────────────────────────────────────────────────

export type Client = 'raj-shamani' | 'beerbiceps' | 'daud' | 'freelance'

export const profile = {
  name: 'Mayank Paliwal',
  firstName: 'Mayank',
  roles: ['Video Editor', 'Filmmaker', 'Storyteller'],
  oneLiner: 'I edit long-form stories people actually finish watching.',
  yearsLabel: '5+ years',
  since: 2021,
  from: 'India',
  email: 'mayankpaliwalbusiness@gmail.com',
  phone: '+91 7014286214',
  instagram: 'https://www.instagram.com/mayankpaliwaal',
  about:
    'Video editor, filmmaker and storyteller from India, cutting since 2021. Today I edit long-form podcast episodes for Raj Shamani’s Figuring Out; before that BeerBiceps, and years of freelance work — including the Daud behind-the-scenes series.',
  // Shown as the floating logos in the lab and as tool chips. Confirm this list with Mayank.
  tools: ['Premiere Pro', 'After Effects', 'Photoshop', 'Illustrator', 'Final Cut Pro', 'DaVinci Resolve'],
  portrait: '/media/portrait/mayank.jpg', // square, ~600px (About page profile panel)
  showreel: '/media/reel/showreel.mp4', // until a reel exists, Daud EP01 plays instead
  showreelPoster: '/media/reel/showreel-poster.jpg',
}

// Bar lengths are placeholders (0–100) — adjust with Mayank.
export const skills = [
  { name: 'Long-form editing', level: 95 },
  { name: 'Storytelling & pacing', level: 92 },
  { name: 'Short-form / reels', level: 88 },
  { name: 'Colour grading', level: 75 },
  { name: 'Motion graphics', level: 70 },
  { name: 'Sound design', level: 78 },
]

export const experience = [
  {
    client: 'raj-shamani' as Client,
    title: 'Raj Shamani',
    role: 'Video Editor',
    period: 'Sep 2025 – Present',
    link: 'https://www.youtube.com/rajshamani',
    summary: 'Long-form podcast episodes for Figuring Out — guests include Emmanuel Macron, DY Chandrachud, Kiara Advani and Smriti Mandhana.',
  },
  {
    client: 'beerbiceps' as Client,
    title: 'BeerBiceps',
    role: 'Video Editor',
    period: 'Feb 2025 – May 2025',
    link: 'https://www.youtube.com/channel/UCPxMZIFE856tbTfdkdjzTSQ',
    summary: 'TODO: what he worked on',
  },
  {
    client: 'daud' as Client,
    title: 'Daud — Behind the Scenes series',
    role: 'Video Editor',
    period: '2024',
    partOf: 'freelance', // shown as a highlight inside the freelance clip
    link: 'https://www.instagram.com/arpitjainn__/',
    summary:
      'Edited a 6-episode series on the making of the short film Daud. 500K+ views on Instagram and 2,500 new followers for the creator in 3 days.',
  },
  {
    client: 'freelance' as Client,
    title: 'Freelance',
    role: 'Video Editor',
    period: '2021 – Jan 2025',
    link: '',
    summary:
      'Independent editing for creators and brands, including the Daud behind-the-scenes series (2024). TODO: add 2–3 client/project types.',
  },
]

export type Project = {
  id: string
  client: Client
  title: string
  role: string
  link?: string     // YouTube / Instagram URL (YouTube ones get their thumbnail automatically)
  video?: string    // self-hosted full video in /public/media
  episode?: string  // e.g. "FO473" or "EP 01"
  result?: string
  placeholder?: boolean // sample card — hidden once real work is added to the bin
}

const rs = (id: string, episode: string, title: string): Project => ({
  id, client: 'raj-shamani', episode, title, role: 'Editor', link: `https://youtu.be/${id}`,
})

// Self-hosted files: /media/projects/<client>/<id>.jpg, <id>-preview.mp4, <id>.mp4
const daud = (n: number, title: string): Project => {
  const id = `ep${String(n).padStart(2, '0')}`
  return { id, client: 'daud', episode: `EP ${String(n).padStart(2, '0')}`, title, role: 'Editor', video: `/media/projects/daud/${id}.mp4`, link: 'https://www.instagram.com/arpitjainn__/' }
}

export const projects: Project[] = [
  rs('9QXCkMTbrSk', 'FO473', 'President of France on Trump, India, Modi, Tech & Future — Emmanuel Macron'),
  rs('46P1rL0rzPE', 'FO561', 'Smriti Mandhana on Controlling Emotions, Handling Pressure & Failures'),
  rs('GKn7ywUpB6c', 'FO555', 'Why Is Watchmaking So Difficult? The Business Behind Luxury — Gaurav Mehta'),
  rs('9CADz6sP40I', 'FO551', 'The Most Expensive Cars Compete on Emotion, Not Engineering — Frank Walliser'),
  rs('zSkxqtTbEGU', 'FO545', 'Why America Is No Longer the World’s Leader — Ian Bremmer'),
  rs('PXMyK7JxGOk', 'FO537', 'Billion-Dollar Founder: Why Success in India Is So Hard — Kiran Mazumdar-Shaw'),
  rs('o-h3STaeFro', 'FO529', 'Why Banks Are Dying: Bitcoin, Crypto & De-dollarisation — Richard Teng'),
  rs('0TBjnUfulGw', 'FO527', 'Inside India’s Supreme Court: Money, Justice & Free Speech — DY Chandrachud'),
  rs('NGV5S9j_oL4', 'FO523', 'Russian Spy: Mind Control, Seduction & Manipulation — Aliia Roza'),
  rs('lacFcgcHx6I', 'FO518', 'Top Brain Scientist: Billionaire Brain, Anxiety & Addictions — Vidita Vaidya'),
  rs('sGpc8-f2e8U', 'FO517', 'Imtiaz Ali on Love, Heartbreak, Rockstar, Tamasha & Bollywood Filmmaking'),
  rs('JCOb1w_LTOg', 'FO512', 'Champion Mindset: High Performance, Discipline & Obsession'),
  rs('3otrmTL24OA', 'FO507', 'Kiara Advani on Marriage, Motherhood, Relationships & Bollywood'),
  rs('23dbj3silMU', 'FO504', 'Lakshya Sen on Champion Mindset, Olympic Heartbreak & Comebacks'),
  rs('CdsneNlNpXw', 'FO502', 'The Hidden Danger in Rice and Wheat: Focus Issues, Iron Loss & Anemia'),
  rs('rb9536WrfDA', 'FO501', 'Indian Diet Problem: Low Protein, High Calories & Muscle Loss — Prashant Desai'),

  // Instagram reels — thumbnails saved in /media/projects/<client>/<id>.jpg (Instagram's image links expire)
  { id: 'rs-smuggling', client: 'raj-shamani', episode: 'REEL', title: 'Why Smuggling Happens — Utkarsh Dave', role: 'Editor', link: 'https://www.instagram.com/reel/DP53WW8Er2r/' },
  { id: 'bb-bhuvi', client: 'beerbiceps', episode: 'REEL', title: 'Bhuvneshwar Kumar on His Crazy Cricket Debut', role: 'Editor', link: 'https://www.instagram.com/reel/DXqrk1BDLHF/' },

  daud(1, 'Sach ka Samna'),
  daud(2, 'Shadyantra'),
  daud(3, 'Duvidha'),
  daud(4, 'Grahon Ka Khel'),
  daud(5, 'Khulasa'),
  daud(6, 'Finally Actress Mil Gayi'),

  // TODO: real freelance links. This one is a sample placeholder.
  { id: 'fl-01', client: 'freelance', title: 'Freelance edit (link coming soon)', role: 'Editor', placeholder: true },
]
