# Roadmap

Written 2026-11-19 from what the testing in `AUDIT.md` sections 13 to 15 actually found. No new templates are proposed
yet: the evidence points at finishing and hardening the four automotive templates and the three anime items first.
Each item says why, and what would show it is done.

## P0: do next

1. **Vortex GT loads a 1.8 MB model on phones without being asked.**
   Evidence: the hero fetches `car-concept.glb` as soon as WebGL is available, on any device. The checklist says
   assets over 1 MB must be lazy and opt-in on phones and data saver, and that no 3D loads that the visitor has not
   asked for. The measured cost is real even after the 30 fps change (about 11 % of the GPU's 3D engine and 30 % of a
   core on an Intel Arc, desktop).
   Do: on coarse pointers and `saveData`, show the SVG car with a "Load 3D" button, as the main site's showroom does.
   Done when: a phone-sized, touch-emulated load makes no `.glb` request until the button is pressed.
2. **Real devices and the two missing engines.**
   Evidence: Firefox, Safari and WebKit have never been run; one real GPU is desktop only. Several features depend on
   newer CSS (`:has()`, `paint-order`, `contain: paint`, `svh`, `clamp()` inside `calc()` for opacity).
   Do: needs the owner. Either approve a Playwright download of Firefox and WebKit (about 300 MB, no code change) or use
   a Mac or iPhone. Run the same scripts. Also test one real Android phone over USB debugging.
3. **Legal review of Terms and Privacy** (`docs/LEGAL_REVIEW.md`). Needs the owner to supply operator, contact and
   governing law, and a qualified reviewer.
4. **Collect real feedback** (`docs/USER_FEEDBACK.md`). Needs the owner to send it. Every product decision below
   should be re-ordered by what real people say.

## P1: existing automotive templates

5. **Idle cost of the four templates is still high in headless runs** (Ridgeback, Redline and Kestrel hero 8 to 60 %
   of a core at 4x throttle depending on the run; Vortex is the 3D canvas). Find which loops run while the hero is in
   view and keep only one signature motion, as the checklist requires. Measure per loop by disabling them one at a
   time, the way the Vortex canvas was isolated.
6. **Downloads are incomplete.** The zip now includes the license and credits, but the Vortex zip still lacks the 3D
   model its hero refers to, and every automotive template needs the GSAP CDN. Decide: ship the model with its license
   file, or document the fallback on the template page. Ask Webflow about bundling GSAP before changing the CDN approach.
7. **Realism.** The vehicles are now detailed vector art. The next step up is a licensed or commissioned 3D model per
   template (the owner's budget decision), or better side-profile drawings with real wheel and suspension motion.
8. **Landscape phones.** Two real problems were found only by looking at landscape screenshots (caption under the
   header, wrapping navigation at tablet widths). Add landscape and 700 to 1100 px width checks to the permanent tests.

## P1: anime section

9. **Characters is empty.** It is the only category the section promises that does not exist. Options: an original
   chibi or silhouette character set drawn in SVG, or leave the tile and say so. Do not use VRoid, Live2D or fan art
   (`docs/ANIME_ASSETS.md`).
10. **Discoverability.** The home page features only automotive templates, so the anime section is reachable only from
    navigation and Browse. Add one real, content-bearing entry on the home page once feedback says people want it.
11. **Phone framing.** The portrait pan works, but the traveller and the gate cross at mid-scroll in Sakura Dusk. A small
    shift of the gate artwork would clear it.

## P2: engineering

12. **Move the test tools into the repository.** The headless Chrome and Edge scripts (device matrix, template, anime and
    app behaviour, pacing) live in a scratch folder, so nobody else can rerun them. They use only Node built-ins. Moving
    them to `tests/` with an `npm run test:e2e` and a short README would make every claim in the audit repeatable.
    This adds files and no dependencies.
13. **Teach the matrix about invisible controls.** Three 13 px opacity-0 radios per template are reported as small tap
    targets every run. They are not tap targets. Skip controls with `opacity: 0` and `pointer-events: none` so a real
    failure is not hidden in the noise.
14. **Keyboard focus for the swatches** was missing (the radio is invisible and had no ring on its label); fixed in this
    round. Add it to the permanent keyboard test.

## Not on the list on purpose

- New templates, new sections, a backend, accounts, uploads or payments. None is justified by evidence yet, and any of
  them requires updating the Terms and Privacy pages first.
