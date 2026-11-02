// Fails the build when catalog items or registered assets are missing license metadata or files.
// Usage: node scripts/validate-catalog.mjs [--release]
//   --release  also fails on any asset with clearance "dev-only" (use for production builds).
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const release = process.argv.includes("--release");
const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const readJson = (file) => JSON.parse(readFileSync(join(root, file), "utf8"));
const catalog = readJson("src/data/catalog.json");
const registry = readJson("src/data/assets.json");

const LICENSE_FIELDS = [
  "name", "spdx", "licenseFile", "author", "attributionRequired", "commercialUse",
  "redistribution", "modification", "originalIp", "aiGenerated", "verifiedOn", "notes",
];
const ASSET_FIELDS = [
  "id", "type", "title", "file", "source", "author", "license", "attributionRequired",
  "commercialUse", "redistribution", "modification", "clearance", "brandsDepicted", "usedIn", "verifiedOn",
];
const ASSET_TYPES = new Set(["model", "image", "video", "font", "audio", "hdri"]);
const CLEARANCES = new Set(["cleared", "dev-only"]);
const MAX_FILE_BYTES = 25 * 1024 * 1024; // Cloudflare Pages single-file limit (25 MiB)

const sectionIds = new Set(catalog.sections.map((s) => s.id));
const categoryIds = new Set(catalog.categories.map((c) => c.id));
const THEMES = new Set(["dark", "light"]);
const errors = [];
const warnings = [];
const inPublic = (file) => existsSync(join(root, "public", file));

// --- asset registry ---------------------------------------------------------
const assetIds = new Set();
for (const asset of registry.assets) {
  const where = `asset "${asset.id}"`;
  if (assetIds.has(asset.id)) errors.push(`${where}: duplicate id`);
  assetIds.add(asset.id);
  for (const field of ASSET_FIELDS) {
    if (asset[field] === undefined || asset[field] === "") errors.push(`${where}: ${field} is missing`);
  }
  if (!ASSET_TYPES.has(asset.type)) errors.push(`${where}: unknown type "${asset.type}"`);
  if (!CLEARANCES.has(asset.clearance)) errors.push(`${where}: clearance must be "cleared" or "dev-only"`);
  if (asset.license) {
    for (const field of ["name", "spdx", "url", "licenseFile"]) {
      if (!asset.license[field]) errors.push(`${where}: license.${field} is missing`);
    }
    if (asset.license.licenseFile && !inPublic(asset.license.licenseFile)) {
      errors.push(`${where}: license file not found in public/: ${asset.license.licenseFile}`);
    }
  }
  if (asset.source && (!asset.source.name || !asset.source.url)) errors.push(`${where}: source needs name and url`);
  if (asset.file && !inPublic(asset.file)) errors.push(`${where}: file not found in public/: ${asset.file}`);
  if (asset.attributionRequired && !asset.attributionText) errors.push(`${where}: attribution is required but attributionText is empty`);
  if (asset.clearance === "cleared") {
    if (!asset.commercialUse || !asset.redistribution) {
      errors.push(`${where}: cleared assets must allow commercial use and redistribution`);
    }
    if (Array.isArray(asset.brandsDepicted) && asset.brandsDepicted.length > 0 && !asset.brandPermission) {
      errors.push(`${where}: depicts brands (${asset.brandsDepicted.join(", ")}) but has no brandPermission; mark it "dev-only"`);
    }
  }
  if (asset.clearance === "dev-only") {
    const message = `${where}: clearance is "dev-only" (not cleared for redistribution)`;
    (release ? errors : warnings).push(message);
  }
}

// --- catalog items ----------------------------------------------------------
const seen = new Set();
for (const item of catalog.items) {
  const where = `item "${item.id}"`;
  if (seen.has(item.id)) errors.push(`${where}: duplicate id`);
  seen.add(item.id);
  if (!sectionIds.has(item.section)) errors.push(`${where}: unknown section "${item.section}"`);
  if (!categoryIds.has(item.category)) errors.push(`${where}: unknown category "${item.category}"`);
  if (!THEMES.has(item.theme)) errors.push(`${where}: theme must be "dark" or "light"`);
  for (const id of item.assetIds ?? []) {
    if (!assetIds.has(id)) errors.push(`${where}: unknown asset "${id}"`);
  }
  if (!item.license) {
    errors.push(`${where}: missing license`);
    continue;
  }
  for (const field of LICENSE_FIELDS) {
    if (item.license[field] === undefined || item.license[field] === "") {
      errors.push(`${where}: license.${field} is missing`);
    }
  }
  if (item.license.attributionRequired && !item.license.attributionText) {
    errors.push(`${where}: attribution is required but attributionText is empty`);
  }
  const publicFiles = [item.previewPath, item.license.licenseFile, ...item.files.map((f) => `${item.filesBase}/${f.path}`)];
  for (const file of publicFiles) {
    if (!inPublic(file)) errors.push(`${where}: file not found in public/: ${file}`);
  }
}

// --- hosting limits ---------------------------------------------------------
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (statSync(full).size > MAX_FILE_BYTES) errors.push(`file exceeds Cloudflare Pages 25 MiB limit: ${full.slice(root.length)}`);
  }
}
walk(join(root, "public"));

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length > 0) {
  console.error(`Catalog validation failed${release ? " (release mode)" : ""}:\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Catalog OK${release ? " (release)" : ""}: ${catalog.items.length} item(s), ${registry.assets.length} registered asset(s).`);
