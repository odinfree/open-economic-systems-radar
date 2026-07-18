import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, ".open-next"), { recursive: true });
await cp(
  path.join(root, ".open-next", "assets"),
  path.join(dist, ".open-next", "assets"),
  {
    recursive: true
  }
);
await cp(
  path.join(root, ".sites-bundle", "worker.js"),
  path.join(dist, ".open-next", "worker.js")
);
await cp(path.join(root, ".openai"), path.join(dist, ".openai"), {
  recursive: true
});
await cp(path.join(root, "wrangler.jsonc"), path.join(dist, "wrangler.jsonc"));
