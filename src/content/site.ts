// ─────────────────────────────────────────────────────────────
// ALL PORTFOLIO TEXT + LINKS LIVE HERE.
// Fill every "TODO". Media paths point into /public/media.
// ─────────────────────────────────────────────────────────────

export type Client = 'raj-shamani' | 'beerbiceps' | 'daud' | 'freelance'

export const profile = {
  name: 'Mayank Paliwal',
  roles: ['Video Editor', 'Filmmaker', 'Storyteller'],
  oneLiner: 'TODO: one sentence on what he does best',
  yearsLabel: '5+ years',
  since: 2021,
  email: 'mayankpaliwalbusiness@gmail.com',
  phone: '+91 7014286214',
  instagram: 'https://www.instagram.com/mayankpaliwaal',
  tools: ['Premiere Pro', 'TODO: After Effects?', 'TODO: DaVinci Resolve?'],
  portrait: '/media/portrait/mayank.jpg',
  showreel: '/media/reel/showreel.mp4',
  showreelPoster: '/media/reel/showreel-poster.jpg',
  heroLoop: '/media/hero/hero-loop.mp4',
  heroPoster: '/media/hero/hero-poster.jpg',
}

export const experience = [
  {
    client: 'raj-shamani' as Client,
    title: 'Raj Shamani',
    role: 'Video Editor',
    period: 'Sep 2025 – Present',
    link: 'https://www.youtube.com/rajshamani',
    summary: 'TODO: what exactly he edits (long-form episodes? shorts? how many?)',
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
  id: string            // must match file names in the client folder
  client: Client
  title: string
  role: string
  link: string          // YouTube / Instagram URL
  result?: string       // e.g. "1.2M views"
}

// Thumbnail  = /media/projects/<client>/<id>.jpg
// Preview    = /media/projects/<client>/<id>-preview.mp4
export const projects: Project[] = [
  { id: 'ep01', client: 'daud', title: 'Daud BTS — Episode 1', role: 'Editor', link: 'TODO' },
  { id: 'ep02', client: 'daud', title: 'Daud BTS — Episode 2', role: 'Editor', link: 'TODO' },
  { id: 'ep03', client: 'daud', title: 'Daud BTS — Episode 3', role: 'Editor', link: 'TODO' },
  { id: 'ep04', client: 'daud', title: 'Daud BTS — Episode 4', role: 'Editor', link: 'TODO' },
  { id: 'ep05', client: 'daud', title: 'Daud BTS — Episode 5', role: 'Editor', link: 'TODO' },
  { id: 'ep06', client: 'daud', title: 'Daud BTS — Episode 6', role: 'Editor', link: 'TODO' },
  { id: 'rs-01', client: 'raj-shamani', title: 'TODO episode title', role: 'Editor', link: 'TODO' },
  { id: 'rs-02', client: 'raj-shamani', title: 'TODO episode title', role: 'Editor', link: 'TODO' },
  { id: 'bb-01', client: 'beerbiceps', title: 'TODO video title', role: 'Editor', link: 'TODO' },
  { id: 'fl-01', client: 'freelance', title: 'TODO project', role: 'Editor', link: 'TODO' },
]

// Set to false to hide the Stills section (only show it if the photos are strong).
export const showStills = true

export const stills = Array.from({ length: 8 }, (_, i) => `/media/stills/still-${String(i + 1).padStart(2, '0')}.jpg`)

export const beforeAfter = {
  enabled: true, // set to false until the client OKs showing raw footage
  caption: 'Raw camera frame vs. the final grade.',
  before: '/media/before-after/before.jpg',
  after: '/media/before-after/after.jpg',
}

export const testimonials: { quote: string; name: string; role: string }[] = [
  // { quote: 'TODO', name: 'TODO', role: 'TODO' },
]
