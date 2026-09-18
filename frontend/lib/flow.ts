import type { Node, Edge } from "@xyflow/react";
import type { Architecture } from "../types/architecture";

export function createFlowNodes(architecture: Architecture): Node[] {
  const positions: Record<string, { x: number; y: number }> = {
    cloudfront: { x: 450, y: 50 },
    alb: { x: 450, y: 220 },
    "ec2-a": { x: 250, y: 400 },
    "ec2-b": { x: 650, y: 400 },
    rds: { x: 450, y: 580 },
  };

  return architecture.nodes.map((node) => ({
    id: node.id,
    position: positions[node.id] ?? { x: 0, y: 0 },
    data: {
      label: node.label,
      type: node.type,
      category: node.category,
      capacity: node.capacity,
    },
    type: "architectureNode",
  }));
}

export function createFlowEdges(architecture: Architecture): Edge[] {
  return architecture.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.relationship,
    type: "smoothstep",
  }));
}
