"use client";

import {
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileText,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import {
  decisionRecord,
  downloadDecision,
  scenarioName,
  type Experiment,
} from "@/lib/experiments";

export default function Analysis({
  experiment,
  onExplore,
}: {
  experiment: Experiment | null;
  onExplore: () => void;
}) {
  const [documentOpen, setDocumentOpen] = useState(false);
  const [copyState, setCopyState] = useState("");
  if (!experiment)
    return (
      <div className="empty-space">
        <div className="empty-orbit">
          <Sparkles size={36} />
        </div>
        <span className="eyebrow">NO SIGNAL YET</span>
        <h1>
          Every answer starts
          <br />
          with an experiment.
        </h1>
        <p>
          Launch a simulation to reveal its capacity, cost, and dependency
          impact.
        </p>
        <a className="primary-link" href="#lab">
          Enter the experiment lab <ArrowUpRight size={15} />
        </a>
      </div>
    );
  const { result } = experiment;
  const maximum = Math.max(
    result.required_capacity,
    result.current_capacity,
    1,
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(decisionRecord(experiment!));
      setCopyState("Copied");
    } catch {
      setCopyState("Select the text below to copy");
    }
  }
  return (
    <div className="analysis-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">
            EXPERIMENT / {experiment.id.slice(0, 8).toUpperCase()}
          </span>
          <h1>
            The signal.
            <br />
            <span>Beyond the noise.</span>
          </h1>
          <p>
            {scenarioName(experiment.scenario)} ·{" "}
            {new Date(experiment.date).toLocaleString()}
          </p>
        </div>
        <button
          className="secondary-button"
          onClick={() => downloadDecision(experiment)}
        >
          <Download size={15} /> Export decision
        </button>
      </div>
      <div className={`finding-banner ${result.status.toLowerCase()}`}>
        <span className="status-light" />
        <div>
          <span className="eyebrow">{result.status} / SIMULATED OUTCOME</span>
          <h2>{result.recommendation}</h2>
        </div>
        <button
          className="circle-button"
          aria-label="Explore result in universe"
          onClick={onExplore}
        >
          <ArrowUpRight size={21} />
        </button>
      </div>
      <div className="analysis-grid">
        <section className="glass-card capacity-card">
          <span className="eyebrow">
            {result.scenario === "failure"
              ? "COMPUTE CAPACITY BEFORE THE FAULT"
              : "DEMAND VS CAPACITY"}
          </span>
          <div className="horizontal-chart">
            <div>
              <span>Required throughput</span>
              <strong>
                {result.required_capacity.toLocaleString()} <small>req/s</small>
              </strong>
            </div>
            <i
              style={{
                width: `${Math.max(2, (result.required_capacity / maximum) * 100)}%`,
              }}
            />
            <div>
              <span>
                {result.scenario === "cost"
                  ? "Retained capacity"
                  : "Installed capacity"}
              </span>
              <strong>
                {result.current_capacity.toLocaleString()} <small>req/s</small>
              </strong>
            </div>
            <i
              className="capacity-bar"
              style={{
                width: `${Math.max(2, (result.current_capacity / maximum) * 100)}%`,
              }}
            />
          </div>
          <div className="analysis-numbers">
            <div>
              <strong>
                {result.utilization_pct === null
                  ? "∞"
                  : `${result.utilization_pct}%`}
              </strong>
              <span>Modeled utilization</span>
            </div>
            <div>
              <strong>
                {result.scenario === "failure"
                  ? `${result.impact_pct}%`
                  : result.deficit.toLocaleString()}
              </strong>
              <span>
                {result.scenario === "failure"
                  ? "Potential service impact"
                  : "Capacity deficit · req/s"}
              </span>
            </div>
          </div>
        </section>
        <section className="glass-card cost-analysis">
          <span className="eyebrow">COST OF THE DECISION</span>
          <div className="cost-comparison">
            <div>
              <span>Current</span>
              <strong>${result.cost_current.toLocaleString()}</strong>
            </div>
            <ArrowUpRight size={23} />
            <div>
              <span>Proposed</span>
              <strong>${result.cost_proposed.toLocaleString()}</strong>
            </div>
          </div>
          <div className="cost-delta">
            {result.cost_delta >= 0 ? "+" : "−"}$
            {Math.abs(result.cost_delta).toLocaleString()}
            <span>modeled monthly change</span>
          </div>
          <p>
            Editable estimates, not AWS prices. No resources have been
            provisioned.
          </p>
        </section>
        <section className="glass-card math-card">
          <div className="section-heading">
            <span className="eyebrow">
              <Terminal size={14} /> THE PROOF, LINE BY LINE
            </span>
            <span className="small-tag">DETERMINISTIC</span>
          </div>
          <ol>
            {result.math.map((line, index) => (
              <li key={line}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <code>{line}</code>
                <Check size={13} />
              </li>
            ))}
          </ol>
        </section>
        <section className="glass-card explanation-card">
          <span className="eyebrow">
            <Sparkles size={14} />{" "}
            {result.explanation_source === "bedrock"
              ? "BEDROCK INTERPRETATION"
              : "MODEL INTERPRETATION"}
          </span>
          <p>{result.explanation}</p>
          <button
            className="text-link"
            onClick={() => setDocumentOpen(!documentOpen)}
          >
            <FileText size={14} />{" "}
            {documentOpen ? "Close decision record" : "Read decision record"}
            <ArrowUpRight size={13} />
          </button>
        </section>
      </div>
      {documentOpen && (
        <section className="glass-card decision-preview">
          <div className="section-heading">
            <h3>Architectural decision record</h3>
            <button className="secondary-button" onClick={copy}>
              <Copy size={14} /> {copyState || "Copy Markdown"}
            </button>
          </div>
          <pre tabIndex={0}>{decisionRecord(experiment)}</pre>
        </section>
      )}
      <details className="model-boundaries">
        <summary>What this model does and does not claim</summary>
        <ul>
          {result.limitations.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
