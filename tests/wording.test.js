import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const PUBLIC_COPY_FILES = [
  "app/layout.jsx",
  "components/Dashboard.jsx",
  "lib/fetchers.js",
  "lib/metrics.js"
];

async function publicCopy() {
  const contents = await Promise.all(
    PUBLIC_COPY_FILES.map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8"))
  );
  return contents.join("\n");
}

describe("public wording", () => {
  it("keeps banned filler and decorative separators out of reader-facing source", async () => {
    const copy = await publicCopy();
    const blocked = [
      "at its core",
      "this is why",
      "turns into",
      `becomes ${"real"}`,
      `${"matt"}ers`,
      "anti-hype",
      "scale only counts",
      "every headline should",
      "is software entering"
    ];

    for (const phrase of blocked) {
      expect(copy.toLowerCase()).not.toContain(phrase);
    }

    expect(copy).not.toContain("·");
    expect(copy).not.toContain("—");
  });

  it("does not use rhetorical questions as section headings", async () => {
    const copy = await publicCopy();
    expect(copy).not.toMatch(/<h[1-6][^>]*>[^<]*\?/);
  });
});
