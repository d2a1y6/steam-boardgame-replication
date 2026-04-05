/**
 * 功能概述：把当前提示中最像“非法或阻塞原因”的文本集中显示出来。
 * 输入输出：输入一段提示文本；输出一个可选的警示条。
 * 处理流程：只有确实存在阻塞语义时才渲染，避免界面噪声。
 */

export function IllegalMoveNotice({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <section style={panelStyle}>
      <strong style={titleStyle}>当前阻塞</strong>
      <div style={bodyStyle}>{message}</div>
    </section>
  );
}

const panelStyle = {
  background: "rgba(145, 44, 44, 0.18)",
  border: "1px solid rgba(248, 113, 113, 0.35)",
  color: "#fee2e2",
  padding: "9px 10px",
  borderRadius: 12,
} as const;

const titleStyle = {
  display: "block",
  marginBottom: 4,
  fontSize: 12.5,
} as const;

const bodyStyle = {
  fontSize: 12,
  lineHeight: 1.35,
} as const;
