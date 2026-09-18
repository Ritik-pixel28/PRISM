export type NodeCategory =
  "edge" | "load_balancer" | "compute" | "database" | "storage" | "serverless";

export interface ArchitectureNode {
  id: string;
  type: string;
  label: string;
  category: NodeCategory;
  capacity?: number;
  unit?: string;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

export interface Architecture {
  id: string;
  name: string;
  description: string;
  region: string;
  environment: string;

  traffic: {
    baseline: number;
    unit: string;
  };

  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}
