import { motion } from 'framer-motion'
import { profile } from '../content/site'
import { useReducedMotion } from '../lib/hooks'
import { scrollToId } from '../lib/smooth'
import { blip } from '../lib/sound'
import { useReel } from './Reel'
import { Icon } from './ui'

export default function Home({ ready }: { ready: boolean }) {
  const reduced = useReducedMotion()
  const reel = useReel()
  const rise = (d: number) => ({
    initial: reduced ? false : { opacity: 0, y: 40 },
    animate: ready ? { opacity: 1, y: 0 } : {},
    transition: { delay: d, duration: 0.7, ease: [0.2, 0.7, 0.1, 1] },
  })

  return (
    <section id="home" aria-label="Introduction" className="relative h-[100svh] min-h-[600px]">
      {/* Mobile: soft cream behind the text, scene shows below (like the reference) */}
      <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-cream via-cream/80 to-transparent md:hidden" aria-hidden />
      <div className="content-width relative flex h-full flex-col justify-start pt-[18svh] md:justify-center md:pt-0">
        <div className="max-w-[560px] md:max-w-[45%]">
          <h1 className="text-[clamp(2.6rem,6.2vw,4.4rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-navy">
            <motion.span className="block" {...rise(0.1)}>Hi, my name</motion.span>
            <motion.span className="block" {...rise(0.2)}>
              is {profile.firstName}.
            </motion.span>
          </h1>
          <motion.p className="mt-4 text-[1.05rem] text-slate sm:text-lg" {...rise(0.32)}>
            {profile.oneLiner}
          </motion.p>
          <motion.p className="mt-1 text-sm font-medium text-slate/80" {...rise(0.38)}>
            {profile.roles.join(' · ')}
          </motion.p>
          <motion.div className="mt-10 flex flex-wrap items-center gap-4" {...rise(0.46)}>
            <button onClick={() => (blip('click'), scrollToId('contact'))} className="btn-orange h-14 px-9 text-[1.05rem]">
              Get in touch
            </button>
            <button
              onClick={reel.open}
              className="group inline-flex h-14 items-center gap-3 rounded-[13px] px-2 font-semibold text-navy"
            >
              <span className="grid size-11 place-items-center rounded-full bg-navy text-white transition-transform group-hover:scale-110">
                <Icon.play className="ml-0.5 size-4" />
              </span>
              Watch reel
            </button>
          </motion.div>
        </div>
      </div>

      <motion.button
        onClick={() => scrollToId('about')}
        aria-label="Scroll to about"
        className="absolute bottom-8 left-1/2 hidden h-11 w-7 -translate-x-1/2 justify-center rounded-full border-2 border-navy/40 pt-2 md:flex"
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1 }}
      >
        <motion.span
          className="block h-2 w-1 rounded-full bg-navy/60"
          animate={reduced ? {} : { y: [0, 10, 0], opacity: [1, 0.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
      </motion.button>
    </section>
  )
}
