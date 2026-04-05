import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameShell } from "../src/ui/GameShell";

describe("uiShell", () => {
  it("初始渲染会显示真人操作入口，并允许选择行动牌", () => {
    render(<GameShell />);

    expect(screen.getByText("Steam 规则学习壳")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "行动牌" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Turn Order/i }));
    expect(screen.getAllByText(/选择了行动牌/i).length).toBeGreaterThan(0);
  });
});
