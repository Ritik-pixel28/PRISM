"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  Check,
  Cloud,
  Database,
  GitBranch,
  Maximize2,
  Menu,
  Network,
  Pause,
  Play,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Triangle,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Sculpture from "@/components/studio/Sculpture";
import ArchitectureCanvas from "@/components/ArchitectureCanvas/ArchitectureCanvas";
import ExperimentControls from "@/components/universe/ExperimentControls";
import Analysis from "@/components/universe/Analysis";
import Archive from "@/components/universe/Archive";
import { architecture } from "@/lib/architecture";
import { simulate } from "@/lib/api";
import {
  defaults,
  assumptionLabels,
  scenarioName,
  type Experiment,
} from "@/lib/experiments";
import { readExperiments } from "@/lib/history";
import type { Assumptions, Scenario } from "@/types/simulation";

const navigation = [
  { id: "universe", name: "Experience", number: "01" },
  { id: "lab", name: "Simulator", number: "02" },
  { id: "topology", name: "Architecture", number: "03" },
  { id: "analysis", name: "Analysis", number: "04" },
  { id: "archive", name: "Archive", number: "05" },
  { id: "settings", name: "Model settings", number: "06" },
];
const storageKey = "prism-universe-experiments-v1";
function subscribeNavigation(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
function currentView() {
  const id = window.location.hash.slice(1);
  return navigation.some((item) => item.id === id) ? id : "universe";
}
function subscribeMotion(listener: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

export default function Home() {
  const view = useSyncExternalStore(
    subscribeNavigation,
    currentView,
    () => "universe",
  );
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [scenario, setScenario] = useState<Scenario>({
    type: "traffic",
    multiplier: 10,
  });
  const [assumptions, setAssumptions] = useState<Assumptions>(defaults);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [active, setActive] = useState<Experiment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [future, setFuture] = useState(false);
  const [paused, setPaused] = useState(false);
  const [form, setForm] = useState<"cluster" | "fracture">("cluster");
  const [separation, setSeparation] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topologyKey, setTopologyKey] = useState(0);
  const moving = !paused && !reducedMotion;
  const result = active?.result ?? null;
  const preview = useMemo(() => {
    const affected = new Set<string>();
    const queue = hovered ? [hovered] : [];
    while (queue.length) {
      const id = queue.pop();
      architecture.edges
        .filter((edge) => edge.target === id)
        .forEach((edge) => {
          if (!affected.has(edge.source)) {
            affected.add(edge.source);
            queue.push(edge.source);
          }
        });
    }
    return [...affected];
  }, [hovered]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      try {
        const restored = readExperiments(localStorage.getItem(storageKey));
        setExperiments(restored);
        if (restored[0]) {
          setActive(restored[0]);
          setDirty(true);
        }
      } catch {
        setNotice(
          "Browser storage is unavailable. New experiments will remain available in this session.",
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!guideOpen) return;
    const original = document.activeElement as HTMLElement | null;
    const close = document.querySelector<HTMLButtonElement>(
      "#field-guide button",
    );
    close?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setGuideOpen(false);
      if (event.key === "Tab") {
        event.preventDefault();
        close?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      original?.focus();
    };
  }, [guideOpen]);

  async function launch() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await simulate(architecture, scenario, assumptions);
      const experiment: Experiment = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        scenario: { ...scenario },
        result: next,
      };
      const history = [experiment, ...experiments].slice(0, 30);
      setExperiments(history);
      setActive(experiment);
      setDirty(false);
      setFuture(false);
      setSelected(null);
      try {
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch {
        setNotice(
          "Experiment complete. Browser storage is unavailable; this run is retained for the current session.",
        );
      }
      setForm(next.status === "CRITICAL" ? "fracture" : "cluster");
      setSeparation(next.status === "CRITICAL" ? 0.65 : 0.1);
      window.location.hash = "analysis";
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Simulation could not be completed",
      );
    } finally {
      setBusy(false);
    }
  }
  function changeScenario(next: Scenario) {
    setScenario(next);
    setDirty(true);
  }
  function openExperiment(experiment: Experiment) {
    setActive(experiment);
    setFuture(false);
    setDirty(true);
    window.location.hash = "analysis";
  }
  function chooseStressor(type: Scenario["type"]) {
    changeScenario(
      type === "traffic"
        ? { type, multiplier: 10 }
        : type === "failure"
          ? { type, node_id: "rds" }
          : { type, budget: 380 },
    );
    window.location.hash = "lab";
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice(
        "Fullscreen is unavailable here. You can use the same interactive experience in a regular browser.",
      );
    }
  }
  const node = architecture.nodes.find((service) => service.id === selected);
  const proposedSelected =
    selected === "proposed" && future && result?.scenario === "traffic";
  const selectedStatus =
    node && result?.down.includes(node.id)
      ? "FAILED"
      : node && result?.degraded.includes(node.id)
        ? "POTENTIALLY DEGRADED"
        : "MODELED SERVICE";
  const activeNav = navigation.find((item) => item.id === view)!;

  return (
    <main
      className={`studio ${view === "universe" ? `experience ${form}` : "workspace"} ${!moving ? "motion-off" : ""}`}
    >
      <header className="studio-header">
        <a href="#universe" className="studio-logo" aria-label="PRISM home">
          <span>
            <Triangle size={23} strokeWidth={2} />
          </span>
          PRISM
          <small>
            SIMULATION
            <br />
            STUDIO
          </small>
        </a>
        <nav
          className={menuOpen ? "main-nav open" : "main-nav"}
          aria-label="Main navigation"
        >
          {navigation.slice(0, 5).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
              <span>↗</span>
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <button
            className="icon-button"
            aria-label="Open model settings"
            onClick={() => {
              window.location.hash = "settings";
            }}
          >
            <SlidersHorizontal size={17} />
          </button>
          <button className="header-contact" onClick={() => setGuideOpen(true)}>
            FIELD GUIDE <ArrowUpRight size={12} />
          </button>
          <button
            className="mobile-menu icon-button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {view === "universe" ? (
        <section
          className="experience-stage"
          aria-label="Interactive 3D experience"
        >
          <div className="experience-grid" />
          <div className="sculpture-frame">
            <Sculpture
              form={form}
              moving={moving}
              separation={separation}
              stressed={result?.status === "CRITICAL"}
              resetKey={resetKey}
            />
          </div>
          <div className="experience-edition">
            <span className="status-dot" /> AN EXPERIMENT IN RESILIENCE{" "}
            <span>VOL. 001 / 2026</span>
          </div>
          <div className="experience-copy">
            <span className="eyebrow">
              BEFORE PRODUCTION. BEYOND ASSUMPTIONS.
            </span>
            <h1>
              {form === "cluster" ? (
                <>
                  SIMULATE
                  <br />
                  <span>THE UNSEEN.</span>
                </>
              ) : (
                <>
                  BREAK IT.
                  <br />
                  <span>UNDERSTAND IT.</span>
                </>
              )}
            </h1>
            <div className="experience-description">
              <span className="fine-cross">+</span>
              <p>
                {form === "cluster"
                  ? "Every system has a breaking point. Explore yours before the world finds it."
                  : "Pull the architecture apart. Follow the dependencies. Turn failure into evidence."}
              </p>
            </div>
            <a href="#lab" className="hero-cta">
              <span>ENTER THE SIMULATOR</span>
              <span className="cta-disc">
                <ArrowUpRight size={25} strokeWidth={1.3} />
              </span>
            </a>
            <div className="hero-tags">
              <button onClick={() => chooseStressor("traffic")}>
                <Zap size={12} /> TRAFFIC SURGE
              </button>
              <button onClick={() => chooseStressor("failure")}>
                <GitBranch size={12} /> FAILURE
              </button>
              <button onClick={() => chooseStressor("cost")}>
                <Wallet size={12} /> COST
              </button>
            </div>
          </div>
          <div className="material-caption">
            <span className="caption-line" />
            <div>
              <strong>
                {form === "cluster"
                  ? "01 / CONNECTED SYSTEMS"
                  : "02 / CONTROLLED CHAOS"}
              </strong>
              <span>
                {form === "cluster"
                  ? "Independent parts. Interdependent outcomes."
                  : "A fractured model. A clearer understanding."}
              </span>
            </div>
          </div>
          <div className="sculpture-interaction">
            <span>DRAG TO ROTATE · SCROLL TO ZOOM</span>
            <button
              aria-label={moving ? "Pause 3D motion" : "Resume 3D motion"}
              onClick={() => setPaused(!paused)}
              disabled={reducedMotion}
            >
              {moving ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              aria-label="Reset 3D view"
              onClick={() => {
                setResetKey((key) => key + 1);
                setSeparation(0);
              }}
            >
              <RotateCcw size={13} />
            </button>
            <button aria-label="Toggle fullscreen" onClick={fullscreen}>
              <Maximize2 size={13} />
            </button>
          </div>
          <div className="experience-bottom">
            <div className="form-switch">
              <button
                className={form === "cluster" ? "active" : ""}
                aria-pressed={form === "cluster"}
                onClick={() => setForm("cluster")}
              >
                <span>01</span> FORM
              </button>
              <button
                className={form === "fracture" ? "active" : ""}
                aria-pressed={form === "fracture"}
                onClick={() => setForm("fracture")}
              >
                <span>02</span> FRACTURE
              </button>
            </div>
            <label className="disassemble-control">
              DISASSEMBLE
              <input
                aria-label="Disassemble sculpture"
                type="range"
                min="0"
                max="1"
                step=".01"
                value={separation}
                onChange={(event) => setSeparation(+event.target.value)}
              />
              <span>{Math.round(separation * 100)}%</span>
            </label>
            <a className="chapter-link" href="#topology">
              EXPLORE THE ARCHITECTURE <ArrowDownRight size={20} />
            </a>
          </div>
        </section>
      ) : (
        <section className="work-page" key={view}>
          <div className="page-breadcrumb">
            <a href="#universe">PRISM STUDIO</a>
            <span>/</span>
            <span>{activeNav.name.toUpperCase()}</span>
            <small>{activeNav.number} — 06</small>
          </div>
          {view === "lab" && (
            <div className="simulator-view">
              <div className="view-heading">
                <div>
                  <span className="eyebrow">
                    A CONTROLLED ENVIRONMENT FOR UNCONTROLLED EVENTS
                  </span>
                  <h1>
                    ASK A BETTER
                    <br />
                    <span>WHAT IF.</span>
                  </h1>
                  <p>
                    Select the pressure. Define the conditions. Let the model do
                    the math.
                  </p>
                </div>
                <span className="section-index">02</span>
              </div>
              <div className="simulation-layout">
                <section className="lab-controls glass-card">
                  <ExperimentControls
                    scenario={scenario}
                    onChange={changeScenario}
                    busy={busy}
                    onRun={launch}
                    baseline={assumptions.baseline_traffic_rps}
                  />
                </section>
                <aside className="experiment-brief">
                  <span className="eyebrow">THE SYSTEM UNDER TEST</span>
                  <div className="brief-diagram">
                    <Cloud size={29} />
                    <i />
                    <Network size={29} />
                    <i />
                    <Server size={29} />
                    <i />
                    <Database size={29} />
                  </div>
                  <h2>WEB APPLICATION</h2>
                  <p>
                    Five services. Two compute instances. One shared database
                    dependency.
                  </p>
                  <dl>
                    <div>
                      <dt>Region</dt>
                      <dd>us-east-1</dd>
                    </div>
                    <div>
                      <dt>Baseline traffic</dt>
                      <dd>{assumptions.baseline_traffic_rps} req/s</dd>
                    </div>
                    <div>
                      <dt>Capacity / compute</dt>
                      <dd>{assumptions.ec2_capacity_rps} req/s</dd>
                    </div>
                    <div>
                      <dt>Compute / month</dt>
                      <dd>${assumptions.ec2_cost_monthly}</dd>
                    </div>
                  </dl>
                  <a href="#settings" className="text-link">
                    EDIT ASSUMPTIONS <ArrowUpRight size={13} />
                  </a>
                  {active && (
                    <a href="#analysis" className="last-experiment">
                      <span>
                        {dirty ? "PREVIOUS EXPERIMENT" : "LATEST EXPERIMENT"}
                      </span>
                      <strong>{scenarioName(active.scenario)}</strong>
                      <ArrowUpRight size={17} />
                    </a>
                  )}
                  <div className="model-safety">
                    <ShieldCheck size={17} />
                    <span>
                      Modeled assumptions.
                      <br />
                      Zero production changes.
                    </span>
                  </div>
                </aside>
              </div>
            </div>
          )}
          {view === "topology" && (
            <div className="topology-view">
              <div className="view-heading">
                <div>
                  <span className="eyebrow">
                    FIVE SERVICES. ONE CONNECTED STORY.
                  </span>
                  <h1>
                    EVERYTHING
                    <br />
                    <span>IS CONNECTED.</span>
                  </h1>
                  <p>
                    Drag a service. Trace a dependency. Discover where a failure
                    could travel.
                  </p>
                </div>
                <span className="section-index">03</span>
              </div>
              <div className="topology-toolbar">
                <div className="topology-tabs">
                  <button
                    className={!future ? "active" : ""}
                    onClick={() => setFuture(false)}
                  >
                    CURRENT ARCHITECTURE
                  </button>
                  <button
                    disabled={!result || result.scenario !== "traffic"}
                    className={future ? "active" : ""}
                    onClick={() => setFuture(true)}
                  >
                    PROPOSED STATE{" "}
                    {result?.add_nodes ? (
                      <span>+{result.add_nodes}</span>
                    ) : null}
                  </button>
                </div>
                <button
                  className="icon-button"
                  aria-label="Reset architecture layout"
                  onClick={() => {
                    setTopologyKey((key) => key + 1);
                    setSelected(null);
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              </div>
              <div className="topology-stage">
                <ArchitectureCanvas
                  key={topologyKey}
                  result={result}
                  future={future}
                  preview={preview}
                  onSelect={setSelected}
                  onHover={setHovered}
                />
                <div className="topology-caption">
                  {hovered
                    ? `${hovered.toUpperCase()} / ${preview.length} POTENTIALLY AFFECTED UPSTREAM SERVICES`
                    : "DRAG NODES · SCROLL TO ZOOM · HOVER TO TRACE DEPENDENCIES"}
                </div>
                {(node || proposedSelected) && (
                  <aside className="service-inspector">
                    <button
                      className="icon-button inspector-close"
                      aria-label="Close service inspector"
                      onClick={() => setSelected(null)}
                    >
                      <X size={17} />
                    </button>
                    <span className="eyebrow">
                      {proposedSelected
                        ? "COMPUTE EXPANSION"
                        : node!.category.toUpperCase()}
                    </span>
                    <h2>
                      {proposedSelected
                        ? `+${result!.add_nodes} compute units`
                        : node!.label}
                    </h2>
                    <span className="inspector-state">
                      {proposedSelected
                        ? "PROPOSED · NOT PROVISIONED"
                        : selectedStatus}
                    </span>
                    {(node?.type === "ec2" || proposedSelected) && (
                      <div className="inspector-value">
                        <strong>
                          {proposedSelected
                            ? result!.add_nodes *
                              result!.assumptions.ec2_capacity_rps
                            : (result?.assumptions.ec2_capacity_rps ??
                              node!.capacity)}
                        </strong>
                        <span>MODELED REQ/S</span>
                      </div>
                    )}
                    <p>
                      {proposedSelected
                        ? "A grouped preview of the additional compute capacity recommended by the model."
                        : "Failure tracing reports potential dependency impact. Automatic failover is not modeled."}
                    </p>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() => {
                        if (proposedSelected) window.location.hash = "analysis";
                        else {
                          changeScenario({
                            type: "failure",
                            node_id: node!.id,
                          });
                          window.location.hash = "lab";
                        }
                      }}
                    >
                      {proposedSelected
                        ? "VIEW THE EVIDENCE"
                        : "TARGET A FAILURE"}
                      <ArrowUpRight size={13} />
                    </button>
                  </aside>
                )}
              </div>
              <div className="topology-legend">
                <span>
                  <i /> HEALTHY
                </span>
                <span>
                  <i /> POTENTIALLY DEGRADED
                </span>
                <span>
                  <i /> FAILED / SATURATED
                </span>
                <small>
                  {result
                    ? dirty
                      ? "DISPLAYING A PREVIOUS EXPERIMENT"
                      : "SIMULATED RESULT"
                    : "BASELINE MODEL · RUN TO TEST"}
                </small>
              </div>
              <div className="service-directory">
                {architecture.nodes.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelected(service.id)}
                    onMouseEnter={() => setHovered(service.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span>{service.type.toUpperCase()}</span>
                    <strong>{service.label}</strong>
                    <ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {view === "analysis" && (
            <Analysis
              experiment={active}
              onExplore={() => {
                window.location.hash = "topology";
              }}
            />
          )}
          {view === "archive" && (
            <Archive experiments={experiments} onOpen={openExperiment} />
          )}
          {view === "settings" && (
            <div className="settings-view">
              <div className="view-heading">
                <div>
                  <span className="eyebrow">
                    THE MODEL IS ONLY AS GOOD AS ITS ASSUMPTIONS
                  </span>
                  <h1>
                    NOTHING HIDDEN.
                    <br />
                    <span>EVERYTHING YOURS.</span>
                  </h1>
                  <p>
                    Set the values your experiments run on. Every result
                    preserves its original inputs.
                  </p>
                </div>
                <span className="section-index">06</span>
              </div>
              <div className="settings-grid">
                <section className="glass-card">
                  <div className="section-heading">
                    <span className="eyebrow">CAPACITY & COST ASSUMPTIONS</span>
                    <button
                      className="text-link"
                      disabled={busy}
                      onClick={() => {
                        setAssumptions({ ...defaults });
                        setDirty(true);
                        setNotice(
                          "Default assumptions restored. Your next experiment will use these values.",
                        );
                      }}
                    >
                      RESTORE DEFAULTS
                    </button>
                  </div>
                  <div className="assumptions-fields">
                    {Object.entries(assumptionLabels).map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          type="number"
                          min={key.includes("rps") ? 1 : 0}
                          max="1000000"
                          value={assumptions[key]}
                          disabled={busy}
                          onChange={(event) => {
                            setAssumptions((previous) => ({
                              ...previous,
                              [key]: +event.target.value,
                            }));
                            setDirty(true);
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <p className="settings-note">
                    <Check size={13} /> Illustrative assumptions, not AWS prices
                    or performance guarantees.
                  </p>
                  <a href="#lab" className="primary-link">
                    BACK TO THE SIMULATOR <ArrowUpRight size={15} />
                  </a>
                </section>
                <aside>
                  <section className="glass-card motion-settings">
                    <span className="eyebrow">INTERACTION PREFERENCES</span>
                    <div className="toggle-row">
                      <div>
                        <h3>3D ambient motion</h3>
                        <p>
                          Continuous sculpture rotation and subtle movement.
                        </p>
                      </div>
                      <button
                        className={`toggle ${moving ? "on" : ""}`}
                        role="switch"
                        aria-checked={moving}
                        aria-label="Ambient motion"
                        disabled={reducedMotion}
                        onClick={() => setPaused(!paused)}
                      >
                        <span />
                      </button>
                    </div>
                    {reducedMotion && (
                      <p>Your system’s reduced-motion preference is active.</p>
                    )}
                  </section>
                  <section className="model-note">
                    <ShieldCheck size={21} />
                    <h3>KNOW THE BOUNDARIES.</h3>
                    <p>
                      Capacity is compute-only. Dependency failure uses
                      conservative reverse traversal. Database throughput,
                      network limits, failover and scaling delays are not
                      modeled.
                    </p>
                    <p>
                      Bedrock, when configured, explains the Python engine’s
                      results. It does not calculate capacity or cost. Local
                      mode uses a deterministic explanation.
                    </p>
                    <span className="small-tag">
                      DETERMINISTIC MODEL / v1.0
                    </span>
                  </section>
                </aside>
              </div>
            </div>
          )}
        </section>
      )}
      <footer className="studio-footer">
        <span>
          <i className={busy ? "working" : ""} />
          {busy ? "COMPUTING EXPERIMENT" : "SIMULATION SANDBOX"}
          <b>/</b>
          {experiments.length} SAVED EXPERIMENTS
        </span>
        <span>MODELED ASSUMPTIONS. NOT AWS GUARANTEES.</span>
        <button onClick={() => setGuideOpen(true)}>
          BUILT TO QUESTION. <ArrowUpRight size={11} />
        </button>
      </footer>
      {(error || notice) && (
        <div
          className={`toast ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>
          {error && (
            <button onClick={launch} disabled={busy}>
              Retry
            </button>
          )}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {guideOpen && (
        <div className="guide-backdrop" onClick={() => setGuideOpen(false)}>
          <section
            id="field-guide"
            className="guide-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="icon-button dialog-close"
              aria-label="Close field guide"
              onClick={() => setGuideOpen(false)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">PRISM / FIELD GUIDE</span>
            <h2 id="guide-title">
              SEE THE SYSTEM.
              <br />
              <span>THINK BEYOND IT.</span>
            </h2>
            <p>
              A transparent infrastructure simulation studio. Explore the visual
              experience, then test the actual architecture with the
              deterministic Python engine.
            </p>
            <ol>
              <li>
                <Box size={17} />
                <span>
                  <strong>Experience</strong>Rotate and disassemble the 3D
                  sculpture. Switch between connected form and fractured core.
                  This is an illustrative visual, not live infrastructure.
                </span>
              </li>
              <li>
                <Zap size={17} />
                <span>
                  <strong>Simulator & architecture</strong>Test traffic,
                  failures and budgets. Drag services, trace dependencies and
                  preview the proposed compute expansion.
                </span>
              </li>
              <li>
                <Activity size={17} />
                <span>
                  <strong>Analysis & archive</strong>Inspect every calculation,
                  compare saved runs, and read, copy or export your
                  architectural decision record.
                </span>
              </li>
              <li>
                <Settings2 size={17} />
                <span>
                  <strong>Model settings</strong>Edit baseline traffic, compute
                  capacity and monthly costs. Pause animation here or from the
                  3D controls.
                </span>
              </li>
            </ol>
            <p className="guide-caveat">
              All results depend on your assumptions. PRISM does not scan,
              monitor, deploy or modify production AWS resources. History stores
              the latest 30 runs in this browser.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
