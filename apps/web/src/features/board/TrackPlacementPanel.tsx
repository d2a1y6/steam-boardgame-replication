/**
 * 功能概述：展示当前选中 hex 的合法朝向和建轨预览，并负责确认落子。
 * 输入输出：输入已选 hex、朝向选项和结构化预览；输出一块建轨确认面板。
 * 处理流程：先展示当前状态，再列出可选 rotation，最后把原始预览事实转成当前页面可读文本。
 */

import type { TrackPlacementOptionView, TrackPlacementPreview } from "@steam/game-core";
import { presentRuleReason } from "../rule-help/presentRuleExplanation";

export function TrackPlacementPanel({
  selectedHexId,
  placementOptions,
  selectedRotation,
  preview,
  onSelectRotation,
  onConfirm,
  onFinishBuild,
  onReset,
}: {
  selectedHexId: string | null;
  placementOptions: readonly TrackPlacementOptionView[];
  selectedRotation: number | null;
  preview: TrackPlacementPreview | null;
  onSelectRotation: (rotation: number) => void;
  onConfirm: () => void;
  onFinishBuild: () => void;
  onReset: () => void;
}) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>建轨工作台</h2>
      <div style={metaStyle}>当前 hex：{selectedHexId ?? "尚未选择"}</div>
      {selectedHexId ? (
        placementOptions.length > 0 ? (
          <>
            <div style={rotationGridStyle}>
              {placementOptions.map((option) => (
                <button
                  key={`${option.hexId}-${option.rotation}`}
                  type="button"
                  onClick={() => onSelectRotation(option.rotation)}
                  style={{
                    ...rotationButtonStyle,
                    borderColor: selectedRotation === option.rotation ? "#8a4f2d" : "rgba(59,47,40,0.16)",
                  }}
                >
                  旋转 {option.rotation} / 费用 {option.cost}
                </button>
              ))}
            </div>
            <div style={previewBoxStyle}>
              {preview ? (
                <>
                  <div>{`费用 ${preview.cost ?? 0}`}</div>
                  <div>
                    {preview.shortfall <= 0
                      ? "当前现金足够，无需融资。"
                      : `当前现金不足 ${preview.shortfall}，若确认将至少融资 ${preview.raised}。`}
                  </div>
                  <div>{preview.startsNewLink ? "这一步会启动一条新的线路。" : "这一步会接到你已有的线路上。"}</div>
                </>
              ) : (
                <div>先选择一个合法朝向。</div>
              )}
            </div>
          </>
        ) : (
          <div style={previewBoxStyle}>
            {preview?.reason ? presentRuleReason(preview.reason) : "这个 hex 对当前轨道板没有合法朝向。"}
          </div>
        )
      ) : (
        <div style={previewBoxStyle}>先在地图上点击一个高亮 hex。</div>
      )}
      <div style={buttonRowStyle}>
        <button style={buttonStyle} type="button" onClick={onConfirm} disabled={!preview?.ok}>确认这一步</button>
        <button style={buttonStyle} type="button" onClick={onFinishBuild}>结束建轨</button>
        <button style={buttonStyle} type="button" onClick={onReset}>重置阶段</button>
      </div>
    </section>
  );
}

const panelStyle = {
  background: "rgba(255,255,255,0.55)",
  padding: "10px 11px",
  borderRadius: 12,
  color: "#1f1a17",
} as const;

const titleStyle = {
  marginBottom: 6,
  fontSize: 15,
  lineHeight: 1.1,
} as const;

const metaStyle = {
  marginBottom: 8,
  fontSize: 12.5,
  lineHeight: 1.3,
} as const;

const rotationGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
} as const;

const rotationButtonStyle = {
  padding: "6px 7px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.16)",
  background: "rgba(255,255,255,0.74)",
  textAlign: "left",
  cursor: "pointer",
} as const;

const previewBoxStyle = {
  marginTop: 8,
  padding: "7px 8px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.55)",
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;

const buttonRowStyle = {
  marginTop: 8,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 6,
} as const;

const buttonStyle = {
  padding: "6px 8px",
  borderRadius: 8,
  border: "1px solid rgba(59,47,40,0.18)",
  background: "rgba(255,255,255,0.74)",
  cursor: "pointer",
} as const;
