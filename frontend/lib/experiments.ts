import { architecture } from "@/lib/architecture";
import type {
  Assumptions,
  Scenario,
  SimulationResult,
} from "@/types/simulation";

export const defaults: Assumptions = {
  baseline_traffic_rps: 100,
  ec2_capacity_rps: 150,
  ec2_cost_monthly: 100,
  rds_cost_monthly: 200,
  alb_cost_monthly: 50,
  cloudfront_cost_monthly: 30,
};

export const assumptionLabels: Record<string, string> = {
  baseline_traffic_rps: "Baseline traffic · req/s",
  ec2_capacity_rps: "Compute capacity · req/s",
  ec2_cost_monthly: "Compute · $/month",
  rds_cost_monthly: "Database · $/month",
  alb_cost_monthly: "Load balancer · $/month",
  cloudfront_cost_monthly: "CDN · $/month",
};

export interface Experiment {
  id: string;
  date: string;
  scenario: Scenario;
  result: SimulationResult;
}

export function scenarioName(scenario: Scenario) {
  if (scenario.type === "traffic")
    return `${scenario.multiplier}× traffic surge`;
  if (scenario.type === "failure")
    return `${scenario.node_id.toUpperCase()} failure`;
  return `$${scenario.budget} budget constraint`;
}

export function decisionRecord(experiment: Experiment) {
  const { result, scenario, date } = experiment;
  return [
    "# PRISM architectural decision record",
    `Experiment: ${experiment.id}\nDate: ${date}\nModel: ${result.model_version}`,
    "## Scenario",
    JSON.stringify(scenario, null, 2),
    "## Architecture",
    JSON.stringify(architecture, null, 2),
    "## Decision",
    result.recommendation,
    "## Evidence",
    ...result.math,
    "## Assumptions",
    JSON.stringify(result.assumptions, null, 2),
    "## Modeled monthly cost",
    `Current: $${result.cost_current}; proposed: $${result.cost_proposed}`,
    "## Limitations",
    ...result.limitations,
  ].join("\n\n");
}

export function downloadDecision(experiment: Experiment) {
  const url = URL.createObjectURL(
    new Blob([decisionRecord(experiment)], { type: "text/markdown" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `prism-${experiment.id}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
