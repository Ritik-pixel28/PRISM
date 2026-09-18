"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  FlaskConical,
  Focus,
  GitBranch,
  History,
  Maximize2,
  Orbit,
  Pause,
  Play,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Telescope,
  Triangle,
  X,
} from "lucide-react";
import UniverseScene from "@/components/universe/UniverseScene";
import Starfield from "@/components/universe/Starfield";
import FloatingPanel from "@/components/universe/FloatingPanel";
import ExperimentControls from "@/components/universe/ExperimentControls";
import Analysis from "@/components/universe/Analysis";
import Archive from "@/components/universe/Archive";
import { architecture } from "@/lib/architecture";
import { simulate } from "@/lib/api";
import { defaults, assumptionLabels, type Experiment } from "@/lib/experiments";
import { readExperiments } from "@/lib/history";
import type { Assumptions, Scenario } from "@/types/simulation";

const destinations = [
  { id: "universe", label: "Universe", icon: Orbit, number: "01" },
  { id: "lab", label: "Experiment lab", icon: FlaskConical, number: "02" },
  { id: "analysis", label: "Analysis", icon: Activity, number: "03" },
  { id: "archive", label: "Archive", icon: History, number: "04" },
  {
    id: "settings",
    label: "Model settings",
    icon: SlidersHorizontal,
    number: "05",
  },
];
const storageKey = "prism-universe-experiments-v1";
function subscribeNavigation(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
function currentView() {
  const route = window.location.hash.slice(1);
  return destinations.some((destination) => destination.id === route)
    ? route
    : "universe";
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
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [future, setFuture] = useState(false);
  const [paused, setPaused] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const result = active?.result || null;
  const moving = !paused && !reducedMotion;

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      try {
        const saved = readExperiments(localStorage.getItem(storageKey));
        setExperiments(saved);
        if (saved[0]) {
          setActive(saved[0]);
          setDirty(true);
        }
      } catch {
        setNotice(
          "Browser storage is unavailable. Experiments will remain available for this session.",
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
    const dialog = document.getElementById("field-guide");
    const close = dialog?.querySelector<HTMLButtonElement>("button");
    close?.focus();
    function keys(event: KeyboardEvent) {
      if (event.key === "Escape") setGuideOpen(false);
      if (event.key === "Tab") {
        event.preventDefault();
        close?.focus();
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
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
      const experiment = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        scenario: { ...scenario },
        result: next,
      };
      const history = [experiment, ...experiments].slice(0, 30);
      setExperiments(history);
      setActive(experiment);
      setFuture(false);
      setDirty(false);
      setSelected(null);
      try {
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch {
        setNotice(
          "Simulation complete. Browser storage is full or unavailable; this run is saved for this session only.",
        );
      }
      window.location.hash = "universe";
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete simulation",
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
    setDirty(true);
    setFuture(false);
    window.location.hash = "analysis";
  }
  function resetUniverse() {
    setResetKey((key) => key + 1);
    setSelected(null);
    setFuture(false);
    setControlsOpen(true);
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice(
        "Fullscreen is unavailable in this browser. Open PRISM in a regular browser for an immersive view.",
      );
    }
  }
  const node =
    architecture.nodes.find((service) => service.id === selected) ??
    (selected === "expansion" && result && future
      ? {
          id: "expansion",
          type: "ec2",
          category: "proposed compute",
          label: `+${result.add_nodes} compute units`,
          capacity: result.add_nodes * result.assumptions.ec2_capacity_rps,
        }
      : undefined);
  const status = result?.status.toLowerCase() || "ready";
  const selectedStatus =
    node?.id === "expansion"
      ? "Proposed capacity · not provisioned"
      : node && result?.down.includes(node.id)
        ? "Injected failure"
        : node && result?.degraded.includes(node.id)
          ? "Potentially degraded"
          : "Modeled service";

  return (
    <main
      className={`cosmos-app ${!moving ? "motion-paused" : ""} ${busy ? "is-computing" : ""}`}
    >
      <Starfield moving={moving && view === "universe"} />
      <div className="nebula nebula-violet" />
      <div className="nebula nebula-blue" />
      <header className="cosmos-header">
        <a
          href="#universe"
          className="cosmos-brand"
          aria-label="PRISM universe"
        >
          <span className="brand-prism">
            <Triangle size={23} strokeWidth={1.5} />
          </span>
          PRISM<span className="version-badge">EXPLORER / 01</span>
        </a>
        <div className="header-location">
          <span className="connection-dot" /> LOCAL SIMULATION{" "}
          <span className="header-slash">/</span>
          <span>US-EAST-1</span>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            aria-label="Open field guide"
            onClick={() => setGuideOpen(true)}
          >
            <CircleHelp size={17} />
          </button>
          <button
            className="header-profile"
            onClick={() => {
              window.location.hash = "archive";
            }}
            aria-label="Open saved experiments"
          >
            R<span className="profile-dot" />
          </button>
        </div>
      </header>
      <nav className="cosmos-rail" aria-label="Workspace navigation">
        <div className="rail-top">
          {destinations.map((destination) => (
            <a
              href={`#${destination.id}`}
              key={destination.id}
              className={view === destination.id ? "active" : ""}
              aria-label={destination.label}
              aria-current={view === destination.id ? "page" : undefined}
              title={destination.label}
            >
              <destination.icon size={20} strokeWidth={1.4} />
              <span>{destination.label}</span>
            </a>
          ))}
        </div>
        <button
          className="rail-help"
          aria-label="About this simulation"
          onClick={() => setGuideOpen(true)}
        >
          <ShieldCheck size={18} />
        </button>
        <span className="rail-wordmark">ENGINEER THE UNEXPECTED</span>
      </nav>
      <div className="workspace-body">
        {view === "universe" ? (
          <section
            className="universe-workspace"
            aria-label="Infrastructure universe"
          >
            <div className="universe-heading">
              <div className="eyebrow">
                <span className="tiny-cross">✦</span> YOUR INFRASTRUCTURE,
                REIMAGINED
              </div>
              <h1>
                A universe
                <br />
                of <span>possibilities.</span>
              </h1>
              <p>
                Move through your architecture.
                <br />
                Discover what happens next.
              </p>
              <div className="universe-meta">
                <span>
                  <i /> 5 CONNECTED SERVICES
                </span>
                <span>01 REGION</span>
              </div>
            </div>
            <div className="space-coordinate top-right">
              <span>WEB APPLICATION</span>
              <strong>System 001</strong>
              <small>MODEL SPACE · NOT LIVE AWS</small>
            </div>
            <div className="cosmic-orbit orbit-outer" />
            <div className="cosmic-orbit orbit-inner" />
            <div className="cosmic-center">
              <span>✦</span>
            </div>
            <div className="universe-scene">
              <UniverseScene
                key={resetKey}
                result={result}
                future={future}
                moving={moving}
                onSelect={setSelected}
                onHover={setHovered}
              />
            </div>
            <div className="topology-switch">
              <button
                className={!future ? "active" : ""}
                onClick={() => setFuture(false)}
              >
                <Orbit size={13} /> Current universe
              </button>
              <button
                disabled={!result || result.scenario !== "traffic"}
                className={future ? "active" : ""}
                onClick={() => setFuture(true)}
              >
                <Sparkles size={13} /> Proposed{" "}
                {result?.add_nodes ? <span>+{result.add_nodes}</span> : null}
              </button>
            </div>
            {controlsOpen && (
              <FloatingPanel
                key={`controls-${resetKey}`}
                title="QUICK EXPERIMENT"
                className="quick-experiment"
              >
                <ExperimentControls
                  compact
                  scenario={scenario}
                  onChange={changeScenario}
                  busy={busy}
                  onRun={launch}
                  baseline={assumptions.baseline_traffic_rps}
                />
                <a href="#lab" className="panel-link">
                  Open experiment lab <ArrowUpRight size={12} />
                </a>
              </FloatingPanel>
            )}
            {node ? (
              <FloatingPanel
                key={`${node.id}-${resetKey}`}
                title="SERVICE INSPECTOR"
                className="service-inspector"
              >
                <button
                  className="inspector-close icon-btn"
                  onClick={() => setSelected(null)}
                  aria-label="Close service inspector"
                >
                  <X size={14} />
                </button>
                <span className="eyebrow">
                  {node.category.replaceAll("_", " ").toUpperCase()} /{" "}
                  {node.id.toUpperCase()}
                </span>
                <h2>{node.label}</h2>
                <span className={`service-state ${status}`}>
                  <i />
                  {selectedStatus}
                </span>
                {node.type === "ec2" && (
                  <div className="inspector-capacity">
                    <strong>
                      {node.id === "expansion"
                        ? node.capacity
                        : (result?.assumptions.ec2_capacity_rps ??
                          node.capacity)}
                    </strong>
                    <span>modeled req/s</span>
                  </div>
                )}
                <p>
                  {node.type === "rds"
                    ? "A shared dependency. Trace how a failure could propagate upstream."
                    : "Drag this service through the universe. Hover to trace its upstream dependencies."}
                </p>
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => {
                    if (node.id === "expansion") {
                      window.location.hash = "analysis";
                      return;
                    }
                    changeScenario({ type: "failure", node_id: node.id });
                    setControlsOpen(true);
                    setSelected(null);
                  }}
                >
                  {node.id === "expansion"
                    ? "View expansion evidence"
                    : "Target a failure"}{" "}
                  <GitBranch size={14} />
                </button>
              </FloatingPanel>
            ) : result ? (
              <FloatingPanel
                key={`signal-${resetKey}`}
                title="LATEST SIGNAL"
                className={`signal-panel ${status}`}
              >
                <div className="signal-status">
                  <span className="signal-orb">
                    <Activity size={21} />
                  </span>
                  <div>
                    <span className="eyebrow">
                      {dirty ? "PREVIOUS RUN" : "EXPERIMENT COMPLETE"}
                    </span>
                    <h2>
                      {result.status === "CRITICAL"
                        ? "A limit, discovered."
                        : result.status === "WARNING"
                          ? "A system at risk."
                          : "Room to breathe."}
                    </h2>
                  </div>
                </div>
                <div className="signal-reading">
                  <strong>
                    {result.scenario === "traffic"
                      ? `+${result.add_nodes}`
                      : result.scenario === "failure"
                        ? `${result.impact_pct}%`
                        : `$${result.cost_proposed}`}
                  </strong>
                  <span>
                    {result.scenario === "traffic"
                      ? "compute units recommended"
                      : result.scenario === "failure"
                        ? "potential service impact"
                        : "modeled monthly cost"}
                  </span>
                </div>
                <a href="#analysis" className="signal-link">
                  Explore the full analysis <ArrowUpRight size={15} />
                </a>
              </FloatingPanel>
            ) : (
              <div className="discovery-note">
                <span className="note-line" />
                <Telescope size={19} strokeWidth={1.2} />
                <p>
                  Your next discovery
                  <br />
                  starts with <strong>“what if?”</strong>
                </p>
              </div>
            )}
            <div className="space-readout">
              <span className="tiny-cross">+</span>
              <span>
                {hovered
                  ? `TRACING DEPENDENCIES / ${hovered.toUpperCase()}`
                  : busy
                    ? "DETERMINISTIC ENGINE / COMPUTING"
                    : "DRAG SERVICES · PAN SPACE · SCROLL TO EXPLORE"}
              </span>
              <span className="readout-line" />
            </div>
            <div className="universe-dock">
              <span className="dock-caption">SPACE CONTROLS</span>
              <button
                aria-label={
                  moving ? "Pause universe motion" : "Resume universe motion"
                }
                onClick={() => setPaused(!paused)}
                disabled={reducedMotion}
                title={
                  reducedMotion
                    ? "Reduced motion enabled in your system"
                    : moving
                      ? "Pause motion"
                      : "Resume motion"
                }
              >
                {moving ? <Pause size={15} /> : <Play size={15} />}
                <span>{moving ? "Motion on" : "Motion off"}</span>
              </button>
              <span className="dock-separator" />
              <button
                aria-pressed={controlsOpen}
                onClick={() => setControlsOpen(!controlsOpen)}
              >
                <Settings2 size={16} />
                <span>Controls</span>
              </button>
              <button onClick={resetUniverse}>
                <Focus size={16} />
                <span>Reset space</span>
              </button>
              <button onClick={fullscreen} aria-label="Toggle fullscreen">
                <Maximize2 size={16} />
              </button>
            </div>
          </section>
        ) : (
          <section className="destination-page" key={view}>
            <div className="destination-breadcrumb">
              <span>WORKSPACE</span>
              <ChevronRight size={11} />
              <span>
                {destinations
                  .find((item) => item.id === view)
                  ?.label.toUpperCase()}
              </span>
              <span className="breadcrumb-line" />
              <span>
                0{destinations.findIndex((item) => item.id === view) + 1}
              </span>
            </div>
            {view === "lab" && (
              <div className="lab-view">
                <div className="view-heading">
                  <div>
                    <span className="eyebrow">A SAFE PLACE TO ASK WHAT IF</span>
                    <h1>
                      Extraordinary systems.
                      <br />
                      <span>Extraordinary pressure.</span>
                    </h1>
                    <p>
                      Choose a stressor. Set the intensity. Watch your universe
                      respond.
                    </p>
                  </div>
                  <div className="lab-symbol">
                    <FlaskConical size={55} strokeWidth={0.7} />
                  </div>
                </div>
                <div className="lab-body">
                  <section className="glass-card lab-controls">
                    <ExperimentControls
                      scenario={scenario}
                      onChange={changeScenario}
                      busy={busy}
                      onRun={launch}
                      baseline={assumptions.baseline_traffic_rps}
                    />
                  </section>
                  <aside className="lab-context">
                    <span className="eyebrow">YOUR TEST ENVIRONMENT</span>
                    <div className="mini-universe">
                      <Orbit size={92} strokeWidth={0.6} />
                      <span className="mini-satellite" />
                    </div>
                    <h2>Web application</h2>
                    <p>
                      CloudFront → load balancer → two compute instances →
                      shared database.
                    </p>
                    <div className="context-fact">
                      <span>Baseline traffic</span>
                      <strong>{assumptions.baseline_traffic_rps} req/s</strong>
                    </div>
                    <div className="context-fact">
                      <span>Compute unit capacity</span>
                      <strong>{assumptions.ec2_capacity_rps} req/s</strong>
                    </div>
                    <a href="#settings" className="text-link">
                      Adjust model assumptions <ArrowUpRight size={13} />
                    </a>
                    <div className="safe-context">
                      <ShieldCheck size={17} />
                      <span>
                        A deterministic simulation.
                        <br />
                        Zero production changes.
                      </span>
                    </div>
                  </aside>
                </div>
              </div>
            )}
            {view === "analysis" && (
              <Analysis
                experiment={active}
                onExplore={() => {
                  window.location.hash = "universe";
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
                    <span className="eyebrow">THE RULES OF YOUR UNIVERSE</span>
                    <h1>
                      Nothing hidden.
                      <br />
                      <span>Everything adjustable.</span>
                    </h1>
                    <p>
                      Good simulations start with explicit assumptions. These
                      are yours.
                    </p>
                  </div>
                  <SlidersHorizontal
                    size={46}
                    strokeWidth={0.8}
                    className="heading-icon"
                  />
                </div>
                <div className="settings-grid">
                  <section className="glass-card">
                    <div className="section-heading">
                      <span className="eyebrow">MODEL ASSUMPTIONS</span>
                      <button
                        className="text-link"
                        disabled={busy}
                        onClick={() => {
                          setAssumptions({ ...defaults });
                          setDirty(true);
                          setNotice("Default model assumptions restored.");
                        }}
                      >
                        Restore defaults
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
                      <Check size={13} /> Changes apply to your next experiment.
                      Existing results keep their original assumptions.
                    </p>
                    <a href="#lab" className="primary-link">
                      Design an experiment <ArrowUpRight size={15} />
                    </a>
                  </section>
                  <aside>
                    <section className="glass-card motion-settings">
                      <span className="eyebrow">THE WAY SPACE FEELS</span>
                      <div className="toggle-row">
                        <div>
                          <h3>Ambient motion</h3>
                          <p>
                            Drifting stars, orbiting services, request
                            particles.
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
                        <p>
                          Your system’s reduced-motion setting takes priority.
                        </p>
                      )}
                    </section>
                    <section className="model-note">
                      <ShieldCheck size={20} />
                      <h3>Transparent by design.</h3>
                      <p>
                        Capacity is compute-only. Failure tracing is
                        conservative dependency reachability. Automatic
                        failover, database throughput and scaling delays are not
                        modeled.
                      </p>
                      <p>
                        Prices are illustrative monthly estimates. PRISM does
                        not connect to or modify your production account.
                      </p>
                      <span className="small-tag">MODEL VERSION 1.0</span>
                    </section>
                  </aside>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
      <footer className="cosmos-footer">
        <span>
          <span className={`footer-dot ${busy ? "working" : ""}`} />
          {busy ? "COMPUTING SIMULATION" : "DETERMINISTIC ENGINE"}
          <i />
          {experiments.length} EXPERIMENT{experiments.length === 1 ? "" : "S"}
        </span>
        <span>SIMULATION ASSUMPTIONS. NOT AWS GUARANTEES.</span>
        <button onClick={() => setGuideOpen(true)}>
          PRISM v1.0 <ArrowUpRight size={11} />
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
            className="icon-btn"
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
            className="guide-dialog glass-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close icon-btn"
              aria-label="Close field guide"
              onClick={() => setGuideOpen(false)}
            >
              <X size={19} />
            </button>
            <span className="eyebrow">WELCOME TO YOUR UNIVERSE</span>
            <h2 id="guide-title">
              Explore. Disrupt.
              <br />
              <span>Understand.</span>
            </h2>
            <p>
              PRISM turns a cloud architecture into a movable, explainable
              simulation.
            </p>
            <ol>
              <li>
                <Orbit size={17} />
                <span>
                  <strong>Universe</strong>Drag services, pan and zoom space, or
                  drag floating panels by their title bar. Hover a service to
                  trace dependencies.
                </span>
              </li>
              <li>
                <FlaskConical size={17} />
                <span>
                  <strong>Experiment lab</strong>Choose a traffic surge,
                  dependency failure, or budget constraint. Launch the real
                  Python simulation.
                </span>
              </li>
              <li>
                <Activity size={17} />
                <span>
                  <strong>Analysis</strong>Inspect deterministic calculations
                  and read, copy or export a decision record.
                </span>
              </li>
              <li>
                <History size={17} />
                <span>
                  <strong>Archive</strong>Reopen saved runs and compare two
                  decisions. The latest 30 runs stay in this browser.
                </span>
              </li>
            </ol>
            <p className="guide-caveat">
              Animation illustrates the model, not live AWS traffic. Pause
              motion from the space controls. Nothing is deployed or changed in
              production.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
