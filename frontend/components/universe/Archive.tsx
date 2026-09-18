"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Download,
  Search,
  History,
  GitCompareArrows,
} from "lucide-react";
import {
  scenarioName,
  downloadDecision,
  type Experiment,
} from "@/lib/experiments";

export default function Archive({
  experiments,
  onOpen,
}: {
  experiments: Experiment[];
  onOpen: (experiment: Experiment) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = experiments.filter(
    (experiment) =>
      (filter === "all" || experiment.scenario.type === filter) &&
      scenarioName(experiment.scenario)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const compared = selected
    .map((id) => experiments.find((experiment) => experiment.id === id))
    .filter((entry): entry is Experiment => !!entry);
  return (
    <div className="archive-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">YOUR RESEARCH, PRESERVED</span>
          <h1>
            Every experiment.
            <br />
            <span>A new perspective.</span>
          </h1>
          <p>
            {experiments.length} saved runs · Stored in this browser · Most
            recent 30
          </p>
        </div>
        <History size={48} strokeWidth={0.8} className="heading-icon" />
      </div>
      <div className="archive-toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            aria-label="Search experiments"
            placeholder="Search your experiments…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter experiments"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All scenarios</option>
          <option value="traffic">Traffic surge</option>
          <option value="failure">Dependency failure</option>
          <option value="cost">Budget pressure</option>
        </select>
        <span className="compare-hint">
          <GitCompareArrows size={15} /> Select two to compare
        </span>
      </div>
      {compared.length === 2 && (
        <div className="comparison glass-card">
          <span className="eyebrow">
            SIDE-BY-SIDE / SAME MODEL, DIFFERENT DECISIONS
          </span>
          <table>
            <thead>
              <tr>
                <th>Measure</th>
                {compared.map((entry) => (
                  <th key={entry.id}>{scenarioName(entry.scenario)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Demand · req/s", "required_capacity"],
                  ["Capacity · req/s", "current_capacity"],
                  ["Monthly cost · $", "cost_proposed"],
                  ["Add compute units", "add_nodes"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key}>
                  <td>{label}</td>
                  {compared.map((entry) => (
                    <td key={entry.id}>{entry.result[key].toLocaleString()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Each run retains its original assumptions. Capacity during failure
            refers to installed capacity before the fault.
          </p>
        </div>
      )}
      {filtered.length ? (
        <div className="experiment-list">
          {filtered.map((entry, index) => (
            <article className="experiment-row" key={entry.id}>
              <label className="compare-check">
                <input
                  type="checkbox"
                  aria-label={`Compare ${scenarioName(entry.scenario)} ${entry.id.slice(0, 8)}`}
                  checked={selected.includes(entry.id)}
                  disabled={
                    selected.length === 2 && !selected.includes(entry.id)
                  }
                  onChange={(event) =>
                    setSelected((previous) =>
                      event.target.checked
                        ? [...previous, entry.id]
                        : previous.filter((id) => id !== entry.id),
                    )
                  }
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </label>
              <div className="experiment-name">
                <h3>{scenarioName(entry.scenario)}</h3>
                <span>{new Date(entry.date).toLocaleString()}</span>
              </div>
              <span
                className={`result-status ${entry.result.status.toLowerCase()}`}
              >
                {entry.result.status}
              </span>
              <strong>
                ${entry.result.cost_proposed}
                <small>/ mo</small>
              </strong>
              <button
                className="icon-btn"
                aria-label={`Export ${scenarioName(entry.scenario)}`}
                onClick={() => downloadDecision(entry)}
              >
                <Download size={16} />
              </button>
              <button
                className="secondary-button"
                onClick={() => onOpen(entry)}
              >
                Open <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-archive">
          <History size={30} />
          <h2>
            {experiments.length
              ? "No matching experiments."
              : "Your discoveries belong here."}
          </h2>
          <p>
            {experiments.length
              ? "Try another search or scenario filter."
              : "Launch your first simulation. Its evidence will be saved automatically."}
          </p>
          <a href="#lab" className="text-link">
            Go to the lab <ArrowUpRight size={14} />
          </a>
        </div>
      )}
    </div>
  );
}
