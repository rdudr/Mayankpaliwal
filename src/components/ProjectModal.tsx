import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ProjectView } from '../lib/projects'
import { Img, Video } from '../lib/media'
import { blip } from '../lib/sound'
import { tbc, youtubeId } from '../lib/util'
import { CloseButton, Dot, Icon, Modal } from './ui'

const Ctx = createContext<(p: ProjectView) => void>(() => {})
export const useOpenProject = () => useContext(Ctx)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<ProjectView | null>(null)
  const open = useCallback((x: ProjectView) => (blip('click'), setP(x)), [])
  const close = useCallback(() => setP(null), [])
  return (
    <Ctx.Provider value={open}>
      {children}
      <Modal open={!!p} onClose={close} label={p?.displayTitle ?? 'Project'} className="max-w-5xl">
        {p && <ProjectBody p={p} onClose={close} />}
      </Modal>
    </Ctx.Provider>
  )
}

/** Full videos stay on YouTube behind a click-to-load facade — no iframe until asked. */
function ProjectBody({ p, onClose }: { p: ProjectView; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const yt = youtubeId(p.link)
  const external = tbc(p.link).startsWith('http') ? p.link : ''

  return (
    <div>
      <div className="relative aspect-video bg-black">
        {loaded && yt ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`}
            title={p.displayTitle}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : yt ? (
          <button onClick={() => setLoaded(true)} className="group absolute inset-0" aria-label={`Play ${p.displayTitle}`}>
            <Img src={p.thumb} alt="" className="size-full object-cover" />
            <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-white transition-transform group-hover:scale-110">
              <Icon.play className="size-7" />
            </span>
          </button>
        ) : (
          <Video src={p.preview} poster={undefined} muted loop autoPlay className="size-full object-cover" />
        )}
        <CloseButton onClick={onClose} className="absolute right-3 top-3" />
      </div>

      <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="mono mb-3 flex items-center gap-2 text-xs text-dim">
            <Dot color={p.meta.color} /> {p.meta.label} · {p.clipName}
          </p>
          <h3 className="display text-4xl sm:text-5xl">{p.displayTitle}</h3>
          <p className="mt-3 text-dim">
            {p.role}
            {p.result && <> · <span className="text-ink">{p.result}</span></>}
          </p>
        </div>
        {external ? (
          <a
            href={external}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 justify-self-start rounded-full border border-line px-5 transition-colors hover:border-ink"
          >
            Watch full video <Icon.external className="size-4" />
          </a>
        ) : (
          <p className="mono text-xs text-faint">Full video link coming soon</p>
        )}
      </div>
    </div>
  )
}
