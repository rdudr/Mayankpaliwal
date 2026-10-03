// ─────────────────────────────────────────────────────────────
// SAMPLE / FALLBACK MEDIA.
// <Img>/<Video> try the real file first and fall back to these if it's
// missing. Drop the real file in and it takes over automatically.
// ─────────────────────────────────────────────────────────────

const photo = (seed: string, w = 1280, h = 720) => `https://picsum.photos/seed/mp-${seed}/${w}/${h}`

export function sampleFor(path: string): string | undefined {
  if (path.startsWith('http')) {
    // YouTube's maxres thumbnail doesn't exist for every video — fall back to hq.
    const yt = path.match(/i\.ytimg\.com\/vi\/([\w-]{11})\/maxresdefault\.jpg/)
    return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : undefined
  }
  const name = path.split('/').pop() ?? path
  // No showreel yet: play a real episode instead of stock footage.
  if (path.includes('/reel/showreel.mp4')) return '/media/projects/daud/ep01.mp4'
  if (path.includes('/reel/showreel-poster')) return '/media/projects/daud/ep01.jpg'
  if (name.endsWith('-preview.mp4')) return 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4'
  if (name.endsWith('.jpg') || name.endsWith('.png')) return photo(name.replace(/\.\w+$/, ''))
  return undefined
}
