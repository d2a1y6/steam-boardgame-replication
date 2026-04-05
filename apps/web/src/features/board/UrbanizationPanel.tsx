/**
 * 功能概述：提供 Urbanization 的最小执行工作台。
 * 输入输出：输入 town、新城市颜色与 Goods Supply 选项；输出一个三段式选择面板。
 * 处理流程：让真人选择目标 town、新城市颜色和 supply cubes，再提交给引擎执行。
 */

import { useEffect, useState } from "react";

export interface UrbanizationTownView {
  id: string;
  label: string;
}

export interface UrbanizationColorView {
  id: string;
  label: string;
}

export interface UrbanizationSupplyGroupView {
  id: string;
  label: string;
}

export function UrbanizationPanel({
  towns,
  colors,
  supplyGroups,
  onConfirm,
}: {
  towns: readonly UrbanizationTownView[];
  colors: readonly UrbanizationColorView[];
  supplyGroups: readonly UrbanizationSupplyGroupView[];
  onConfirm: (townHexId: string, newCityColor: string, supplyGroupId: string) => void;
}) {
  const [townHexId, setTownHexId] = useState(towns[0]?.id ?? "");
  const [newCityColor, setNewCityColor] = useState(colors[0]?.id ?? "");
  const [supplyGroupId, setSupplyGroupId] = useState(supplyGroups[0]?.id ?? "");

  useEffect(() => {
    setTownHexId(towns[0]?.id ?? "");
  }, [towns]);

  useEffect(() => {
    setNewCityColor(colors[0]?.id ?? "");
  }, [colors]);

  useEffect(() => {
    setSupplyGroupId(supplyGroups[0]?.id ?? "");
  }, [supplyGroups]);

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>Urbanization</h2>
      <p style={metaStyle}>把一个 town 升级成新城市，并从一个 Goods Supply 拿整组 cubes 放上去。</p>
      <div style={fieldGridStyle}>
        <select value={townHexId} onChange={(event) => setTownHexId(event.target.value)} style={inputStyle}>
          {towns.map((town) => <option key={town.id} value={town.id}>{town.label}</option>)}
        </select>
        <select value={newCityColor} onChange={(event) => setNewCityColor(event.target.value)} style={inputStyle}>
          {colors.map((color) => <option key={color.id} value={color.id}>{color.label}</option>)}
        </select>
        <select value={supplyGroupId} onChange={(event) => setSupplyGroupId(event.target.value)} style={inputStyle}>
          {supplyGroups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
        </select>
      </div>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => onConfirm(townHexId, newCityColor, supplyGroupId)}
      >
        执行 Urbanization
      </button>
    </section>
  );
}

const panelStyle = { background: "rgba(255,255,255,0.55)", padding: "10px 11px", borderRadius: 12, color: "#1f1a17" } as const;
const titleStyle = { marginBottom: 6, fontSize: 15, lineHeight: 1.1 } as const;
const metaStyle = { marginBottom: 8, fontSize: 12, lineHeight: 1.3 } as const;
const fieldGridStyle = { display: "grid", gap: 6 } as const;
const inputStyle = { padding: "6px 7px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)" } as const;
const buttonStyle = { marginTop: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)", cursor: "pointer" } as const;
