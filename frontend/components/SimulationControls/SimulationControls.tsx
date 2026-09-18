"use client";

import { useState } from "react";
import { Zap, CircleAlert, DollarSign, Play } from "lucide-react";

type Scenario = "scale" | "failure" | "cost";

export default function SimulationControls() {
  const [scenario, setScenario] = useState<Scenario>("scale");
  const [trafficMultiplier, setTrafficMultiplier] = useState(10);

  const scenarios = [
    {
      id: "scale" as Scenario,
      label: "Traffic Spike",
      description: "Test increased traffic",
      icon: Zap,
    },
    {
      id: "failure" as Scenario,
      label: "Node Failure",
      description: "Test infrastructure failure",
      icon: CircleAlert,
    },
    {
      id: "cost" as Scenario,
      label: "Cost Constraint",
      description: "Test budget reduction",
      icon: DollarSign,
    },
  ];

  return (
    <aside className="absolute left-5 top-5 z-10 w-72 rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          PRISM
        </p>

        <h2 className="mt-1 text-sm font-semibold text-white">
          Simulation Control
        </h2>
      </div>

      <div>
        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Scenario
        </p>

        <div className="space-y-2">
          {scenarios.map((item) => {
            const Icon = item.icon;
            const active = scenario === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setScenario(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-white/20 bg-white/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <Icon size={17} className="text-white" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-white">{item.label}</p>

                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {scenario === "scale" && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Traffic Multiplier
            </p>

            <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-medium text-white">
              {trafficMultiplier}×
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="20"
            value={trafficMultiplier}
            onChange={(event) =>
              setTrafficMultiplier(Number(event.target.value))
            }
            className="w-full accent-white"
          />

          <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
            <span>1×</span>
            <span>20×</span>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          console.log("Simulation requested:", {
            scenario,
            trafficMultiplier,
          });
        }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black transition hover:bg-zinc-200"
      >
        <Play size={15} fill="currentColor" />
        Run Simulation
      </button>

      <p className="mt-3 text-center text-[9px] leading-relaxed text-zinc-600">
        Simulation uses modeled infrastructure assumptions.
      </p>
    </aside>
  );
}
