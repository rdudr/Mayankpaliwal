import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { profile } from '../content/site'
import { blip } from '../lib/sound'
import { cx } from '../lib/util'
import { Icon, SectionHead } from './ui'

const formats = ['Long-form episode', 'Shorts / Reels', 'Documentary / BTS', 'Brand film', 'Something else']

/** Contact as Premiere's Export Settings dialog. Nothing is sent from the site —
 *  "Export" opens the visitor's own mail app, "Queue" opens WhatsApp. */
export default function Export() {
  const [name, setName] = useState('')
  const [format, setFormat] = useState(formats[0])
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const body = `Hi Mayank,\n\n${msg || 'I’d like to talk about a project.'}\n\nFormat: ${format}\n— ${name || 'A visitor'}`
  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(`Project enquiry — ${format}`)}&body=${encodeURIComponent(body)}`
  const wa = `https://wa.me/${profile.phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`

  const submit = (e: FormEvent) => {
    e.preventDefault()
    blip('click')
    window.location.href = mailto
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      blip('tick')
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  return (
    <section id="export" aria-labelledby="export-title" className="section-pad mx-auto max-w-[1200px] py-20 md:py-32">
      <SectionHead id="export" title={<span id="export-title">Ready to <em>export?</em></span>} intro="Tell him about the project. Export opens your email app; Queue opens WhatsApp." />

      <motion.form
        onSubmit={submit}
        className="overflow-hidden rounded-xl border border-line bg-panel shadow-[0_30px_80px_-30px_rgba(0,0,0,.8)]"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-line bg-panel-2 px-4 py-2.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" aria-hidden />
          <span className="size-3 rounded-full bg-[#febc2e]" aria-hidden />
          <span className="size-3 rounded-full bg-[#28c840]" aria-hidden />
          <span className="mono ml-3 text-xs text-dim">Export Settings</span>
        </div>

        <div className="grid md:grid-cols-[1.1fr_1fr]">
          {/* Settings */}
          <div className="space-y-5 p-5 sm:p-7">
            <Field label="Your name" htmlFor="x-name">
              <input id="x-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Name, channel or brand" className={input} />
            </Field>

            <fieldset>
              <legend className="mono mb-2 text-xs text-dim">Format</legend>
              <div className="flex flex-wrap gap-2">
                {formats.map((f) => (
                  <label key={f} className={cx('mono inline-flex h-10 items-center rounded-full border px-3.5 text-xs transition-colors', f === format ? 'border-accent bg-accent/15 text-ink' : 'border-line text-dim hover:text-ink')}>
                    <input type="radio" name="format" value={f} checked={f === format} onChange={() => (blip('tick'), setFormat(f))} className="sr-only" />
                    {f}
                  </label>
                ))}
              </div>
            </fieldset>

            <Field label="Brief" htmlFor="x-msg" hint="Footage length, deadline, reference videos — whatever you have.">
              <textarea id="x-msg" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} className={cx(input, 'h-auto resize-y py-3')} />
            </Field>
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-5 border-t border-line bg-[#212125] p-5 sm:p-7 md:border-l md:border-t-0">
            <div>
              <p className="mono mb-3 text-xs text-dim">Summary</p>
              <dl className="mono space-y-1.5 text-xs">
                {[
                  ['Output', profile.email],
                  ['Phone', profile.phone],
                  ['Source', name || '—'],
                  ['Format', format],
                  ['Editor', profile.name],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[70px_1fr] gap-2">
                    <dt className="text-faint">{k}:</dt>
                    <dd className="break-all text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={copy} className="mono h-10 rounded-full border border-line px-3.5 text-xs text-dim transition-colors hover:text-ink">
                {copied ? 'Copied ✓' : 'Copy email'}
              </button>
              <a href={profile.instagram} target="_blank" rel="noreferrer" className="mono inline-flex h-10 items-center gap-1.5 rounded-full border border-line px-3.5 text-xs text-dim transition-colors hover:text-ink">
                Instagram <Icon.external className="size-3" />
              </a>
            </div>

            <div className="mt-auto flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <a href={wa} target="_blank" rel="noreferrer" onClick={() => blip('click')} className="inline-flex h-12 items-center justify-center rounded-lg border border-line px-6 transition-colors hover:border-ink">
                Queue <span className="mono ml-2 text-xs text-dim">WhatsApp</span>
              </a>
              <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-7 font-medium text-white transition-transform hover:scale-[1.02] active:scale-[0.98]">
                Export <Icon.arrow className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.form>
    </section>
  )
}

const input = 'h-12 w-full rounded-lg border border-line bg-page px-3.5 text-ink placeholder:text-faint focus:border-accent focus:outline-none'

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mono mb-2 block text-xs text-dim">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  )
}
