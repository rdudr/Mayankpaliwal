import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ProjectView } from '../lib/projects'
import { Img, Video } from '../lib/media'
import { blip } from '../lib/sound'
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
      <Modal open={!!p} onClose={close} label={p?.title ?? 'Project'} className="max-w-5xl">
        {p && <ProjectBody p={p} onClose={close} />}
      </Modal>
    </Ctx.Provider>
  )
}

/** YouTube stays behind a click-to-load facade (no iframe until asked). Self-hosted episodes play inline. */
function ProjectBody({ p, onClose }: { p: ProjectView; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const external = p.link?.startsWith('http') ? p.link : ''

  return (
    <div className="text-ink">
      <div className="relative flex aspect-video max-h-[70svh] w-full items-center justify-center bg-black">
        {p.yt && loaded ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${p.yt}?autoplay=1&rel=0`}
            title={p.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : p.yt ? (
          <button onClick={() => setLoaded(true)} className="group absolute inset-0" aria-label={`Play ${p.title}`} data-autofocus>
            <Img src={p.thumb} alt="" loading="eager" className="size-full object-cover" />
            <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#ff0033] text-white shadow-xl transition-transform group-hover:scale-110">
              <Icon.play className="ml-1 size-8" />
            </span>
          </button>
        ) : p.video ? (
          <Video src={p.video} poster={p.thumb} controls autoPlay className="size-full object-contain" data-autofocus />
        ) : (
          <Img src={p.thumb} alt="" className="size-full object-cover" />
        )}
        <CloseButton onClick={onClose} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[1fr_auto] md:items-end">
        <div className="min-w-0">
          <p className="mono mb-2 flex items-center gap-2 text-xs text-dim">
            <Dot color={p.meta.color} /> {p.meta.label}
            {p.episode && <> · {p.episode}</>}
          </p>
          <h3 className="text-2xl font-semibold leading-snug sm:text-3xl">{p.title}</h3>
          <p className="mt-2 text-sm text-dim">
            {p.role}
            {p.result && <> · <span className="text-ink">{p.result}</span></>}
          </p>
        </div>
        {external && (
          <a
            href={external}
            target="_blank"
            rel="noreferrer"
            className="btn-orange inline-flex h-12 items-center gap-2 justify-self-start px-6"
          >
            {p.yt ? 'Watch on YouTube' : 'Open on Instagram'} <Icon.external className="size-4" />
          </a>
        )}
      </div>
    </div>
  )
}
