import { AnimatePresence, motion } from 'framer-motion'
import { useState, type FormEvent, type ReactNode } from 'react'
import { profile } from '../content/site'
import { blip } from '../lib/sound'
import { cx } from '../lib/util'
import { Social, whatsappLink } from './Social'
import { SectionHead } from './ui'

type Field = 'name' | 'email' | 'message'
const errors: Record<Field, string> = {
  name: 'Please enter your name.',
  email: 'Please enter a valid email address.',
  message: 'Please enter your message.',
}

/**
 * Same layout as the reference contact page. There's no mail server, so
 * "Submit" opens the visitor's email app with the message filled in.
 */
export default function Contact() {
  const [v, setV] = useState({ name: '', email: '', message: '' })
  const [bad, setBad] = useState<Partial<Record<Field, boolean>>>({})
  const [sent, setSent] = useState(false)

  const check = (f: Field, val: string) =>
    f === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) : val.trim().length > 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const b = { name: !check('name', v.name), email: !check('email', v.email), message: !check('message', v.message) }
    setBad(b)
    if (b.name || b.email || b.message) {
      blip('razor')
      document.getElementById(`c-${(Object.keys(b) as Field[]).find((k) => b[k])}`)?.focus()
      return
    }
    blip('click')
    const body = `${v.message}\n\n— ${v.name} (${v.email})`
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(`Hello from ${v.name}`)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative flex min-h-full flex-col pt-24">
      <div className="content-width flex-1">
        <div className="w-full max-w-[580px] md:max-w-[45%]">
          <SectionHead kicker="Say hello 👋" title={<span id="contact-title">Contact me</span>} className="!mb-0" />

          <motion.div
            className="mt-6 rounded-[20px] bg-white p-2.5 md:mt-8 shadow-[0_30px_70px_-40px_rgba(9,20,52,.35)]"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.1, 1] }}
          >
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="done"
                  className="flex min-h-[380px] flex-col items-center justify-center gap-4 p-6 text-center md:h-[clamp(360px,calc(100svh-370px),540px)]"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <svg viewBox="0 0 120 120" className="h-20" aria-hidden>
                    <motion.polyline points="10,70 40,100 115,20" fill="none" stroke="#A1CC4D" strokeWidth="15" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
                  </svg>
                  <h3 className="text-xl font-semibold">Your mail app should be opening</h3>
                  <p className="max-w-xs text-slate">
                    If it didn’t, write to <a className="font-medium text-navy underline" href={`mailto:${profile.email}`}>{profile.email}</a> or message on{' '}
                    <a className="font-medium text-navy underline" href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a>.
                  </p>
                  <button onClick={() => setSent(false)} className="btn-orange mt-2 px-9 py-2.5">Back</button>
                </motion.div>
              ) : (
                <motion.form key="form" noValidate onSubmit={submit} className="flex min-h-[400px] flex-col md:h-[clamp(360px,calc(100svh-370px),540px)] md:min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Input id="name" label="Name" bad={bad.name} className="mb-5">
                    <input id="c-name" value={v.name} autoComplete="name" onChange={(e) => setV({ ...v, name: e.target.value })} aria-invalid={bad.name} aria-describedby={bad.name ? 'e-name' : undefined} className={field} />
                  </Input>
                  <Input id="email" label="Email" bad={bad.email} className="mb-5">
                    <input id="c-email" type="email" value={v.email} autoComplete="email" onChange={(e) => setV({ ...v, email: e.target.value })} aria-invalid={bad.email} aria-describedby={bad.email ? 'e-email' : undefined} className={field} />
                  </Input>
                  <Input id="message" label="Message" bad={bad.message} className="min-h-0 flex-1">
                    <textarea id="c-message" value={v.message} rows={6} onChange={(e) => setV({ ...v, message: e.target.value })} aria-invalid={bad.message} aria-describedby={bad.message ? 'e-message' : undefined} className={cx(field, 'h-full min-h-[56px] resize-none')} />
                  </Input>
                  <div className="mt-5 flex items-center">
                    <Social size={24} className="gap-0" />
                    <button type="submit" className="btn-orange ml-auto px-9 py-2.5 text-base">Submit</button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      {/* phones: room for the parcel scene under the form */}
      <div aria-hidden className="h-[46svh] shrink-0 md:hidden" />
      <Footer />
    </section>
  )
}

const field = 'w-full border-0 bg-transparent text-[1.1rem] font-medium text-[#111029] outline-none focus:outline-none'

function Input({ id, label, bad, className, children }: { id: Field; label: string; bad?: boolean; className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        'flex flex-col rounded-[13px] border-2 py-[7px] pl-[15px] pr-[7px] transition-colors focus-within:border-[#c7c7c7]',
        bad ? 'border-[#f0caca] bg-[#ffdbdb]' : 'border-field bg-field',
        className,
      )}
    >
      <div className="flex text-[0.8rem] font-medium">
        <label htmlFor={`c-${id}`} className="mr-2.5 text-[#acacac]">{label} :</label>
        {bad && <span id={`e-${id}`} className="text-[#d85454]">{errors[id]}</span>}
      </div>
      {children}
    </div>
  )
}

function Footer() {
  return (
    <footer className="relative z-10 mt-auto flex flex-col items-center gap-0.5 pb-4 pt-4 text-[0.85rem] text-slate">
      <span>© {new Date().getFullYear()} {profile.name}</span>
      <span>
        <a href={`mailto:${profile.email}`} className="hover:underline">{profile.email}</a> · <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="hover:underline">{profile.phone}</a>
      </span>
    </footer>
  )
}
