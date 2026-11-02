// Interactive previews run script-enabled templates, so they are isolated twice over:
//  1. The iframe sandbox omits `allow-same-origin`, giving the frame an opaque origin. It cannot
//     read the app's storage, cookies or DOM, even when served from the same host.
//  2. In production, set VITE_PREVIEW_ORIGIN to a second host (for example another Cloudflare Pages
//     project serving the same build) so previews also load from a different origin.
const PREVIEW_ORIGIN = (import.meta.env.VITE_PREVIEW_ORIGIN as string | undefined)?.replace(/\/+$/, "") ?? "";

export const INTERACTIVE_SANDBOX = "allow-scripts allow-popups allow-forms";

export function previewSrc(path: string): string {
  return `${PREVIEW_ORIGIN}${path}`;
}

export const hasSeparatePreviewOrigin = PREVIEW_ORIGIN !== "";
