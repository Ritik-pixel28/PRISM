"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  FlaskConical,
  GitBranch,
  Layers,
  LoaderCircle,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  Triangle,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import ArchitectureCanvas from "@/components/ArchitectureCanvas/ArchitectureCanvas";
import { architecture } from "@/lib/architecture";
import { simulate } from "@/lib/api";
import type {
  Assumptions,
  Scenario,
  SimulationResult,
} from "@/types/simulation";

const defaults = {
  baseline_traffic_rps: 100,
  ec2_capacity_rps: 150,
  ec2_cost_monthly: 100,
  rds_cost_monthly: 200,
  alb_cost_monthly: 50,
  cloudfront_cost_monthly: 30,
};
const labels: Record<string, string> = {
  baseline_traffic_rps: "Baseline traffic · req/s",
  ec2_capacity_rps: "Compute capacity · req/s",
  ec2_cost_monthly: "Compute · $/month",
  rds_cost_monthly: "Database · $/month",
  alb_cost_monthly: "Load balancer · $/month",
  cloudfront_cost_monthly: "CDN · $/month",
};
type Run = { result: SimulationResult; scenario: Scenario; time: string };

export default function Home() {
  const [mode, setMode] = useState<"traffic" | "failure" | "cost">("traffic");
  const [multiplier, setMultiplier] = useState(10);
  const [failed, setFailed] = useState("rds");
  const [budget, setBudget] = useState(380);
  const [assumptions, setAssumptions] = useState<Assumptions>(defaults);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [future, setFuture] = useState(false);
  const [modal, setModal] = useState<"assumptions" | "help" | "history" | null>(
    null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [math, setMath] = useState(false);
  const [dirty, setDirty] = useState(false);
  const preview = new Set<string>();
  if (hovered) {
    const queue = [hovered];
    while (queue.length) {
      const id = queue.pop();
      architecture.edges
        .filter((e) => e.target === id)
        .forEach((e) => {
          if (!preview.has(e.source)) {
            preview.add(e.source);
            queue.push(e.source);
          }
        });
    }
  }
  const scenario: Scenario =
    mode === "traffic"
      ? { type: mode, multiplier }
      : mode === "failure"
        ? { type: mode, node_id: failed }
        : { type: mode, budget };
  async function run() {
    setBusy(true);
    setError("");
    try {
      const next = await simulate(architecture, scenario, assumptions);
      setResult(next);
      setDirty(false);
      setFuture(false);
      setRuns((previous) =>
        [
          { result: next, scenario, time: new Date().toLocaleTimeString() },
          ...previous,
        ].slice(0, 20),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to run simulation",
      );
    } finally {
      setBusy(false);
    }
  }
  function exportAdr() {
    if (!result) return;
    const latest = runs.find((r) => r.result === result);
    const text = [
      `# PRISM architectural decision record`,
      `Date: ${new Date().toISOString()}`,
      `Model: ${result.model_version}`,
      `## Architecture`,
      JSON.stringify(architecture, null, 2),
      `## Scenario`,
      JSON.stringify(latest?.scenario),
      `## Decision`,
      result.recommendation,
      `## Evidence`,
      ...result.math,
      `## Assumptions`,
      JSON.stringify(result.assumptions, null, 2),
      `## Estimated monthly cost`,
      `Current: $${result.cost_current}; proposed: $${result.cost_proposed}`,
      `## Limitations`,
      ...result.limitations,
    ].join("\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "prism-decision-record.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function reset() {
    setResult(null);
    setFuture(false);
    setSelected(null);
    setDirty(false);
    setError("");
    setMultiplier(10);
    setMode("traffic");
    setAssumptions(defaults);
    setBudget(380);
    setFailed("rds");
  }
  const utilization = result ? result.utilization_pct : null;
  const selectedNode = architecture.nodes.find((node) => node.id === selected);
  return (
    <main className="observatory">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-symbol">
            <Triangle size={25} />
          </span>
          PRISM
          <span className="brand-divider" />{" "}
          <span className="brand-subtitle">RESILIENCE LAB</span>
        </Link>
        <div className="top-center">
          <span className="live-dot" /> LOCAL SANDBOX{" "}
          <span className="top-separator">/</span> us-east-1
        </div>
        <button className="quiet-button" onClick={() => setModal("help")}>
          <CircleHelp size={15} /> Field guide <ChevronRight size={13} />
        </button>
      </header>
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">WORKSPACE / EXPERIMENT 001</div>
          <h1>
            Break it here.<span> Not out there.</span>
          </h1>
          <p>
            Explore the limits of your infrastructure before production does.
          </p>
        </div>
        <button
          className="outline-button"
          disabled={!result}
          onClick={exportAdr}
        >
          <Download size={15} /> Export decision{" "}
          <span className="keycap">↓</span>
        </button>
      </div>
      <div className="lab-layout">
        <aside className="control-panel">
          <div className="panel-label">
            <FlaskConical size={15} /> EXPERIMENT SETUP <span>01</span>
          </div>
          <div className="control-content">
            <div className="eyebrow">CHOOSE A STRESSOR</div>
            <div className="scenario-list">
              {(
                [
                  {
                    id: "traffic",
                    name: "Traffic surge",
                    desc: "Find your breaking point",
                    icon: Zap,
                  },
                  {
                    id: "failure",
                    name: "Dependency failure",
                    desc: "Follow the blast radius",
                    icon: GitBranch,
                  },
                  {
                    id: "cost",
                    name: "Budget pressure",
                    desc: "Balance spend and capacity",
                    icon: Wallet,
                  },
                ] as const
              ).map((item) => (
                <button
                  disabled={busy}
                  key={item.id}
                  className={`scenario-button ${mode === item.id ? "active" : ""}`}
                  onClick={() => {
                    setMode(item.id);
                    setDirty(true);
                  }}
                >
                  <item.icon size={18} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.desc}</small>
                  </span>
                  <span className="radio-dot" />
                </button>
              ))}
            </div>
            <div className="parameter-section">
              {mode === "traffic" ? (
                <>
                  <div className="parameter-heading">
                    <span>Traffic multiplier</span>
                    <Zap size={13} />
                  </div>
                  <div className="multiplier">
                    {multiplier}
                    <span>×</span>
                    <small>baseline load</small>
                  </div>
                  <input
                    aria-label="Traffic multiplier"
                    disabled={busy}
                    type="range"
                    min="1"
                    max="20"
                    value={multiplier}
                    onChange={(e) => {
                      setMultiplier(+e.target.value);
                      setDirty(true);
                    }}
                  />
                  <div className="range-labels">
                    <span>1× NORMAL</span>
                    <span>20× EXTREME</span>
                  </div>
                  <div className="preset-row">
                    {[1, 5, 10, 20].map((n) => (
                      <button
                        disabled={busy}
                        className={multiplier === n ? "chosen" : ""}
                        key={n}
                        onClick={() => {
                          setMultiplier(n);
                          setDirty(true);
                        }}
                      >
                        {n}×
                      </button>
                    ))}
                  </div>
                  <div className="demand-note">
                    <ArrowDownRight size={15} />
                    <span>
                      {assumptions.baseline_traffic_rps.toLocaleString()} →{" "}
                      <b>
                        {(
                          assumptions.baseline_traffic_rps * multiplier
                        ).toLocaleString()}{" "}
                        req/s
                      </b>
                    </span>
                  </div>
                </>
              ) : mode === "failure" ? (
                <>
                  <label htmlFor="failure-node">Inject failure into</label>
                  <select
                    id="failure-node"
                    disabled={busy}
                    value={failed}
                    onChange={(e) => {
                      setFailed(e.target.value);
                      setDirty(true);
                    }}
                  >
                    {architecture.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                  <p className="muted-copy">
                    Trace all upstream dependencies. Hover any service to
                    preview potential impact.
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="budget">Monthly budget assumption</label>
                  <div className="budget-field">
                    <span>$</span>
                    <input
                      id="budget"
                      disabled={busy}
                      type="number"
                      min="0"
                      max="1000000"
                      value={budget}
                      onChange={(e) => {
                        setBudget(+e.target.value);
                        setDirty(true);
                      }}
                    />
                  </div>
                  <p className="muted-copy">
                    Retain the highest-capacity compute units within your
                    modeled budget.
                  </p>
                </>
              )}
            </div>
            <button
              className="assumption-button"
              onClick={() => setModal("assumptions")}
            >
              <Settings2 size={15} />
              <span>Model assumptions</span>
              <ChevronRight size={14} />
            </button>
            <button className="run-button" onClick={run} disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Play size={15} fill="currentColor" />
              )}
              {busy ? "Running experiment…" : "Run simulation"}
              <span>↗</span>
            </button>
            <div className="safe-note">
              <ShieldCheck size={12} /> No production resources touched
            </div>
          </div>
          <div className="control-footer">
            <span className="tiny-orbit" />
            <div>
              Make failure a finding.
              <br />
              <span>Not an incident.</span>
            </div>
          </div>
        </aside>
        <section className="main-stage">
          <div className="canvas-toolbar">
            <div>
              <span className="live-dot" />
              <strong>Web application</strong>
              <span className="pill">5 SERVICES</span>
            </div>
            <button
              className="icon-button"
              title="Reset experiment"
              aria-label="Reset experiment"
              onClick={reset}
              disabled={busy}
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <div className="canvas-tabs">
            <button
              className={!future ? "active" : ""}
              onClick={() => setFuture(false)}
            >
              <Layers size={13} /> Current architecture
            </button>
            <button
              className={future ? "active" : ""}
              disabled={!result || result.scenario !== "traffic"}
              onClick={() => setFuture(true)}
            >
              <Sparkles size={13} /> Proposed state{" "}
              {result?.add_nodes ? <span>+{result.add_nodes}</span> : null}
            </button>
          </div>
          <div className="canvas-area">
            <div className="canvas-coordinate">
              TOPOLOGY / {future ? "PROPOSED" : "CURRENT"}
              <span>REGION: US-EAST-1</span>
            </div>
            <ArchitectureCanvas
              result={result}
              future={future}
              preview={[...preview]}
              onSelect={setSelected}
              onHover={setHovered}
            />
            <div className="canvas-caption">
              {hovered
                ? `DEPENDENCY PREVIEW · ${preview.size} potentially affected upstream services`
                : "DRAG TO EXPLORE · SCROLL TO ZOOM · HOVER TO TRACE IMPACT"}
            </div>
            {selectedNode && (
              <div className="node-inspector">
                <button
                  aria-label="Close service details"
                  className="icon-button"
                  onClick={() => setSelected(null)}
                >
                  <X size={13} />
                </button>
                <div className="eyebrow">SERVICE INSPECTOR</div>
                <strong>{selectedNode.label}</strong>
                <p>
                  {selectedNode.id} · {selectedNode.category}
                </p>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => {
                    setFailed(selectedNode.id);
                    setMode("failure");
                    setDirty(true);
                    setSelected(null);
                  }}
                >
                  Target this service <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="canvas-legend">
            <span>
              <i className="legend-dot green" /> Healthy
            </span>
            <span>
              <i className="legend-dot amber" /> Degraded
            </span>
            <span>
              <i className="legend-dot red" /> Failed / saturated
            </span>
            <span className="legend-end">DETERMINISTIC MODEL v1.0</span>
          </div>
          <div className="telemetry">
            <div className="telemetry-heading">
              <div>
                <Activity size={14} /> EXPERIMENT TELEMETRY
              </div>
              <span>
                {result ? "SIMULATED SNAPSHOT" : "AWAITING FIRST RUN"}
              </span>
            </div>
            <div className="metric-grid">
              <div className="metric">
                <span>Required throughput</span>
                <strong>
                  {result?.required_capacity.toLocaleString() ?? "—"}
                  <small>req/s</small>
                </strong>
                <div className="mini-bars" aria-hidden="true">
                  {Array.from({ length: 20 }, (_, index) => (
                    <i
                      key={index}
                      style={{
                        height: "65%",
                        opacity:
                          result &&
                          index <
                            result.required_capacity /
                              result.assumptions.baseline_traffic_rps
                            ? 0.9
                            : 0.15,
                      }}
                    />
                  ))}
                </div>
                <div className="metric-foot">Each segment = 1× baseline</div>
              </div>
              <div className="metric">
                <span>
                  {result?.scenario === "failure"
                    ? "Installed capacity · before fault"
                    : "Modeled capacity"}
                </span>
                <strong>
                  {result?.current_capacity.toLocaleString() ?? "—"}
                  <small>req/s</small>
                </strong>
                <div className="metric-foot">
                  <span className="live-dot" />
                  {result
                    ? `${result.scenario === "cost" ? result.affordable_nodes : result.current_nodes} compute units`
                    : "Run to calculate"}
                </div>
              </div>
              <div className="metric">
                <span>
                  {result?.scenario === "failure"
                    ? "Utilization · before fault"
                    : "Capacity utilization"}
                </span>
                <strong
                  className={result?.status === "CRITICAL" ? "danger-text" : ""}
                >
                  {result
                    ? utilization === null
                      ? "∞"
                      : `${utilization}%`
                    : "—"}
                </strong>
                <div className="utilization-track">
                  <i style={{ width: `${Math.min(utilization || 0, 100)}%` }} />
                </div>
                <div className="metric-foot">
                  {result
                    ? `${result.deficit.toLocaleString()} req/s capacity deficit`
                    : "Demand ÷ compute capacity"}
                </div>
              </div>
            </div>
          </div>
        </section>
        <aside className="results-panel">
          <div className="panel-label">
            <Activity size={15} /> SIMULATION REPORT <span>02</span>
          </div>
          <div className="report-content">
            <div
              className={`status-banner ${result?.status.toLowerCase() || "idle"}`}
            >
              <span className="status-orb">
                {result ? (
                  result.status === "HEALTHY" ? (
                    <Check size={21} />
                  ) : (
                    <Activity size={21} />
                  )
                ) : (
                  <Box size={21} />
                )}
              </span>
              <div>
                <small>
                  {dirty && result
                    ? "PREVIOUS RUN · INPUTS CHANGED"
                    : "SYSTEM OUTLOOK"}
                </small>
                <strong>
                  {result
                    ? result.status === "CRITICAL"
                      ? "Under pressure"
                      : result.status === "WARNING"
                        ? "At risk"
                        : "Within capacity"
                    : "Ready to explore"}
                </strong>
              </div>
            </div>
            <p className="report-intro">
              {result
                ? result.scenario === "failure"
                  ? `${result.impact_pct}% of services are within the potential blast radius.`
                  : result.deficit
                    ? "Demand exceeds modeled capacity. Explore a more resilient configuration."
                    : "Your architecture meets this experiment’s modeled demand."
                : "Every architecture has a limit. Run an experiment to discover yours."}
            </p>
            <div className="report-divider" />
            <div className="eyebrow">
              {result?.scenario === "failure"
                ? "POTENTIAL IMPACT"
                : "RECOMMENDED ACTION"}
            </div>
            <div className="recommendation-number">
              {result
                ? result.scenario === "traffic"
                  ? `+${result.add_nodes}`
                  : result.scenario === "failure"
                    ? `${result.degraded.length + 1}`
                    : `${result.affordable_nodes}`
                : "—"}
              <span>
                {result?.scenario === "failure"
                  ? "services affected"
                  : result?.scenario === "cost"
                    ? "compute units retained"
                    : "compute units"}
              </span>
            </div>
            <p className="muted-copy">
              {result?.recommendation ||
                "Evidence-backed recommendations appear after your first simulation."}
            </p>
            <div className="cost-card">
              <div>
                <span>Current estimate</span>
                <strong>
                  {result ? `$${result.cost_current}` : "—"}
                  <small>/mo</small>
                </strong>
              </div>
              <div>
                <span>Proposed estimate</span>
                <strong>
                  {result ? `$${result.cost_proposed}` : "—"}
                  <small>/mo</small>
                </strong>
              </div>
              <footer>
                Modeled cost delta{" "}
                <span>
                  {result
                    ? `${result.cost_delta >= 0 ? "+" : "−"}$${Math.abs(result.cost_delta)}`
                    : "—"}
                </span>
              </footer>
            </div>
            <div className="insight">
              <div>
                <Sparkles size={14} />
                <span>
                  {result?.explanation_source === "bedrock"
                    ? "AMAZON BEDROCK INSIGHT"
                    : "MODEL INSIGHT"}
                </span>
              </div>
              <p>
                {result?.explanation ||
                  "Deterministic math drives every result. Optional Amazon Bedrock explanations add context when connected."}
              </p>
            </div>
            <button
              className="math-toggle"
              disabled={!result}
              onClick={() => setMath(!math)}
            >
              <Terminal size={14} /> Show the math{" "}
              <span>{math ? "−" : "+"}</span>
            </button>
            {math && result && (
              <ol className="math-lines">
                {result.math.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button onClick={run}>Retry</button>
        </div>
      )}
      <footer className="workspace-footer">
        <span>
          <ShieldCheck size={13} /> Simulation assumptions. Not AWS guarantees.
        </span>
        <button onClick={() => setModal("history")}>
          <Activity size={13} /> {runs.length} experiments this session{" "}
          <ChevronRight size={12} />
        </button>
        <span className="footer-signature">
          ENGINEER FOR THE UNEXPECTED <span>↗</span>
        </span>
      </footer>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={18} />
            </button>
            <div className="eyebrow">PRISM / {modal.toUpperCase()}</div>
            <h2>
              {modal === "assumptions"
                ? "Make the model yours."
                : modal === "history"
                  ? "Your experiment log."
                  : "A safe place to break things."}
            </h2>
            {modal === "assumptions" ? (
              <>
                <p>
                  Illustrative values, never live AWS pricing. Changes apply to
                  the next run. Compute capacity overrides both existing
                  instances.
                </p>
                <div className="assumption-grid">
                  {Object.entries(labels).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        disabled={busy}
                        type="number"
                        min={key.includes("rps") ? 1 : 0}
                        max="1000000"
                        value={assumptions[key]}
                        onChange={(e) => {
                          setAssumptions({
                            ...assumptions,
                            [key]: +e.target.value,
                          });
                          setDirty(true);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <button className="run-button" onClick={() => setModal(null)}>
                  Use these assumptions <Check size={15} />
                </button>
              </>
            ) : modal === "history" ? (
              <div className="history-list">
                {runs.length ? (
                  runs.map((entry, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setResult(entry.result);
                        setDirty(true);
                        setFuture(false);
                        setModal(null);
                      }}
                    >
                      <span>
                        {entry.scenario.type.toUpperCase()}
                        <small>{entry.time}</small>
                      </span>
                      <span>
                        {entry.result.status}
                        <ChevronRight size={14} />
                      </span>
                    </button>
                  ))
                ) : (
                  <p>
                    No experiments yet. Choose a stressor and run your first
                    simulation.
                  </p>
                )}
              </div>
            ) : (
              <>
                <p>
                  PRISM is a transparent architectural decision lab. It does not
                  scan, monitor or modify your AWS account.
                </p>
                <ol className="guide-list">
                  <li>
                    Choose traffic, dependency failure or budget pressure.
                  </li>
                  <li>
                    Edit assumptions to match the system you want to model.
                  </li>
                  <li>
                    Run the Python engine. Inspect the result and its
                    calculations.
                  </li>
                  <li>
                    Compare a proposed compute expansion and export your
                    decision record.
                  </li>
                </ol>
                <p>
                  Failure tracing is conservative: alternate routes and
                  automatic failover are not modeled. Capacity is compute-only.
                  Proposed capacity does not guarantee end-to-end availability.
                </p>
                <div className="guide-badge">
                  <ShieldCheck size={16} /> Local Python engine · AWS Lambda
                  ready · Bedrock optional
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
