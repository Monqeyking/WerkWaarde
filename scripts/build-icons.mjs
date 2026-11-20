/**
 * Writes the PNG icons for phones and the web app manifest. The results are
 * committed; run again only when the logo changes: node scripts/build-icons.mjs
 */
import { writeFileSync } from "node:fs";
import { iconPng } from "./icon-png.mjs";

const root = new URL("../", import.meta.url);

// iOS home screen icon: a full square, iOS rounds the corners itself.
writeFileSync(new URL("app/apple-icon.png", root), iconPng(180, { rounded: false }));
// Android and the manifest (app/manifest.ts).
writeFileSync(new URL("public/icon-192.png", root), iconPng(192));
writeFileSync(new URL("public/icon-512.png", root), iconPng(512));
console.log("Wrote app/apple-icon.png, public/icon-192.png and public/icon-512.png");
