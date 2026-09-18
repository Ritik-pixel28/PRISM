"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Cloud, Network, Server, Database } from "lucide-react";

export default function ArchitectureNode({ data, selected }: NodeProps) {
  const icons = { cloudfront: Cloud, alb: Network, ec2: Server, rds: Database };
  const type = data.type as keyof typeof icons;
  const Icon = icons[type] || Server;
  return (
    <div
      className={`service-node ${data.status || "healthy"} ${selected ? "selected" : ""} ${data.proposed ? "proposed" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      <div className="service-head">
        <span className={`service-icon ${type}`}>
          <Icon size={21} strokeWidth={1.5} />
        </span>
        <span className="node-indicator" />
      </div>
      <strong>{String(data.label)}</strong>
      <span className="service-kind">
        {type === "ec2"
          ? "COMPUTE INSTANCE"
          : type === "alb"
            ? "LOAD BALANCER"
            : type === "rds"
              ? "RELATIONAL DATABASE"
              : "CONTENT DELIVERY"}
      </span>
      <div className="service-bottom">
        <span>
          {data.capacity
            ? `${data.capacity} req/s`
            : type === "rds"
              ? "Single dependency"
              : "Request routing"}
        </span>
        <span>{String(data.status || "healthy")}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
