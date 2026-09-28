import { motion } from 'framer-motion'
import { experience, profile } from '../content/site'
import { scrollToId } from '../lib/scroll'
import { tbc } from '../lib/util'

/** End credits: a short roll, then fade to black. */
export default function Credits() {
  const tools = profile.tools.map((t) => tbc(t)).filter(Boolean)
  const rows: [string, string][] = [
    ['Edited by', profile.name],
    ...experience.filter((e) => !('partOf' in e)).map((e) => [e.period, e.title] as [string, string]),
    ...(tools.length ? [['Tools', tools.join(' · ')] as [string, string]] : []),
    ['Contact', profile.email],
  ]

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-page via-[#0c0c0d] to-black pb-[calc(var(--dock)+48px)] pt-24 text-center">
      <motion.div
        className="section-pad mx-auto max-w-xl space-y-5"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 1.2, ease: [0.2, 0.7, 0.1, 1] }}
      >
        {rows.map(([k, v]) => (
          <div key={k + v}>
            <p className="mono text-[11px] uppercase text-faint">{k}</p>
            <p className="display text-2xl sm:text-3xl">{v}</p>
          </div>
        ))}
      </motion.div>

      <motion.p
        className="display mt-24 text-[clamp(3rem,12vw,9rem)] text-ink/90"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2 }}
      >
        <em>Fin.</em>
      </motion.p>

      <div className="section-pad mono mt-16 flex flex-col items-center justify-between gap-3 text-xs text-faint sm:flex-row">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <button onClick={() => scrollToId('hero')} className="h-11 hover:text-ink">Back to 00:00:00:00 ↑</button>
      </div>
    </footer>
  )
}
