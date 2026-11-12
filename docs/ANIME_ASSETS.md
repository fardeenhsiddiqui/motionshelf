# Anime section: asset research and licensing

Researched 2026-11-12. Licence terms change, so **re-read the licence at the source before adding any third-party
asset**, and record the check date in `src/data/assets.json` (the validator requires it).

## Decision

The first three anime items are **original work drawn in code**, with **no third-party assets at all**:

| Item | What it is | How it is made |
|---|---|---|
| Sakura Dusk | Painted-style dusk scene with a scroll-driven day-to-night change | Inline SVG layers and CSS |
| Neon Rain | Rainy night city, neon signs, passing train, wet street | Inline SVG, CSS and two seamless rain tiles |
| Impact Frames | Speed lines, halftone, impact burst, focus lines | CSS only |

Consequences:

- Nothing to attribute, nothing to renew, nothing that can be withdrawn by a third party.
- No fonts are loaded. Pages use the system font stack (`Impact` and `Arial Black` where available for the manga
  look, with `Arial` as fallback), so there is no font licence to ship.
- Items carry the MIT licence like the existing templates, with `originalIp: true` and `aiGenerated: true`. The code
  and drawings were produced with AI assistance and are described that way in each licence record.
- "Anime-style" describes a look. No existing character, series, studio or logo is imitated or named.

## Options considered

| Source or approach | Redistribution and commercial use | Verdict |
|---|---|---|
| **Original SVG, CSS and canvas art** (used) | Ours to license | Use. Smallest, fastest, fully cleared. |
| **three.js `MeshToonMaterial`** (cel shading) | three.js is MIT | Possible later for a 3D toon scene. Needs an original model. |
| **System font stack** (used) | Nothing is shipped | Use. |
| **SIL OFL fonts** (for example Noto Sans JP, M PLUS Rounded 1c, Zen Maru Gothic) | OFL allows bundling, redistribution and commercial use if the licence text travels with the font and the font is not sold on its own | Allowed, but not needed yet. If added: ship the OFL text, register each font in `assets.json` as type `font`, and check the exact licence on the font's own page. |
| **Kenney and other CC0 packs** | CC0 allows any use | Safe, but they are not anime-style. Possible for generic UI sounds or shapes. |
| **VRoid Studio models and VRoid Hub models** | Each model has its own author-set conditions. Models and sample content are often not allowed to be redistributed as files | Do not use. Terms are per model and often restrict redistribution. |
| **Live2D sample models** | Sample data is licensed for use in your own app, with limits on redistributing the model files themselves | Do not use. MotionShelf hands out the files, so redistribution is the point. |
| **Fan art, screenshots, wallpapers, "free anime PNG" sites** | The rights belong to artists or studios. Many sites list work without permission | Never use. Highest risk of takedown. |
| **AI image generators** | Outputs can resemble existing characters and styles; terms and copyright position vary by tool and country | Not used. If ever used, record the tool, terms version and prompt, and check for resemblance to existing work. |
| **Marketplace packs** (itch.io, BOOTH, Unity or Unreal stores) | A licence per pack; many forbid redistribution of source files | Only after reading each licence. Redistribution as downloadable files usually fails. |

## Rules for adding a third-party anime asset

1. Find the licence text at the original source, not a mirror. Save the URL and the date checked.
2. It must allow **commercial use, modification and redistribution of the file itself** (MotionShelf lets people
   download the files). "Free to use in your project" is not enough.
3. It must not depict an existing character, series, studio, brand or real person's likeness.
4. Copy the licence text into `public/assets/...` and register the asset in `src/data/assets.json` with every
   required field. Mark it `clearance: "cleared"` only when rules 1 to 3 hold. Anything else is `dev-only`, and
   `npm run build:release` fails while a `dev-only` asset is registered.
5. Show the exact credit line where the asset appears if the licence requires attribution.
6. Prefer assets that are small and can be drawn by the browser (SVG, CSS) over large raster files.

## Implementation notes

- Anime items use the existing catalog architecture: a section (`anime`) with its own categories
  (`backgrounds`, `effects`, `characters`), items in `src/data/catalog.json`, files in `public/previews/<id>/`, and the
  same validation, prerendering, sitemap, license box and download flow as templates.
- Categories now belong to a section (`category.section`). The gallery shows only the categories of the section you
  are viewing, and the validator rejects an item whose category belongs to another section.
- **Characters** has no items yet and shows as "Coming soon". A believable original character is a bigger drawing job
  than a background or an effect, so it was left out rather than shipped weak.
- Scenes follow the same performance rules as the templates: loops pause while off screen, rain and petals use
  compositor-only transforms, one number (`--p`) drives the whole scroll scene, and `prefers-reduced-motion` gives a
  still frame.
