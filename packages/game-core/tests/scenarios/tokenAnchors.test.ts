import { describe, expect, it } from "vitest";
import { addAnchor, normalizeAnchors } from "../../src/rules/tokenAnchors";

describe("tokenAnchors", () => {
  it("drops anchors whose segments no longer exist", () => {
    const anchors = addAnchor([], "p1", "seg-1");
    const normalized = normalizeAnchors(anchors, []);
    expect(normalized).toHaveLength(0);
  });
});
