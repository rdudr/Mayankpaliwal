import { projects, type Client, type Project } from '../content/site'
import { clientMeta, instagramId, youtubeId } from './util'

export type ProjectView = Project & {
  thumb: string
  preview?: string
  yt?: string
  /** Instagram reel/post code — plays in Instagram's own (vertical) embed */
  ig?: string
  meta: (typeof clientMeta)[Client]
  clipName: string
}

export function view(p: Project): ProjectView {
  const meta = clientMeta[p.client]
  const yt = p.link ? youtubeId(p.link) : undefined
  const ig = p.link && !p.video ? instagramId(p.link) : undefined
  return {
    ...p,
    meta,
    yt,
    ig,
    thumb: yt ? `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg` : `/media/projects/${p.client}/${p.id}.jpg`,
    preview: yt || ig ? undefined : `/media/projects/${p.client}/${p.id}-preview.mp4`,
    clipName: `${meta.bin}_${(p.episode ?? p.id).replace(/\s+/g, '').toUpperCase()}`,
  }
}

export const allProjects = projects.map(view)

/** A bin's clips. Placeholder cards disappear as soon as the bin has real work. */
export function byClient(c: Client) {
  const all = allProjects.filter((p) => p.client === c)
  const real = all.filter((p) => !p.placeholder)
  return real.length ? real : all
}
