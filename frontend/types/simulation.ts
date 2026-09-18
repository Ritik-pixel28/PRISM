export type Scenario =
  | { type: "traffic"; multiplier: number }
  | { type: "failure"; node_id: string }
  | { type: "cost"; budget: number };
export type Assumptions = Record<string, number>;
export interface SimulationResult {
  scenario: string;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  current_capacity: number;
  required_capacity: number;
  utilization_pct: number | null;
  deficit: number;
  current_nodes: number;
  add_nodes: number;
  needed_nodes?: number;
  affordable_nodes?: number;
  budget_feasible?: boolean;
  cost_current: number;
  cost_proposed: number;
  cost_delta: number;
  impact_pct?: number;
  down: string[];
  degraded: string[];
  healthy: string[];
  math: string[];
  recommendation: string;
  explanation: string;
  explanation_source: string;
  assumptions: Assumptions;
  limitations: string[];
  model_version: string;
}
