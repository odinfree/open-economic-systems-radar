import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(path.join(root, ".open-next"), path.join(dist, ".open-next"), {
  recursive: true
});
await cp(path.join(root, ".openai"), path.join(dist, ".openai"), {
  recursive: true
});
await cp(path.join(root, "wrangler.jsonc"), path.join(dist, "wrangler.jsonc"));
