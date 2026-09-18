import assert from "node:assert/strict";
import { test } from "node:test";
import { readExperiments } from "../lib/history.ts";

const experiment = {
  id: "test-run",
  date: "2026-09-18T12:00:00Z",
  scenario: { type: "traffic", multiplier: 10 },
  result: {
    scenario: "traffic",
    status: "CRITICAL",
    current_capacity: 300,
    required_capacity: 1000,
    current_nodes: 2,
    add_nodes: 5,
    cost_current: 480,
    cost_proposed: 980,
    cost_delta: 500,
    deficit: 700,
    utilization_pct: 333.3,
    math: ["Add = ceil(700 / 150) = 5"],
    down: [],
    degraded: [],
    healthy: ["ec2-a", "ec2-b"],
    limitations: ["Compute-only capacity"],
    explanation: "Modeled result",
    explanation_source: "deterministic",
    model_version: "1.0",
    recommendation: "Add 5 compute units",
    assumptions: { ec2_capacity_rps: 150, baseline_traffic_rps: 100 },
  },
};

test("restores a complete experiment without changing its evidence", () => {
  assert.deepEqual(readExperiments(JSON.stringify([experiment])), [experiment]);
});

test("discards corrupted entries while preserving valid history", () => {
  const malformed = {
    ...experiment,
    result: { ...experiment.result, status: null },
  };
  assert.deepEqual(
    readExperiments(JSON.stringify([null, {}, malformed, experiment])),
    [experiment],
  );
  for (const raw of [null, "broken", "{}", "null"])
    assert.deepEqual(readExperiments(raw), []);
});

test("deduplicates IDs and bounds retained history", () => {
  const entries = Array.from({ length: 40 }, (_, index) => ({
    ...experiment,
    id: String(index),
  }));
  assert.equal(readExperiments(JSON.stringify(entries)).length, 30);
  assert.equal(
    readExperiments(JSON.stringify([experiment, experiment])).length,
    1,
  );
});

test("rejects incomplete scenario-specific evidence", () => {
  const failure = {
    ...experiment,
    scenario: { type: "failure", node_id: "rds" },
    result: { ...experiment.result, scenario: "failure" },
  };
  assert.deepEqual(readExperiments(JSON.stringify([failure])), []);
  assert.equal(
    readExperiments(
      JSON.stringify([
        { ...failure, result: { ...failure.result, impact_pct: 100 } },
      ]),
    ).length,
    1,
  );
});
