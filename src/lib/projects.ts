import { projects, type Project } from '../content/site'
import { clientMeta, tbc } from './util'

export type ProjectView = Project & {
  displayTitle: string
  thumb: string
  preview: string
  meta: (typeof clientMeta)[Project['client']]
  clipName: string
}

export function view(p: Project): ProjectView {
  const meta = clientMeta[p.client]
  const n = projects.filter((q) => q.client === p.client).indexOf(p) + 1
  return {
    ...p,
    meta,
    displayTitle: tbc(p.title, `${meta.label} — edit ${String(n).padStart(2, '0')}`),
    thumb: `/media/projects/${p.client}/${p.id}.jpg`,
    preview: `/media/projects/${p.client}/${p.id}-preview.mp4`,
    clipName: `${meta.bin}_${p.id.toUpperCase().replace('-', '')}.mp4`,
  }
}

export const allProjects = projects.map(view)
export const byClient = (c: Project['client']) => allProjects.filter((p) => p.client === c)
