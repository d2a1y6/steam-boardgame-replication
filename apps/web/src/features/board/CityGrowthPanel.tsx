/**
 * 功能概述：提供 City Growth 的最小执行工作台。
 * 输入输出：输入城市、Goods Supply 选项与确认回调；输出一个双下拉面板。
 * 处理流程：让真人选择目标城市和一组 supply cubes，然后提交给引擎执行。
 */

import { useEffect, useState } from "react";

export interface CityGrowthTargetView {
  id: string;
  label: string;
}

export interface SupplyGroupView {
  id: string;
  label: string;
}

export function CityGrowthPanel({
  cities,
  supplyGroups,
  onConfirm,
}: {
  cities: readonly CityGrowthTargetView[];
  supplyGroups: readonly SupplyGroupView[];
  onConfirm: (cityHexId: string, supplyGroupId: string) => void;
}) {
  const [cityHexId, setCityHexId] = useState(cities[0]?.id ?? "");
  const [supplyGroupId, setSupplyGroupId] = useState(supplyGroups[0]?.id ?? "");

  useEffect(() => {
    setCityHexId(cities[0]?.id ?? "");
  }, [cities]);

  useEffect(() => {
    setSupplyGroupId(supplyGroups[0]?.id ?? "");
  }, [supplyGroups]);

  return (
    <section style={panelStyle}>
      <h2 style={titleStyle}>City Growth</h2>
      <p style={metaStyle}>从一个 Goods Supply 拿整组 cubes，放到一个还没有 growth marker 的城市上。</p>
      <div style={fieldGridStyle}>
        <select value={cityHexId} onChange={(event) => setCityHexId(event.target.value)} style={inputStyle}>
          {cities.map((city) => <option key={city.id} value={city.id}>{city.label}</option>)}
        </select>
        <select value={supplyGroupId} onChange={(event) => setSupplyGroupId(event.target.value)} style={inputStyle}>
          {supplyGroups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
        </select>
      </div>
      <button type="button" style={buttonStyle} onClick={() => onConfirm(cityHexId, supplyGroupId)}>执行 City Growth</button>
    </section>
  );
}

const panelStyle = { background: "rgba(255,255,255,0.55)", padding: "10px 11px", borderRadius: 12, color: "#1f1a17" } as const;
const titleStyle = { marginBottom: 6, fontSize: 15, lineHeight: 1.1 } as const;
const metaStyle = { marginBottom: 8, fontSize: 12, lineHeight: 1.3 } as const;
const fieldGridStyle = { display: "grid", gap: 6 } as const;
const inputStyle = { padding: "6px 7px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)" } as const;
const buttonStyle = { marginTop: 8, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(59,47,40,0.18)", background: "rgba(255,255,255,0.74)", cursor: "pointer" } as const;
