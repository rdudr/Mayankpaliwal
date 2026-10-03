import { useEffect, useState } from 'react'
import { profile, projects, experience } from '../content/site'

type Slot = { group: string; label: string; path: string }

const slots: Slot[] = [
  { group: 'Reel', label: 'Showreel (60–90s, with sound)', path: profile.showreel },
  { group: 'Reel', label: 'Showreel poster', path: profile.showreelPoster },
  ...projects
    .filter((p) => !p.link?.includes('youtu'))
    .flatMap((p) => [
      { group: `Projects · ${p.client}`, label: `${p.title} — thumbnail`, path: `/media/projects/${p.client}/${p.id}.jpg` },
      { group: `Projects · ${p.client}`, label: `${p.title} — preview`, path: `/media/projects/${p.client}/${p.id}-preview.mp4` },
    ]),
]

async function exists(path: string) {
  try {
    const r = await fetch(path, { method: 'HEAD' })
    const type = r.headers.get('content-type') ?? ''
    return r.ok && !type.includes('text/html')
  } catch {
    return false
  }
}

export default function Checklist() {
  const [found, setFound] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all(slots.map(async (s) => [s.path, await exists(s.path)] as const)).then((r) =>
      setFound(Object.fromEntries(r)),
    )
  }, [])

  const todos = [
    ...Object.entries(profile).filter(([, v]) => typeof v === 'string' && v.includes('TODO')).map(([k]) => `profile.${k}`),
    ...experience.filter((e) => JSON.stringify(e).includes('TODO')).map((e) => `experience: ${e.title}`),
    ...projects.filter((p) => p.placeholder).map((p) => `placeholder project: ${p.id}`),
  ]

  const done = slots.filter((s) => found[s.path]).length
  const groups = [...new Set(slots.map((s) => s.group))]

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Asset checklist</h1>
      <p className="mt-2 text-neutral-400">
        {done} of {slots.length} files in place. Drop files into <code>public/media</code> and refresh.
      </p>

      {groups.map((g) => (
        <section key={g} className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-neutral-400">{g}</h2>
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {slots.filter((s) => s.group === g).map((s) => (
              <li key={s.path} className="flex items-center justify-between gap-4 px-4 py-2 text-sm">
                <span>{s.label}</span>
                <span className={found[s.path] ? 'text-emerald-400' : 'text-neutral-500'}>
                  {found[s.path] ? 'Found' : s.path}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-10">
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Text still to fill in src/content/site.ts</h2>
        {todos.length === 0 ? (
          <p className="text-emerald-400">All text filled.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm text-amber-300">{todos.map((t) => <li key={t}>{t}</li>)}</ul>
        )}
      </section>
    </main>
  )
}
