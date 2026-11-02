import { useEffect, useState } from "react";
import type { Asset, CatalogItem } from "../types";

export type Loaded = { status: "loading" } | { status: "error" } | { status: "ready"; text: string };
export type Sources = Record<string, Loaded>;

// Fetches every code file of an item once, so tabs, copy, download and the prompt share the same text.
export function useSources(item: CatalogItem): Sources {
  const [sources, setSources] = useState<Sources>({});
  useEffect(() => {
    let cancelled = false;
    setSources({});
    item.files.forEach(async (file) => {
      let result: Loaded;
      try {
        const response = await fetch(`${item.filesBase}/${file.path}`);
        if (!response.ok) throw new Error(String(response.status));
        result = { status: "ready", text: await response.text() };
      } catch {
        result = { status: "error" };
      }
      if (!cancelled) setSources((prev) => ({ ...prev, [file.path]: result }));
    });
    return () => {
      cancelled = true;
    };
  }, [item]);
  return sources;
}

export function allReady(item: CatalogItem, sources: Sources): boolean {
  return item.files.every((f) => sources[f.path]?.status === "ready");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts or blocked clipboard access.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const FENCE: Record<string, string> = { html: "html", css: "css", js: "js" };

// A self-contained prompt an AI assistant can use to recreate or adapt the template.
export function buildPrompt(item: CatalogItem, sources: Sources, assets: Asset[]): string {
  const lines = [
    `Use the "${item.title}" website template below as the starting point for my project.`,
    "",
    `About: ${item.summary}`,
    `Sections: ${item.sections.join(", ")}`,
    `Dependencies: ${item.externalDeps.length === 0 ? "none (plain files, no build step)" : item.externalDeps.join(", ")}`,
    `License: ${item.license.name}. ${item.license.attributionRequired ? `Keep this attribution: ${item.license.attributionText}` : "No attribution required."}`,
  ];
  for (const asset of assets.filter((a) => a.attributionRequired)) {
    lines.push(`Asset credit (${asset.title}): ${asset.attributionText ?? asset.author}`);
  }
  lines.push("", "Keep the structure, motion and accessibility. Replace the brand name, copy and colors with mine, and tell me which files you changed.", "");
  for (const file of item.files) {
    const source = sources[file.path];
    lines.push(`File: ${file.path}`, "```" + FENCE[file.language], source?.status === "ready" ? source.text.trimEnd() : "", "```", "");
  }
  return lines.join("\n");
}

// Minimal store-only ZIP writer so every file downloads in one click without a library.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipFiles(files: { name: string; text: string }[]): Blob {
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local, name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(entry, name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = central.reduce((sum, p) => sum + (p instanceof DataView ? p.byteLength : (p as Uint8Array).length), 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: "application/zip" });
}
