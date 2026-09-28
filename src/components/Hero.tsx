import { motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { profile } from '../content/site'
import { useInView, useReducedMotion } from '../lib/hooks'
import { Video } from '../lib/media'
import { gsap, scrollToId } from '../lib/scroll'
import { blip } from '../lib/sound'
import { tbc } from '../lib/util'
import { useReel } from './Reel'
import { Icon } from './ui'

const ONE_LINER = 'Long-form conversations, cut so every minute earns the next one.'

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const onScreen = useInView(root)
  const reduced = useReducedMotion()
  // Reduced motion: start on the still frame; the visitor can press play.
  const [paused, setPaused] = useState(reduced)
  const reel = useReel()

  // Pause the loop when it's off screen (or the visitor paused it).
  useEffect(() => {
    const v = video.current
    if (!v) return
    if (onScreen && !paused) v.play().catch(() => {})
    else v.pause()
  }, [onScreen, paused])

  // Letterbox open: 2.39:1 bars pull back as the playhead leaves the hero.
  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray<HTMLElement>('[data-bar]')
      const barH = () => {
        const h = (innerHeight - innerWidth / 2.39) / 2
        return Math.min(Math.max(h, innerHeight * 0.08), innerHeight * 0.22)
      }
      gsap.fromTo(
        bars,
        { height: barH },
        { height: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } },
      )
      gsap.to('[data-hero-copy]', {
        yPercent: -18,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: '30% top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  const name = profile.name.split(' ')

  return (
    <section ref={root} id="hero" aria-label="Introduction" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-black">
      <Video
        ref={video}
        src={profile.heroLoop}
        poster={profile.heroPoster}
        muted
        loop
                preload="auto"
        aria-hidden
        className="absolute inset-0 size-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,transparent_0%,rgba(0,0,0,.65)_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-page via-page/40 to-transparent" />

      {/* Letterbox bars */}
      <div data-bar className="absolute inset-x-0 top-0 z-10 bg-black" />
      <div data-bar className="absolute inset-x-0 bottom-0 z-10 bg-black" />

      <div data-hero-copy className="section-pad relative z-20 flex h-full flex-col justify-end pb-[calc(var(--dock)+9svh)]">
        <motion.p
          className="mono mb-5 text-xs uppercase text-dim"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Sequence 01 · {profile.yearsLabel} · since {profile.since}
        </motion.p>

        <h1 className="display text-[clamp(3.4rem,min(15vw,19svh),12.5rem)]" aria-label={profile.name}>
          {name.map((word, w) => (
            <span key={word} className="block overflow-hidden pb-[0.06em]">
              <motion.span
                className="inline-block"
                initial={reduced ? false : { y: '105%' }}
                animate={ready ? { y: 0 } : {}}
                transition={{ delay: 0.15 + w * 0.12, duration: 0.8, ease: [0.2, 0.7, 0.1, 1] }}
              >
                {w === 1 ? <em className="italic">{word}</em> : word}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          className="mt-6 flex max-w-2xl flex-col gap-6 md:mt-8"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <p className="text-base text-dim sm:text-lg">
            <span className="text-ink">{profile.roles.join(' · ')}.</span> {tbc(profile.oneLiner, ONE_LINER)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={reel.open}
              className="group inline-flex h-12 items-center gap-3 rounded-full bg-accent pl-2 pr-6 font-medium text-white shadow-[0_0_40px_-8px_var(--color-accent)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="grid size-8 place-items-center rounded-full bg-white/20">
                <Icon.play className="size-3.5" />
              </span>
              Watch reel <span className="mono text-sm opacity-80">(90s)</span>
            </button>
            <button
              onClick={() => (blip('click'), scrollToId('export'))}
              className="glass inline-flex h-12 items-center rounded-full px-6 font-medium transition-colors hover:bg-panel"
            >
              Start a project
            </button>
          </div>
        </motion.div>
      </div>

      <button
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? 'Play background video' : 'Pause background video'}
        className="glass absolute right-4 top-20 z-30 grid size-11 place-items-center rounded-full text-dim transition-colors hover:text-ink sm:right-6"
      >
        {paused ? <Icon.play className="size-3.5" /> : <Icon.pause className="size-3.5" />}
      </button>
    </section>
  )
}
