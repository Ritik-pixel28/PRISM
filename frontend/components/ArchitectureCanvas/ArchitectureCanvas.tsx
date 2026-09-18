"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type Node,
  type NodeChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ArchitectureNode from "../ArchitectureNode/ArchitectureNode";
import { architecture } from "@/lib/architecture";
import type { SimulationResult } from "@/types/simulation";

const nodeTypes = { architectureNode: ArchitectureNode };
const positions: Record<string, { x: number; y: number }> = {
  cloudfront: { x: 0, y: 120 },
  alb: { x: 265, y: 120 },
  "ec2-a": { x: 535, y: 0 },
  "ec2-b": { x: 535, y: 245 },
  rds: { x: 810, y: 120 },
  proposed: { x: 535, y: 490 },
};

export default function ArchitectureCanvas({
  result,
  future,
  preview,
  onSelect,
  onHover,
}: {
  result: SimulationResult | null;
  future: boolean;
  preview: string[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const [locations, setLocations] = useState(positions);
  const nodes = useMemo<Node[]>(() => {
    const base = architecture.nodes.map((node) => ({
      id: node.id,
      type: "architectureNode",
      width: 190,
      height: 151,
      position: locations[node.id],
      data: {
        ...node,
        capacity:
          node.type === "ec2"
            ? result?.assumptions.ec2_capacity_rps || node.capacity
            : undefined,
        status: result?.down.includes(node.id)
          ? "down"
          : preview.includes(node.id) || result?.degraded.includes(node.id)
            ? "degraded"
            : !future &&
                result?.scenario === "traffic" &&
                result.status === "CRITICAL" &&
                node.type === "ec2"
              ? "saturated"
              : "healthy",
      },
    }));
    if (future && result?.scenario === "traffic" && result.add_nodes > 0)
      base.push({
        id: "proposed",
        type: "architectureNode",
        width: 190,
        height: 151,
        position: locations.proposed,
        data: {
          id: "proposed",
          label: `+${result.add_nodes} compute units`,
          type: "ec2",
          category: "compute",
          capacity: result.add_nodes * result.assumptions.ec2_capacity_rps,
          status: "proposed",
        },
      });
    return base;
  }, [locations, result, future, preview]);
  const edges = architecture.edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    animated: !result?.down.includes(edge.target),
    style: {
      stroke:
        result?.down.includes(edge.target) || preview.includes(edge.target)
          ? "#ed816a"
          : "#6bada0",
      strokeWidth: 1.5,
      opacity: 0.65,
    },
  }));
  if (future && result?.add_nodes && result.scenario === "traffic")
    edges.push(
      ...[
        { id: "proposed-in", source: "alb", target: "proposed" },
        { id: "proposed-out", source: "proposed", target: "rds" },
      ].map((edge) => ({
        ...edge,
        relationship: "routes",
        type: "smoothstep",
        animated: true,
        style: { stroke: "#baf780", strokeWidth: 1.5, opacity: 0.8 },
      })),
    );
  function change(changes: NodeChange[]) {
    if (!changes.some((change) => change.type === "position")) return;
    const updated = applyNodeChanges(changes, nodes);
    setLocations((previous) => ({
      ...previous,
      ...Object.fromEntries(
        updated.map((n) => [n.id, n.position]),
      ),
    }));
  }
  return (
    <ReactFlow
      key={future ? "future" : "current"}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={change}
      onNodeClick={(_, node) => onSelect(node.id)}
      onNodeMouseEnter={(_, node) => onHover(node.id)}
      onNodeMouseLeave={() => onHover(null)}
      fitView
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.3}
      maxZoom={1.6}
      nodesConnectable={false}
      colorMode="dark"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1}
        color="#293b38"
      />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
