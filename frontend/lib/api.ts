import type { Architecture } from "@/types/architecture";
import type {
  Assumptions,
  Scenario,
  SimulationResult,
} from "@/types/simulation";

export async function simulate(
  architecture: Architecture,
  scenario: Scenario,
  assumptions: Assumptions,
): Promise<SimulationResult> {
  const response = await fetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ architecture, scenario, assumptions }),
    signal: AbortSignal.timeout(18000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Simulation failed");
  return body;
}
