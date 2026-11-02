// Fails the build when a catalog item is missing license metadata or files.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const catalog = JSON.parse(readFileSync(join(root, "src/data/catalog.json"), "utf8"));

const LICENSE_FIELDS = [
  "name", "spdx", "licenseFile", "author", "attributionRequired", "commercialUse",
  "redistribution", "modification", "originalIp", "aiGenerated", "verifiedOn", "notes",
];
const sectionIds = new Set(catalog.sections.map((s) => s.id));
const seen = new Set();
const errors = [];

for (const item of catalog.items) {
  const where = `item "${item.id}"`;
  if (seen.has(item.id)) errors.push(`${where}: duplicate id`);
  seen.add(item.id);
  if (!sectionIds.has(item.section)) errors.push(`${where}: unknown section "${item.section}"`);
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
    if (!existsSync(join(root, "public", file))) errors.push(`${where}: file not found in public/: ${file}`);
  }
}

if (errors.length > 0) {
  console.error("Catalog validation failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Catalog OK: ${catalog.items.length} item(s), every one has license metadata.`);
