/**
 * 功能概述：提供 Ruhr 学习型正式地图数据。
 * 输入输出：不接收运行时输入；导出一张可支撑标准版流程与三人局特例的 Ruhr 地图。
 * 处理流程：优先覆盖密集城市、河流与 town 升级位，保持与本仓库“轻量规则学习”目标一致。
 */

import type { MapDefinition } from "@steam/game-core";

export const ruhrMap: MapDefinition = {
  id: "ruhr",
  name: "Ruhr",
  hexes: [
    { id: "cologne", q: -1, r: 2, terrain: "city", cityColor: "red", cityDemand: 2, label: "Cologne" },
    { id: "bonn", q: -1, r: 3, terrain: "plains", isTown: true, label: "Bonn" },
    { id: "dusseldorf", q: 0, r: 1, terrain: "city", cityColor: "blue", cityDemand: 2, label: "Dusseldorf" },
    { id: "duisburg", q: 1, r: 1, terrain: "city", cityColor: "yellow", cityDemand: 2, label: "Duisburg" },
    { id: "essen", q: 1, r: 0, terrain: "city", cityColor: "purple", cityDemand: 2, label: "Essen" },
    { id: "bochum", q: 2, r: 0, terrain: "plains", isTown: true, label: "Bochum" },
    { id: "dortmund", q: 3, r: 0, terrain: "city", cityColor: "gray", cityDemand: 2, label: "Dortmund" },
    { id: "wuppertal", q: 1, r: 2, terrain: "plains", isTown: true, label: "Wuppertal" },
    { id: "krefeld", q: 0, r: 0, terrain: "plains", isTown: true, label: "Krefeld" },
    { id: "oberhausen", q: 1, r: -1, terrain: "plains", isTown: true, label: "Oberhausen" },
    { id: "gelsenkirchen", q: 2, r: -1, terrain: "plains", isTown: true, label: "Gelsenkirchen" },
    { id: "hagen", q: 3, r: 1, terrain: "plains", isTown: true, label: "Hagen" },
    { id: "munster", q: 2, r: -2, terrain: "city", cityColor: "red", cityDemand: 2, label: "Munster" },
    { id: "paderborn", q: 4, r: -1, terrain: "city", cityColor: "blue", cityDemand: 2, label: "Paderborn" },
    { id: "kassel", q: 5, r: 0, terrain: "city", cityColor: "yellow", cityDemand: 2, label: "Kassel" },
    { id: "koblenz", q: -2, r: 3, terrain: "city", cityColor: "gray", cityDemand: 2, label: "Koblenz" },
    { id: "siegen", q: 2, r: 2, terrain: "hills", label: "Siegen" },
    { id: "mainz", q: 0, r: 3, terrain: "city", cityColor: "purple", cityDemand: 2, label: "Mainz" },
    { id: "rhine-west", q: -1, r: 1, terrain: "plains", hasRiver: true, label: "Rhine" },
    { id: "rhine-mid", q: 0, r: 2, terrain: "plains", hasRiver: true, label: "Rhine" },
    { id: "rhine-east", q: 2, r: 1, terrain: "plains", hasRiver: true, label: "Rhine" },
    { id: "ruhr-river", q: 3, r: 2, terrain: "plains", hasRiver: true, label: "Ruhr" },
    { id: "north-coast", q: 0, r: -2, terrain: "plains", blockedEdges: [1, 2], label: "North Sea" },
    { id: "west-edge", q: -2, r: 2, terrain: "plains", blockedEdges: [2, 3], label: "Lowlands" },
    { id: "east-hills", q: 4, r: 1, terrain: "hills", label: "Sauerland" },
  ],
};
