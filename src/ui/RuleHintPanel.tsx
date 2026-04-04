/**
 * 功能概述：展示当前最重要的一条规则提示或非法原因。
 * 输入输出：输入提示文本；输出简单提示面板。
 * 处理流程：保持教学信息始终可见。
 */

export function RuleHintPanel({ text }: { text: string }) {
  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>规则提示</h2>
      <p style={textStyle}>{text}</p>
    </section>
  );
}

const panelStyle = {
  background: "rgba(255,255,255,0.55)",
  padding: "10px 11px",
  borderRadius: 12,
} as const;

const titleStyle = {
  marginBottom: 6,
  fontSize: 15,
  lineHeight: 1.1,
} as const;

const textStyle = {
  fontSize: 12.5,
  lineHeight: 1.35,
} as const;
