/**
 * 功能概述：根据轨道段、地图和锚点构造完整 link 与未完成连接。
 * 输入输出：输入 segment、地图图索引和锚点；输出 link 列表。
 * 处理流程：按 segment 连通性聚合组件，记录接触到的 stop 与锚点所有权。
 */

import type { MapHexDefinition } from "../contracts/domain";
import type { LinkState, TokenAnchorState, TrackSegmentState } from "../state/gameState";
import { createMapGraph, getNeighborHex } from "./mapGraph";
import { oppositeEdge } from "./hexMath";

function isStopHex(hex: MapHexDefinition | null) {
  return Boolean(hex && (hex.terrain === "city" || hex.isTown));
}

function segmentTouches(
  segment: TrackSegmentState,
  allSegments: readonly TrackSegmentState[],
  mapById: Record<string, MapHexDefinition>,
) {
  const neighbors = new Set<string>();
  const touchedStops = new Set<string>();
  const graph = createMapGraph({ id: "temp", name: "temp", hexes: Object.values(mapById) });

  for (const endpoint of segment.endpoints) {
    const currentHex = mapById[endpoint.hexId];
    if (!currentHex) {
      continue;
    }

    if (endpoint.edge === "town" && currentHex.isTown) {
      touchedStops.add(currentHex.id);
    }

    for (const candidate of allSegments) {
      if (candidate.id === segment.id) {
        continue;
      }
      const sharesTown = candidate.endpoints.some(
        (candidateEndpoint) =>
          candidateEndpoint.hexId === endpoint.hexId
          && candidateEndpoint.edge === "town"
          && endpoint.edge === "town"
          && currentHex.isTown,
      );
      if (sharesTown) {
        neighbors.add(candidate.id);
        continue;
      }
      if (endpoint.edge === "town") {
        continue;
      }
      const matches = candidate.endpoints.some(
        (candidateEndpoint) =>
          candidateEndpoint.hexId !== endpoint.hexId &&
          candidateEndpoint.edge !== "town" &&
          endpoint.edge !== "town" &&
          candidateEndpoint.edge === oppositeEdge(endpoint.edge) &&
          mapById[candidateEndpoint.hexId] &&
          getNeighborHex(graph, currentHex, endpoint.edge)?.id === candidateEndpoint.hexId,
      );
      if (matches) {
        neighbors.add(candidate.id);
      }
    }

    if (endpoint.edge === "town") {
      continue;
    }

    const neighborHex = getNeighborHex(graph, currentHex, endpoint.edge);
    if (isStopHex(neighborHex)) {
      touchedStops.add(neighborHex!.id);
    }
  }

  return { neighbors: [...neighbors], touchedStops: [...touchedStops] };
}

export function buildLinks(options: {
  segments: readonly TrackSegmentState[];
  mapHexes: readonly MapHexDefinition[];
  anchors: readonly TokenAnchorState[];
}): LinkState[] {
  const mapById = Object.fromEntries(options.mapHexes.map((hex) => [hex.id, hex]));
  const visited = new Set<string>();
  const links: LinkState[] = [];

  for (const segment of options.segments) {
    if (visited.has(segment.id)) {
      continue;
    }

    const queue = [segment.id];
    const component = new Set<string>();
    const touchedStops = new Set<string>();
    const anchors = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);
      component.add(currentId);

      const currentSegment = options.segments.find((item) => item.id === currentId)!;
      const touchInfo = segmentTouches(currentSegment, options.segments, mapById);
      touchInfo.touchedStops.forEach((stopId) => touchedStops.add(stopId));

      const anchor = options.anchors.find((item) => item.segmentId === currentId);
      if (anchor) {
        anchors.add(anchor.playerId);
      }

      for (const neighborId of touchInfo.neighbors) {
        if (!visited.has(neighborId)) {
          queue.push(neighborId);
        }
      }
    }

    links.push({
      id: `link-${links.length + 1}`,
      segmentIds: [...component],
      ownerId: anchors.size === 1 ? [...anchors][0] : null,
      touchedStops: [...touchedStops],
      complete: touchedStops.size >= 2,
    });
  }

  return links;
}
