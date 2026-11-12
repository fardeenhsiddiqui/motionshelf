// The text of the Terms and Privacy pages. Plain data with no imports, so the React pages and the build-time
// prerender script (scripts/prerender.mjs) render exactly the same words.
//
// Keep these statements true. When the site gains analytics, forms, accounts, uploads or payments, update the
// privacy policy and the terms in the same change (see DESIGN_AND_ENGINEERING_CHECKLIST.md).

export type LegalBlock = { heading: string; paragraphs?: string[]; list?: string[] };
export type LegalDoc = { path: string; title: string; description: string; updated: string; intro: string; blocks: LegalBlock[] };

const CONTACT = "https://github.com/fardeenhsiddiqui/motionshelf/issues";
const UPDATED = "12 November 2026";

export const privacy: LegalDoc = {
  path: "/privacy",
  title: "Privacy policy",
  description: "MotionShelf has no accounts, analytics, cookies or data-sending forms. This page lists what hosting and the third-party scripts in live previews can see.",
  updated: UPDATED,
  intro: "MotionShelf is a small, independent library of animated website templates. It is built to work without knowing who you are. This page says exactly what that means.",
  blocks: [
    {
      heading: "What MotionShelf collects",
      paragraphs: ["Nothing that identifies you. MotionShelf itself does not use:"],
      list: [
        "accounts, sign-in or user profiles",
        "analytics, tracking pixels, advertising or fingerprinting scripts",
        "cookies, or browser storage (localStorage, sessionStorage or IndexedDB)",
        "forms that send what you type to a server, or file uploads",
      ],
    },
    {
      heading: "What the hosting provider can see",
      paragraphs: [
        "The site is a static site served by Cloudflare Pages. Like any web host, Cloudflare receives your IP address, browser details and the address you request in order to deliver the page and protect it from abuse, and it may keep technical logs under its own policies. MotionShelf does not have a feature that identifies visitors from those logs. Cloudflare's privacy policy applies to that processing.",
        "The previews run on a second Cloudflare Pages address (motionshelf-previews.pages.dev) so that they stay isolated from the main site.",
      ],
    },
    {
      heading: "Live previews and third-party scripts",
      paragraphs: [
        "Templates are shown in sandboxed frames. A template page may load a script from a public content delivery network, and that network then receives your IP address and browser details, as it would on any website that uses it. Today that means:",
      ],
      list: [
        "cdnjs.cloudflare.com, for the GSAP animation library used by the four automotive templates",
        "esm.sh, for the three.js 3D library used by the optional 3D hero of Vortex GT",
      ],
    },
    {
      heading: "Things that stay in your browser",
      paragraphs: [
        "Fonts, images and 3D models are served from MotionShelf itself, not from a font or image service. The 3D showroom runs in your browser. Copy HTML, Copy as prompt and Download all (.zip) build their output in your browser from files on the site, and the clipboard is written only when you press a copy button. The forms inside template demos do not send anything anywhere: what you type stays on the page and is gone when you leave it.",
      ],
    },
    {
      heading: "Links to other sites",
      paragraphs: [
        "Credit and licence links lead to other websites, for example GitHub, Creative Commons or GSAP. Those sites have their own privacy practices, which MotionShelf does not control.",
      ],
    },
    {
      heading: "Your rights and contact",
      paragraphs: [
        "Because MotionShelf holds no personal data about you, there is normally nothing to access, correct or delete. If you believe it does, or you have a question about this policy, open an issue at " + CONTACT + ". That issue is public, so do not put personal details in it; ask for a private way to continue instead. Where the law gives you rights about data held by Cloudflare, you can exercise them with Cloudflare.",
        "MotionShelf is not directed at children and does not knowingly collect information from anyone.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "If MotionShelf ever adds analytics, accounts, forms that send data, uploads or payments, this policy will be updated before that change ships. The date at the top shows the latest revision.",
      ],
    },
  ],
};

export const terms: LegalDoc = {
  path: "/terms",
  title: "Terms of use",
  description: "Terms for using MotionShelf: free to browse, preview, copy and download templates under each item's own license, provided as is, with no accounts or payments.",
  updated: UPDATED,
  intro: "These terms apply when you use the MotionShelf website and the templates, scenes and effects it lists. By using the site you agree to them. If you do not agree, please do not use it.",
  blocks: [
    {
      heading: "What MotionShelf is",
      paragraphs: [
        "MotionShelf is a free library of animated website templates and anime-style scenes. You can preview them live, read the code, copy it and download it. There are no accounts, uploads or payments. The site is an independent project run by its maintainer, and it is not a company product or an official service of any brand.",
      ],
    },
    {
      heading: "Licenses for what you download",
      paragraphs: [
        "Every item has its own license record, shown on its page and summarised on the Licensing page. That license, not these terms, decides what you may do with the code and artwork of that item. Today MotionShelf's own items use the MIT license, and the license file is included in each download.",
        "Some items use third-party assets under their own licenses, for example a 3D car model under CC BY 4.0. Where a license requires credit, the credit line is shown on the item's page and in its download, and you must keep it when you reuse that asset.",
        "Templates may load libraries from a public CDN, for example GSAP and three.js. Those libraries are not part of MotionShelf's license. GSAP is used under its Standard No Charge License from Webflow (gsap.com/standard-license), which has its own conditions, including that it may not be used to build a competing visual animation tool. You are responsible for following the license of every library you use.",
      ],
    },
    {
      heading: "What the content is, and is not",
      list: [
        "All brands, vehicles, drivers, teams, specifications and results shown in templates are fictional. Any resemblance to a real product or person is unintended.",
        "MotionShelf is not affiliated with, endorsed by or sponsored by any vehicle manufacturer. Any trademark that is mentioned belongs to its owner.",
        "Much of the code and artwork was created with the help of AI tools. Each item's license record says so. It was checked for third-party material, but you should review anything you ship.",
      ],
    },
    {
      heading: "Using the site",
      paragraphs: ["You agree not to:"],
      list: [
        "attack, overload or probe the site or its hosting, or scrape it at a rate that harms other visitors",
        "present a MotionShelf item as endorsed by MotionShelf or its maintainer, or remove the copyright and license notices the item's license requires you to keep",
        "use the site to break the law or someone else's rights",
      ],
    },
    {
      heading: "No warranty",
      paragraphs: [
        "The site and everything on it are provided as is and as available, without warranties of any kind, including fitness for a particular purpose, accuracy, availability, or that the code is free of errors or works in every browser and device. You use the templates at your own risk and should test them in your own project.",
      ],
    },
    {
      heading: "Limit of liability",
      paragraphs: [
        "To the extent the law allows, the maintainer of MotionShelf is not liable for any loss or damage that comes from using the site or its templates, including lost profits, lost data or business interruption. Nothing in these terms limits any right you have under mandatory law where you live, or liability that cannot be limited by law.",
      ],
    },
    {
      heading: "Reporting a problem or a rights concern",
      paragraphs: [
        "If you think an item uses something it should not, or you find a bug or a security issue, open an issue at " + CONTACT + ". A rights concern should name the item, the material and why you hold the rights. Credible concerns are acted on promptly, and the item is taken down while they are checked.",
      ],
    },
    {
      heading: "Changes and availability",
      paragraphs: [
        "MotionShelf may change, move or remove items and parts of the site at any time. Licenses already granted for a download you made are not taken back. These terms may change. The date at the top shows the latest revision, and continued use after a change means you accept it. If accounts, uploads or payments are ever added, these terms and the privacy policy will be updated first.",
      ],
    },
  ],
};

export const legalDocs = [privacy, terms];
