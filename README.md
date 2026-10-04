# Mayank Paliwal — Portfolio

## 1. Put the files in
Every photo and video goes into `public/media/`. Each folder has a README.txt
with the exact file names and sizes it expects.

```
public/media/
  reel/          showreel.mp4, showreel-poster.jpg
  hero/          hero-loop.mp4, hero-poster.jpg
  portrait/      mayank.jpg
  projects/
    daud/        ep01.jpg, ep01-preview.mp4 ... ep06
    raj-shamani/ rs-01.jpg, rs-01-preview.mp4 ...
    beerbiceps/  bb-01.jpg, bb-01-preview.mp4 ...
    freelance/   fl-01.jpg, fl-01-preview.mp4 ...
  stills/        still-01.jpg ...
  before-after/  before.jpg, after.jpg
  logos/         (only if allowed)
```

YouTube videos only need their link in `src/content/site.ts` — the thumbnail is
fetched from YouTube automatically. Self-hosted videos (like the Daud episodes)
should be compressed to ~720p first; the raw originals stay in `Resume Videos/`,
which is not uploaded to GitHub.

## 2. Fill in the text
Open `src/content/site.ts` and replace every `TODO`.
To add a project, add a line to `projects` and drop matching files
(`<id>.jpg` and `<id>-preview.mp4`) into that client's folder.

## 3. Check what's missing
Needs Node.js 18+ (https://nodejs.org).

```
npm install
npm run dev
```

Open the link it prints (usually http://localhost:5173) to see the site.
Until real files are added, every photo and video shows a hosted sample.
Drop a real file into `public/media/` with the right name and it replaces the
sample automatically.

Open http://localhost:5173/?checklist to see which files and TODO text are
still missing.

## 4. Deploy
Push to GitHub and import the repo in Vercel (framework preset: Vite).
Build command `npm run build`, output folder `dist`.

## Credits
3D character: "Business Man" from the Ultimate Modular Men Pack by Quaternius —
public domain (CC0), https://poly.pizza/m/JFrLIKqvCH. File: `public/models/editor.glb`.
All other 3D scenes are built in code (`src/scene/`).
