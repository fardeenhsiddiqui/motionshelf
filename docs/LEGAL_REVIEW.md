# Legal review preparation

**Status: draft, not legally approved.** The pages at `/terms` and `/privacy` (text in `src/lib/legal.ts`) were
written by the maintainer's assistant from how the site actually behaves. No lawyer has reviewed them, and they must
not be presented as approved, compliant or reviewed. This file is for whoever does that review.

## 1. What the site does, checked against the pages

Observed on production on 2026-11-19 with a headless browser (hosts requested, cookies, storage), plus a search of the
source.

| Statement in the pages | Evidence | Result |
|---|---|---|
| No cookies | Cookie jar empty on home, browse, detail, anime, terms and both preview origins | Matches |
| No localStorage or sessionStorage | Both empty on the same pages; no use in `src` | Matches |
| No analytics or tracking | Only `motionshelf.pages.dev` and `motionshelf-previews.pages.dev` are contacted by the app; no beacon in the HTML | Matches |
| Fonts, images and models are self-hosted | Same two hosts only | Matches |
| Live previews can contact `cdnjs.cloudflare.com` and `esm.sh` | Seen on the Vortex GT preview; the other three automotive templates use cdnjs | Matches |
| Anime items contact no third party | Sakura Dusk preview requested only its own host | Matches (spot-checked; Neon Rain and Impact Frames have no external references in their source) |
| Template demo forms send nothing | Each form uses `onsubmit="event.preventDefault()"` | Matches |
| Downloads include the license text and required credits | **Was false when first written.** The zip held only the code files. Fixed in this change (`LICENSE.txt`, and `CREDITS.txt` when credit is required) | Matches after the fix |
| Hosting is Cloudflare Pages | Deployed with Wrangler to two Pages projects | Matches |
| Cloudflare may log IP and request data | General property of the host, not something the site controls | Not verified here; confirm against Cloudflare's current terms and the dashboard settings (for example whether Web Analytics is off) |

Known gap not covered by the text: the Vortex GT zip does not include the 3D model file the hero refers to
(`car-concept.glb`, CC BY 4.0). The page falls back to the SVG car without it. If the model is added to the zip, its
license file and credit must go with it.

## 2. Details only the owner can supply (not invented)

None of these exist in the pages today. The pages name no company or place on purpose.

- [ ] **Operator.** Who is the legal operator: you personally, or a registered business? Full legal name and
      address if required where you live or where you offer the service.
- [ ] **Contact.** A monitored email address or form. Today the only contact is the public GitHub issues page.
- [ ] **Jurisdiction and governing law.** Which country or state's law applies, and which courts, if any. The Terms
      currently contain no governing-law or venue clause.
- [ ] **Data controller details.** If you want to address visitors in the EU, UK or Switzerland, the privacy page
      normally names the controller and a contact. Confirm whether that applies to a site that stores no personal data.
- [ ] **Hosting and subprocessors.** Whether Cloudflare, cdnjs and esm.sh should be named with links to their policies,
      and whether international transfer wording is needed.
- [ ] **Copyright complaints.** Whether you want a formal notice procedure (for example a designated agent in the US)
      instead of GitHub issues.
- [ ] **Business name and trademark.** Whether "MotionShelf" is cleared or registered anywhere.

## 3. Questions for the reviewer

1. Is "no cookies, no analytics, no personal data collected by us" enough, given that the host and CDNs see IP addresses?
2. Are the limitation-of-liability and no-warranty clauses enforceable and sensible for a free, open-licensed site in
   your jurisdiction, and do they need consumer-law carve-outs?
3. Does the AI-assisted disclosure belong in the Terms, the licenses, or both? Is "checked for third-party material"
   a claim you can support?
4. Is it correct that the item license (MIT, CC BY 4.0 for the car model) governs reuse, and the Terms only add site rules?
5. GSAP: is loading it from a CDN under Webflow's Standard "No Charge" License, without bundling it in downloads, an
   acceptable reading of that license for downloadable templates? (The text does not address redistribution.)
6. Do the fictional-brand statements and "not affiliated with any manufacturer" cover the vehicle styling adequately?
7. Is a takedown and rights-concern procedure through public GitHub issues acceptable, or is a private channel needed?
8. Do you need an accessibility statement, or a children's privacy statement beyond one sentence?

## 4. When to update the pages

Update `src/lib/legal.ts` in the same change as any of: analytics, a form that sends data, accounts, uploads,
payments, a new third-party script or font, a custom domain, or a change of host. Re-run the evidence check in
section 1 and record the date.
