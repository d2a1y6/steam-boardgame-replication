import { describe, expect, it } from "vitest";
import { buildDefaultPlayerNames, getDefaultPlayerName } from "../src/utils/playerNames";

describe("playerNames", () => {
  it("先返回 26 个基础名字", () => {
    expect(getDefaultPlayerName(0)).toBe("Alice");
    expect(getDefaultPlayerName(25)).toBe("Zach");
  });

  it("在 Zach 之后按前缀和基础名字配对", () => {
    expect(getDefaultPlayerName(26)).toBe("Angry Alice");
    expect(getDefaultPlayerName(51)).toBe("Angry Zach");
    expect(getDefaultPlayerName(52)).toBe("Baby Alice");
    expect(getDefaultPlayerName(701)).toBe("Zombie Zach");
  });

  it("在配对名字之后进入 You Win 序列", () => {
    expect(getDefaultPlayerName(702)).toBe("You Win 702");
    expect(getDefaultPlayerName(703)).toBe("You Win 703");
  });

  it("可以批量生成连续名字", () => {
    expect(buildDefaultPlayerNames(4)).toEqual(["Alice", "Bob", "Carol", "Dave"]);
    expect(buildDefaultPlayerNames(3, 26)).toEqual(["Angry Alice", "Angry Bob", "Angry Carol"]);
  });
});
