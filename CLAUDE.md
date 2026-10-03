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

## Concept (redesign, 2026-10-03): four-page 3D portfolio
Theme and page flow follow github.com/Yashchauhan008/portfolio-3d, but every 3D
scene is our own, built from primitives in code. That repo's models were bought on a
marketplace and are NOT licensed to us — never copy its models/textures/code.

One fixed R3F canvas (src/scene/Scene.tsx) holds three scenes side by side;
scrolling flies the camera between them and fades the background colour.
1. Home (#home) — cream #F5EFE6. "Hi, my name is Mayank." + Get in touch / Watch reel.
   Scene: clay editor typing at a desk, monitors show a live timeline + a real frame.
2. About (#about) — lab blue #0B3D91, Electrolize HUD panels (profile, skills,
   tools, about, experience). Scene: hologram character in a glass tube with
   floating app logos (from profile.tools), bubbles, waveform monitor.
3. Projects (#work) — opaque cream page with the Premiere "Project:
   Mayank_Paliwal.prproj" bins panel (fan of up to 7 + full clip list).
   While it covers the screen the camera cuts to the contact scene.
4. Contact (#contact) — same layout as the reference contact page (white card,
   grey fields, socials, orange Submit → opens mailto). Scene: character on
   parcel boxes with floating envelopes. Footer.

Loader: clapperboard logo + "rendering" timeline (clips land, waveform, playhead).
Logo: clapperboard with play button (src/components/Logo.tsx) — NOT the reference's cube.
Nav: grey sound toggle + orange menu button → white slide-in menu.

## Visual system
Poppins (UI), Electrolize (lab HUD), JetBrains Mono (bins panel only).
Navy #091434 text, slate #7c8594, orange #ff923e accent, white cards.
Client colours (bins only): Raj = mango, BeerBiceps = rose, Daud = teal, Freelance = lavender.

## Stack
React + Vite + TypeScript + Tailwind v4. React Three Fiber + drei (deep imports
only, e.g. @react-three/drei/core/RoundedBox) in a lazy chunk. Framer Motion for
UI animation. Lenis smooth scroll. No GSAP.
Deploy target: Vercel.

## Media
- Raj Shamani projects = YouTube links; thumbnails come from i.ytimg.com.
- Daud EP01–06 self-hosted in public/media/projects/daud (720p ~5–10 MB each,
  4s previews, thumbnails). Raw originals in "Resume Videos/" (git-ignored).
- No showreel yet: "Watch reel" plays Daud EP01 until /media/reel/showreel.mp4 exists.
- BeerBiceps + Freelance bins hold one placeholder card each (placeholder: true).

## Performance + accessibility floor
Respect prefers-reduced-motion (no idle animation, instant loader). Keyboard focus
visible. Responsive down to 360px; scene sits below text on phones.

## Open items to ask Rishabh about
- What he did at BeerBiceps
- 2–3 freelance client/project types for 2021–2025
- BeerBiceps video links; real skill levels; confirm tool list
- Any testimonials; a proper 60–90s showreel
