"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  useReactFlow,
  type Node,
  type NodeProps,
  type NodeChange,
  type EdgeProps,
} from "@xyflow/react";
import {
  Cloud,
  Database,
  Network,
  Server,
  Plus,
  Minus,
  Scan,
  RotateCcw,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import { architecture } from "@/lib/architecture";
import type { SimulationResult } from "@/types/simulation";

const origins: Record<string, { x: number; y: number }> = {
  cloudfront: { x: 65, y: 190 },
  alb: { x: 345, y: 260 },
  "ec2-a": { x: 610, y: 55 },
  "ec2-b": { x: 685, y: 400 },
  rds: { x: 980, y: 215 },
};

function Planet({ data, selected }: NodeProps) {
  const icons = { cloudfront: Cloud, alb: Network, ec2: Server, rds: Database };
  const Icon = icons[data.type as keyof typeof icons] || Server;
  return (
    <div
      className={`planet-node ${data.type} ${data.status} ${selected ? "selected" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="planet-float">
        <div className="planet-aura" />
        <div className="orbital-ring ring-one" />
        <div className="orbital-ring ring-two" />
        <div className="planet-sphere">
          <div className="sphere-grid" />
          <Icon size={35} strokeWidth={1.2} />
        </div>
        <span className="orbit-satellite" />
      </div>
      <div className="planet-label">
        <span className="planet-status-dot" />
        <strong>{String(data.label)}</strong>
        <span className="planet-index">{String(data.code)}</span>
      </div>
      <div className="planet-detail">
        {data.capacity ? `${data.capacity} REQ/S` : String(data.subtitle)}
        <span> / {String(data.status)}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function Stream(props: EdgeProps) {
  const [path] = getBezierPath(props);
  const color = props.data?.affected ? "#ff847f" : "#9388e9";
  return (
    <g>
      <BaseEdge
        path={path}
        style={{ stroke: color, strokeWidth: 1, opacity: 0.28 }}
      />
      {Boolean(props.data?.moving) && (
        <>
          {[0, 1.6].map((delay) => (
            <circle
              key={delay}
              r="2.5"
              fill={color}
              className="stream-particle"
            >
              <animateMotion
                dur="3.2s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                path={path}
              />
            </circle>
          ))}
        </>
      )}
    </g>
  );
}

const nodeTypes = { planet: Planet };
const edgeTypes = { stream: Stream };

function Navigation({ reset }: { reset: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className="scene-navigation">
      <button aria-label="Zoom in" onClick={() => zoomIn({ duration: 300 })}>
        <Plus size={15} />
      </button>
      <button aria-label="Zoom out" onClick={() => zoomOut({ duration: 300 })}>
        <Minus size={15} />
      </button>
      <span />
      <button
        aria-label="Center universe"
        onClick={() => fitView({ padding: 0.23, duration: 600 })}
      >
        <Scan size={15} />
      </button>
      <button
        aria-label="Reset node positions"
        onClick={() => {
          reset();
          requestAnimationFrame(() =>
            fitView({ padding: 0.23, duration: 600 }),
          );
        }}
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}

export default function UniverseScene({
  result,
  future,
  moving,
  onSelect,
  onHover,
}: {
  result: SimulationResult | null;
  future: boolean;
  moving: boolean;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  const [locations, setLocations] = useState(origins);
  const [hovered, setHovered] = useState<string | null>(null);
  const preview = useMemo(() => {
    const found = new Set<string>();
    const queue = hovered ? [hovered] : [];
    while (queue.length) {
      const id = queue.pop();
      architecture.edges
        .filter((edge) => edge.target === id)
        .forEach((edge) => {
          if (!found.has(edge.source)) {
            found.add(edge.source);
            queue.push(edge.source);
          }
        });
    }
    return found;
  }, [hovered]);
  const nodes: Node[] = architecture.nodes.map((node, index) => ({
    id: node.id,
    type: "planet",
    width: 180,
    height: 190,
    position: locations[node.id],
    data: {
      ...node,
      label: node.type === "alb" ? "Load balancer" : node.label,
      code: `0${index + 1}`,
      subtitle:
        node.type === "rds"
          ? "DATA LAYER"
          : node.type === "alb"
            ? "TRAFFIC ROUTER"
            : "EDGE NETWORK",
      capacity:
        node.type === "ec2"
          ? (result?.assumptions.ec2_capacity_rps ?? node.capacity)
          : undefined,
      status: result?.down.includes(node.id)
        ? "offline"
        : preview.has(node.id) || result?.degraded.includes(node.id)
          ? "exposed"
          : result?.scenario === "traffic" &&
              result.status === "CRITICAL" &&
              node.type === "ec2" &&
              !future
            ? "overload"
            : "nominal",
    },
  }));
  if (future && result?.scenario === "traffic" && result.add_nodes)
    nodes.push({
      id: "expansion",
      type: "planet",
      width: 180,
      height: 190,
      position: locations.expansion || { x: 430, y: 580 },
      data: {
        type: "ec2",
        label: `+${result.add_nodes} compute units`,
        code: "NEW",
        capacity: result.add_nodes * result.assumptions.ec2_capacity_rps,
        status: "proposed",
      },
    });
  const connections = [...architecture.edges];
  if (future && result?.scenario === "traffic" && result.add_nodes)
    connections.push(
      {
        id: "expansion-in",
        source: "alb",
        target: "expansion",
        relationship: "routes",
      },
      {
        id: "expansion-out",
        source: "expansion",
        target: "rds",
        relationship: "depends_on",
      },
    );
  const edges = connections.map((edge) => ({
    ...edge,
    type: "stream",
    data: {
      moving: moving && !result?.down.includes(edge.target),
      affected:
        preview.has(edge.target) ||
        result?.down.includes(edge.target) ||
        result?.degraded.includes(edge.target),
    },
  }));
  function change(changes: NodeChange[]) {
    if (
      !changes.some((change) => change.type === "position" && change.position)
    )
      return;
    setLocations((previous) => {
      const next = { ...previous };
      for (const change of changes) {
        if (change.type === "position" && change.position)
          next[change.id] = change.position;
      }
      return next;
    });
  }
  return (
    <ReactFlowProvider>
      <ReactFlow
        key={future ? "future" : "current"}
        className="universe-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={change}
        onNodeClick={(_, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        onNodeMouseEnter={(_, node) => {
          setHovered(node.id);
          onHover(node.id);
        }}
        onNodeMouseLeave={() => {
          setHovered(null);
          onHover(null);
        }}
        fitView
        fitViewOptions={{ padding: 0.23 }}
        minZoom={0.25}
        maxZoom={1.8}
        nodesConnectable={false}
        colorMode="dark"
      >
        <Navigation reset={() => setLocations(origins)} />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
