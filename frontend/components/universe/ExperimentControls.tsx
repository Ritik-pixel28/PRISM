"use client";

import {
  ArrowUpRight,
  GitBranch,
  LoaderCircle,
  Play,
  Wallet,
  Zap,
} from "lucide-react";
import { architecture } from "@/lib/architecture";
import type { Scenario } from "@/types/simulation";

export const stressors = [
  {
    type: "traffic",
    title: "Traffic surge",
    detail: "Push your system past its comfort zone.",
    icon: Zap,
    number: "01",
  },
  {
    type: "failure",
    title: "Dependency failure",
    detail: "Pull one thread. See what unravels.",
    icon: GitBranch,
    number: "02",
  },
  {
    type: "cost",
    title: "Budget pressure",
    detail: "Find the tradeoff behind every dollar.",
    icon: Wallet,
    number: "03",
  },
] as const;

export default function ExperimentControls({
  scenario,
  onChange,
  busy,
  onRun,
  compact = false,
  baseline,
}: {
  scenario: Scenario;
  onChange: (next: Scenario) => void;
  busy: boolean;
  onRun: () => void;
  compact?: boolean;
  baseline: number;
}) {
  function choose(type: Scenario["type"]) {
    onChange(
      type === "traffic"
        ? { type, multiplier: 10 }
        : type === "failure"
          ? { type, node_id: "rds" }
          : { type, budget: 380 },
    );
  }
  return (
    <div className={`experiment-controls ${compact ? "compact" : "expanded"}`}>
      <div className="stressor-options">
        {stressors.map((item) => (
          <button
            key={item.type}
            aria-label={item.title}
            disabled={busy}
            aria-pressed={scenario.type === item.type}
            onClick={() => choose(item.type)}
            className={`stressor ${scenario.type === item.type ? "active" : ""}`}
          >
            <item.icon size={compact ? 15 : 25} strokeWidth={1.4} />
            <span>
              <strong>{item.title}</strong>
              {!compact && <small>{item.detail}</small>}
            </span>
            {!compact && <em>{item.number}</em>}
          </button>
        ))}
      </div>
      <div className="scenario-parameters">
        {scenario.type === "traffic" ? (
          <>
            <div className="input-heading">
              <label htmlFor={compact ? "quick-traffic" : "lab-traffic"}>
                Traffic multiplier
              </label>
              <span>01 — 20×</span>
            </div>
            <div className="traffic-reading">
              <strong>
                {scenario.multiplier}
                <i>×</i>
              </strong>
              <span>
                {(baseline * scenario.multiplier).toLocaleString()}
                <small>MODELED REQ/S</small>
              </span>
            </div>
            <input
              id={compact ? "quick-traffic" : "lab-traffic"}
              type="range"
              min="1"
              max="20"
              value={scenario.multiplier}
              disabled={busy}
              onChange={(event) =>
                onChange({ type: "traffic", multiplier: +event.target.value })
              }
            />
            <div className="traffic-presets">
              {[1, 5, 10, 20].map((value) => (
                <button
                  key={value}
                  disabled={busy}
                  className={scenario.multiplier === value ? "active" : ""}
                  onClick={() =>
                    onChange({ type: "traffic", multiplier: value })
                  }
                >
                  {value}×
                </button>
              ))}
            </div>
          </>
        ) : scenario.type === "failure" ? (
          <>
            <label htmlFor={compact ? "quick-fault" : "lab-fault"}>
              Select a dependency
            </label>
            <select
              id={compact ? "quick-fault" : "lab-fault"}
              disabled={busy}
              value={scenario.node_id}
              onChange={(event) =>
                onChange({ type: "failure", node_id: event.target.value })
              }
            >
              {architecture.nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </select>
            <p>
              Trace potential upstream impact. No real infrastructure is
              touched.
            </p>
          </>
        ) : (
          <>
            <label htmlFor={compact ? "quick-budget" : "lab-budget"}>
              Monthly budget assumption
            </label>
            <div className="money-input">
              <span>$</span>
              <input
                id={compact ? "quick-budget" : "lab-budget"}
                type="number"
                min="0"
                max="1000000"
                value={scenario.budget}
                disabled={busy}
                onChange={(event) =>
                  onChange({ type: "cost", budget: +event.target.value })
                }
              />
              <small>/ mo</small>
            </div>
            <p>Preserve fixed services. See how much compute remains.</p>
          </>
        )}
      </div>
      <button className="launch-button" onClick={onRun} disabled={busy}>
        {busy ? (
          <LoaderCircle size={16} className="spin" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        <span>{busy ? "Computing experiment" : "Launch simulation"}</span>
        <ArrowUpRight size={17} />
      </button>
    </div>
  );
}
