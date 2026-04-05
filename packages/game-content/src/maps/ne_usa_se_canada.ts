/**
 * 功能概述：提供东北美洲学习型正式地图数据。
 * 输入输出：不接收运行时输入；导出一张可支撑完整规则流程的 NE USA & SE Canada 地图。
 * 处理流程：保留当前测试已使用的城市 id，并补充更多城市、城镇、丘陵、河流和海岸黑边。
 */

import type { MapDefinition } from "@steam/game-core";

export const neUsaSeCanadaMap: MapDefinition = {
  id: "ne-usa-se-canada",
  name: "NE USA & SE Canada",
  hexes: [
    { id: "buffalo", q: -3, r: 0, terrain: "city", cityColor: "red", cityDemand: 2, label: "Buffalo" },
    { id: "rochester", q: -2, r: 0, terrain: "plains", isTown: true, label: "Rochester" },
    { id: "toronto", q: -2, r: -1, terrain: "city", cityColor: "gray", cityDemand: 2, label: "Toronto" },
    { id: "syracuse", q: -1, r: 0, terrain: "city", cityColor: "yellow", cityDemand: 2, label: "Syracuse" },
    { id: "ottawa", q: -1, r: -2, terrain: "city", cityColor: "purple", cityDemand: 2, label: "Ottawa" },
    { id: "kingston", q: -1, r: -1, terrain: "plains", isTown: true, label: "Kingston" },
    { id: "albany", q: 0, r: 0, terrain: "city", cityColor: "red", cityDemand: 2, label: "Albany" },
    { id: "utica", q: 0, r: -1, terrain: "plains", isTown: true, label: "Utica" },
    { id: "montreal", q: 0, r: -2, terrain: "city", cityColor: "blue", cityDemand: 3, label: "Montreal" },
    { id: "quebec", q: 1, r: -3, terrain: "city", cityColor: "yellow", cityDemand: 2, label: "Quebec" },
    { id: "poughkeepsie", q: 1, r: 0, terrain: "plains", hasRiver: true, isTown: true, label: "Poughkeepsie" },
    { id: "hartford", q: 1, r: -1, terrain: "hills", label: "Hartford" },
    { id: "vermont", q: 1, r: -2, terrain: "plains", isTown: true, label: "Vermont" },
    { id: "new-york", q: 2, r: 0, terrain: "city", cityColor: "blue", cityDemand: 3, label: "New York" },
    { id: "new-haven", q: 2, r: -1, terrain: "plains", isTown: true, label: "New Haven" },
    { id: "springfield", q: 2, r: -2, terrain: "plains", isTown: true, label: "Springfield" },
    { id: "boston", q: 3, r: -1, terrain: "city", cityColor: "yellow", cityDemand: 2, label: "Boston" },
    { id: "providence", q: 3, r: 0, terrain: "city", cityColor: "purple", cityDemand: 2, label: "Providence" },
    { id: "worcester", q: 3, r: -2, terrain: "plains", isTown: true, label: "Worcester" },
    { id: "portland", q: 4, r: -2, terrain: "city", cityColor: "gray", cityDemand: 2, label: "Portland" },
    { id: "halifax", q: 5, r: -3, terrain: "city", cityColor: "red", cityDemand: 2, label: "Halifax" },
    { id: "trenton", q: 2, r: 1, terrain: "plains", isTown: true, label: "Trenton" },
    { id: "philadelphia", q: 3, r: 1, terrain: "city", cityColor: "gray", cityDemand: 2, label: "Philadelphia" },
    { id: "scranton", q: 1, r: 1, terrain: "hills", label: "Scranton" },
    { id: "pittsburgh", q: 0, r: 1, terrain: "city", cityColor: "purple", cityDemand: 2, label: "Pittsburgh" },
    { id: "erie", q: -1, r: 1, terrain: "plains", isTown: true, label: "Erie" },
    { id: "baltimore", q: 4, r: 1, terrain: "city", cityColor: "blue", cityDemand: 2, label: "Baltimore" },
    { id: "coast", q: 4, r: 0, terrain: "plains", blockedEdges: [0, 1, 5], label: "Atlantic" },
    { id: "maine-coast", q: 5, r: -2, terrain: "plains", blockedEdges: [0, 1, 2], label: "Atlantic" },
    { id: "chesapeake", q: 5, r: 1, terrain: "plains", blockedEdges: [0, 5], label: "Atlantic" },
  ],
};
