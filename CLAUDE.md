# Project brief: Mayank Paliwal portfolio

Local folder: `C:\Users\risha\Desktop\Mayank Paliwal`
Owner of this build: Rishabh (building it for Mayank Paliwal).

## Who it's for
Mayank Paliwal — Video Editor · Filmmaker · Storyteller. 5+ years (since 2021).
Audience: production leads at large creator channels, mostly opening the link on a
phone from Instagram. The reel must be playable within one tap and ~3 seconds.
Every effect must either show the work faster or say something about how he edits.

## Experience (source of truth: src/content/site.ts)
- Raj Shamani — Video Editor, Sep 2025 – Present. DO NOT change dates/wording without asking.
- BeerBiceps — Video Editor, Feb 2025 – May 2025. DO NOT change dates/wording without asking.
- Freelance — Video Editor, 2021 – Jan 2025 (continuous).
  - Highlight inside freelance: Daud BTS series (2024), 6 episodes for
    @arpitjainn__ — 500K+ Instagram views, 2,500 followers in 3 days.

Contact: mayankpaliwalbusiness@gmail.com · +91 7014286214 ·
instagram.com/mayankpaliwaal

## Concept: "The Edit — Sequence 01"
The site is a Premiere Pro sequence. Scroll = playhead. Sections = clips.
Folders = bins. Contact = Export dialog.

Sections, in order (each transition is a named edit transition):
0. Render bay loader — 3D edit monitor renders, camera dollies into the Program
   Monitor which becomes the hero video. Max 2.5s, skip button, first visit only,
   2D fallback on mobile. (Dolly in)
1. Hero — fullscreen muted loop, letterbox 2.39:1 bars open on scroll, name in
   Instrument Serif, "Watch reel (90s)" opens full reel with sound. J/K/L +
   space scrub the reel. (Letterbox open)
2. Proof strip — film-strip marquee: Raj Shamani · BeerBiceps · Daud; counters
   roll like timecode. (Hard cut)
3. Selected work — grid starts desaturated like LOG footage; cursor spotlight
   "grades" it to colour; 3s muted preview on hover. (Match cut)
4. Bins — folder-fan component per client; DAUD_BTS fans out EP01–EP06.
   (Cross dissolve)
5. Timeline — pinned horizontal scroll, career as coloured clips on V1,
   playhead follows scroll, click a clip to flip-card details. Vertical on mobile.
   (Whip pan)
6. Before / after — razor-line drag slider (only with client permission). (J-cut)
7. Stills — contact sheet with loupe cursor, lightbox. Only if photos are strong.
   (Dip to black)
8. Export — contact as Premiere's Export dialog; mailto + wa.me links. (Fade out)
9. End credits footer, fade to black.

Global: persistent mini-timeline docked at bottom (clickable nav + playhead),
timecode counter top-right, tool cursors (arrow / razor / hand, desktop only),
UI sounds OFF by default behind a track "M" toggle, ~3% film grain.

## Visual system
- Base: Premiere-style panel greys (not pure black) — page ~#1c1c1f, panels
  ~#26262a, hairlines ~#35353b, text warm off-white ~#ecebe8.
- Single accent: Premiere's blue playhead. No second accent.
- Clip label colours ONLY as client codes, used consistently everywhere:
  Raj Shamani = mango, BeerBiceps = rose, Daud = caribbean/teal,
  Freelance = lavender.
- Type: Instrument Serif (display), Inter 400/500 (body), a mono face for
  timecode and clip names only.
- Liquid-glass nav/buttons are fine; keep restraint — one memorable moment,
  everything else quiet.

## Stack
React + Vite + TypeScript + Tailwind v4 (+ shadcn/ui where useful).
GSAP (ScrollTrigger — scroll pinning/scrubbing only) + Lenis. Framer Motion for
component animation (modals, fans, flips, hovers) — Rishabh asked for it 2026-09-29.
React Three Fiber + drei for the loader only, lazy-loaded.
Full-length videos = YouTube embeds behind click-to-load facades. Only the reel,
hero loop and 3–5s previews are self-hosted from public/media.
Deploy target: Vercel.

## Performance + accessibility floor
Hero playable in ~2s on 4G. Respect prefers-reduced-motion (skip loader, no
scrub). Keyboard focus visible. Responsive down to 360px.

## Current state
- Full site built (2026-09-29). Sections live in src/components/, order in src/App.tsx,
  section/transition names in src/content/sequence.ts.
- All media currently falls back to hosted SAMPLE clips/photos (src/content/samples.ts).
  Dropping a real file into public/media/** replaces its sample automatically.
- Asset checklist moved to /?checklist (src/dev/Checklist.tsx).
- Section switches in site.ts: beforeAfter.enabled, showStills.
- UX rules applied from the ui-ux-pro-max skill (~/.claude/skills/ui-ux-pro-max);
  its colour/font suggestions were NOT used — this brief's visual system wins.

## Open items to ask Rishabh about
- What Mayank edits for Raj Shamani (long-form / shorts / which episodes)
- What he did at BeerBiceps
- 2–3 freelance client/project types for 2021–2025
- Permission for before/after raw footage; any testimonials
