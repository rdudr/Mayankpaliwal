import { motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { experience, profile, skills } from '../content/site'
import { useReducedMotion } from '../lib/hooks'
import { clientMeta, tbc } from '../lib/util'

/** Clipped-corner HUD panel with an optional tab label, like a sci-fi readout. */
function Panel({ tab, children, delay = 0 }: { tab?: string; children: ReactNode; delay?: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className="relative"
      initial={reduced ? false : { opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.1, 1] }}
    >
      {tab && (
        <div className="hud-tab relative z-10 -mb-[2px] inline-block bg-holo-line p-[2px] pb-0">
          <div className="hud-tab bg-[#0d3a86] px-10 py-1.5 text-lg tracking-wider text-holo sm:px-14">{tab}</div>
        </div>
      )}
      <div className="hud-frame">
        <div className="hud-inner">{children}</div>
      </div>
    </motion.div>
  )
}

function Avatar() {
  return (
    <svg viewBox="0 0 120 120" className="size-full" aria-hidden>
      <defs>
        <radialGradient id="av-bg" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#1e6fd8" />
          <stop offset="1" stopColor="#0b3d91" />
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="url(#av-bg)" />
      <path d="M22 120c2-22 18-32 38-32s36 10 38 32z" fill="#4a4a54" />
      <rect x="53" y="76" width="14" height="14" rx="5" fill="#eebd93" />
      <circle cx="60" cy="54" r="30" fill="#f3c9a0" />
      <ellipse cx="30" cy="57" rx="5" ry="8" fill="#eebd93" />
      <ellipse cx="90" cy="57" rx="5" ry="8" fill="#eebd93" />
      <path d="M29 52c-2-20 12-31 31-31 20 0 34 10 31 30-6-9-14-14-24-15-10 5-24 6-38 16z" fill="#7a5134" />
      <ellipse cx="49" cy="58" rx="4" ry="5.5" fill="#1a1a22" />
      <ellipse cx="71" cy="58" rx="4" ry="5.5" fill="#1a1a22" />
      <path d="M53 70q7 5 14 0" stroke="#b5785a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** His photo, with a faint HUD scanline tint; falls back to the drawn avatar if missing. */
function Portrait() {
  const [failed, setFailed] = useState(false)
  if (failed) return <Avatar />
  return (
    <div className="relative size-full">
      <img
        src={profile.portrait}
        alt={profile.name}
        onError={() => setFailed(true)}
        decoding="async"
        className="size-full object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b3d91]/55 via-transparent to-transparent mix-blend-multiply"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(52,191,255,.35) 0 1px, transparent 1px 4px)' }}
      />
    </div>
  )
}

export default function About() {
  const reduced = useReducedMotion()
  return (
    <section id="about" aria-labelledby="about-title" className="hud relative min-h-full pb-16 pt-[52svh] text-holo md:pt-28">
      <h2 id="about-title" className="sr-only">About {profile.name}</h2>
      <div className="content-width">
        <div className="flex w-full flex-col gap-6 md:max-w-[min(600px,46%)]">
          {/* Profile */}
          <motion.div
            className="flex items-stretch"
            initial={reduced ? false : { opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="hud-frame size-32 shrink-0 sm:size-40">
              <div className="hud-inner size-full overflow-hidden">
                <Portrait />
              </div>
            </div>
            <div className="hud-frame -ml-[2px] mt-auto min-w-0 flex-1 [--cut:14px]">
              <dl className="hud-inner grid grid-cols-[1.5fr_1fr_1fr] gap-3 px-4 py-4 sm:px-5">
                {[
                  ['Name', profile.firstName],
                  ['Since', String(profile.since)],
                  ['From', profile.from],
                ].map(([k, v]) => (
                  <div key={k} className="min-w-0">
                    <dt className="text-xs text-holo/80">{k} :</dt>
                    <dd className="truncate text-lg text-white sm:text-xl">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>

          <Panel tab="SKILLS">
            <ul className="py-3">
              {skills.map((s, i) => (
                <li key={s.name} className={`flex items-center gap-4 px-5 py-2 sm:px-6 ${i % 2 ? '' : 'bg-[#2d88dd18]'}`}>
                  <span className="w-[45%] shrink-0 text-[15px] text-holo sm:text-base">{s.name}</span>
                  <span className="h-[11px] flex-1 bg-[#00b7ff33]">
                    <motion.span
                      className="block h-full bg-gradient-to-r from-[#2d88dd] to-holo"
                      initial={reduced ? { width: `${s.level}%` } : { width: '0%' }}
                      whileInView={{ width: `${s.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel tab="TOOLS">
            <ul className="flex flex-wrap gap-2 p-5 sm:p-6">
              {profile.tools.map((t) => (
                <li key={t} className="border border-holo/40 bg-[#2d88dd22] px-3 py-1 text-sm text-white">{t}</li>
              ))}
            </ul>
          </Panel>

          <Panel tab="ABOUT">
            <p className="p-5 text-base leading-relaxed text-[#bfe8ff] sm:p-6">{profile.about}</p>
          </Panel>

          <Panel tab="EXPERIENCE">
            <ol className="divide-y divide-holo/15">
              {experience.map((e) => (
                <li key={e.title} className={`flex gap-4 px-5 py-4 sm:px-6 ${'partOf' in e ? 'pl-10 sm:pl-12' : ''}`}>
                  <span className="mt-1.5 size-3 shrink-0 rounded-[3px]" style={{ background: clientMeta[e.client].color }} aria-hidden />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-3 text-white">
                      <span className="text-lg">{e.title}</span>
                      <span className="text-sm text-holo">{e.period}</span>
                    </p>
                    <p className="text-sm text-holo/80">{e.role}</p>
                    {tbc(e.summary.split('TODO')[0].trim()) && (
                      <p className="mt-1 text-sm leading-relaxed text-[#bfe8ff]/90">{e.summary.split('TODO')[0].trim()}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </section>
  )
}
