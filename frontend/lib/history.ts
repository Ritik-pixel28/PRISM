import type { Experiment } from "./experiments";

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function strings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function validExperiment(value: unknown): value is Experiment {
  if (!value || typeof value !== "object") return false;
  const item = value as Experiment;
  const result = item.result;
  const scenario = item.scenario;
  if (
    !result ||
    !scenario ||
    typeof item.id !== "string" ||
    typeof item.date !== "string" ||
    !Number.isFinite(Date.parse(item.date))
  )
    return false;
  if (
    scenario.type === "traffic"
      ? !finite(scenario.multiplier)
      : scenario.type === "failure"
        ? typeof scenario.node_id !== "string"
        : scenario.type === "cost"
          ? !finite(scenario.budget)
          : true
  )
    return false;
  if (
    !["HEALTHY", "WARNING", "CRITICAL"].includes(result.status) ||
    result.scenario !== scenario.type
  )
    return false;
  const numericFields = [
    result.current_capacity,
    result.required_capacity,
    result.current_nodes,
    result.add_nodes,
    result.cost_current,
    result.cost_proposed,
    result.cost_delta,
    result.deficit,
  ];
  if (
    !numericFields.every(finite) ||
    (result.utilization_pct !== null && !finite(result.utilization_pct))
  )
    return false;
  if (scenario.type === "failure" && !finite(result.impact_pct)) return false;
  if (scenario.type === "cost" && !finite(result.affordable_nodes))
    return false;
  if (
    ![
      result.math,
      result.limitations,
      result.down,
      result.degraded,
      result.healthy,
    ].every(strings)
  )
    return false;
  if (
    ![
      result.explanation,
      result.explanation_source,
      result.model_version,
      result.recommendation,
    ].every((value) => typeof value === "string")
  )
    return false;
  return (
    !!result.assumptions &&
    typeof result.assumptions === "object" &&
    Object.values(result.assumptions).every(finite) &&
    finite(result.assumptions.ec2_capacity_rps) &&
    finite(result.assumptions.baseline_traffic_rps)
  );
}

export function readExperiments(raw: string | null): Experiment[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter(validExperiment)
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 30);
  } catch {
    return [];
  }
}
