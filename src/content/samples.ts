// ─────────────────────────────────────────────────────────────
// SAMPLE MEDIA — placeholders only.
// Every <Img>/<Video> tries the real file in /public/media first and
// falls back to the sample below if that file is missing. Drop the real
// file in and it takes over automatically; nothing here needs editing.
// ─────────────────────────────────────────────────────────────

const clips = [
  'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
  'https://download.samplelib.com/mp4/sample-5s.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://download.samplelib.com/mp4/sample-10s.mp4',
]

const photo = (seed: string, w = 1280, h = 720) => `https://picsum.photos/seed/mp-${seed}/${w}/${h}`

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** Returns a sample URL for any /media path, or undefined for unknown paths. */
export function sampleFor(path: string): string | undefined {
  if (path.startsWith('http')) return undefined
  const name = path.split('/').pop() ?? path
  if (path.includes('/reel/showreel.mp4')) return 'https://download.samplelib.com/mp4/sample-30s.mp4'
  if (path.includes('/hero/hero-loop')) return clips[0]
  if (name.endsWith('.mp4')) return clips[hash(path) % clips.length]
  if (path.includes('/portrait/')) return photo('portrait', 1200, 1600)
  if (path.includes('/before-after/')) return photo('grade', 1600, 900)
  if (path.includes('/stills/')) return photo(name, 1600, hash(name) % 2 ? 1066 : 2000)
  if (name.endsWith('.jpg') || name.endsWith('.png')) return photo(name.replace(/\.\w+$/, ''))
  return undefined
}
