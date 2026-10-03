import { profile } from '../content/site'
import { cx } from '../lib/util'

const wa = `https://wa.me/${profile.phone.replace(/\D/g, '')}`

const links = [
  {
    label: 'Instagram',
    href: profile.instagram,
    icon: (
      <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.2-1.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="currentColor" fillRule="evenodd" />
    ),
  },
  {
    label: 'Email',
    href: `mailto:${profile.email}`,
    icon: <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5zm2.2.2L12 12l6.8-5.3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinejoin="round" />,
  },
  {
    label: 'WhatsApp',
    href: wa,
    icon: (
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3zm-3.1 4.8c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5a7 7 0 0 0 3.4 3c.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.4 0 .5-.2 1.3-.9 1.7-.6.4-1.6.6-3.6-.3a10 10 0 0 1-4.2-3.9c-.7-1.2-.8-2.3-.4-3.1.3-.6.7-1 .9-1.1z" fill="currentColor" />
    ),
  },
  {
    label: 'YouTube (Raj Shamani)',
    href: 'https://www.youtube.com/@rajshamani',
    icon: <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z" fill="currentColor" />,
  },
]

export function Social({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div className={cx('flex items-center gap-2', className)}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.href.startsWith('mailto') ? undefined : '_blank'}
          rel="noreferrer"
          aria-label={l.label}
          className="grid size-11 place-items-center rounded-xl text-[#b9bcc4] transition-[color,transform] hover:scale-110 hover:text-orange"
        >
          <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>{l.icon}</svg>
        </a>
      ))}
    </div>
  )
}

export const whatsappLink = wa
