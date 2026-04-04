import { describe, expect, it } from "vitest";
import { hasTileAvailable, takeTile } from "../src/rules/tilePool";

describe("tilePool", () => {
  it("blocks placement after the last copy is taken", () => {
    const pool = { counts: { x: 1 } };
    const afterTake = takeTile(pool, "x");
    expect(hasTileAvailable(afterTake, "x")).toBe(false);
  });
});
