/**
 * 功能概述：定义第一阶段 UI 组件共用的轻量视图类型。
 * 输入输出：接收外部整理好的局面摘要，输出给棋盘、面板和日志渲染使用的数据结构。
 * 处理流程：只保留展示层需要的字段，避免 UI 直接依赖规则引擎内部状态。
 */

export type UIPrimitive = string | number | boolean | null | undefined;
export type UIChildren = unknown;

export interface HexCellView {
  id: string;
  x: number;
  y: number;
  radius?: number;
  label?: string;
  terrain?: string;
  fill?: string;
  stroke?: string;
  note?: string;
}

export interface TrackSegmentView {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
  dashed?: boolean;
}

export interface PlayerView {
  id: string;
  name: string;
  color: string;
  cash: number;
  income: number;
  victoryPoints: number;
  locomotiveLevel: number;
  isBot?: boolean;
  active?: boolean;
}

export interface LogEntryView {
  id: string;
  message: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
}

export interface RuleHintView {
  title: string;
  body: string;
  detail?: string;
}

export interface PhasePanelView {
  phaseLabel: string;
  roundLabel: string;
  activePlayerLabel: string;
  actionLabel?: string;
}

export interface MapBoardView {
  hexes: HexCellView[];
  tracks?: TrackSegmentView[];
  selectedHexId?: string;
  title?: string;
}

export interface GameShellProps {
  title: string;
  board: MapBoardView;
  phase: PhasePanelView;
  players: PlayerView[];
  ruleHint: RuleHintView;
  logs: LogEntryView[];
  onHexClick?: (hexId: string) => void;
}
