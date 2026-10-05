"use client";

import { useState } from "react";
import { Atom, Cpu, ShieldOff, Play } from "lucide-react";
import { SectionHeading } from "@/components/system/section-heading";
import type { QaoaOptimizationStatus, QaoaOptimizationResult } from "@/domain/sentinel";

function metric(value: number) { return value.toFixed(3); }

export function QaoaSection({ 
  initialStatus,
  initialLatest
}: { 
  initialStatus: QaoaOptimizationStatus;
  initialLatest: QaoaOptimizationResult | null;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QaoaOptimizationResult | null>(initialLatest);
  const [error, setError] = useState<string | null>(null);

  async function runOptimization() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quantum/optimization/prioritize", { method: "POST" });
      if (!res.ok) throw new Error("Optimization failed");
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || "An error occurred");
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pt-10 border-t border-border mt-10">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="tech-label">Quantum Response Optimization</div>
          <h2 className="mt-2 text-[22px] font-bold tracking-[-0.035em]">QAOA Prioritization</h2>
          <p className="mt-1 max-w-[760px] text-[12px] text-[var(--text-secondary)]">
            Experimental QUBO formulation mapped to a Quantum Approximate Optimization Algorithm.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--medium)]/30 bg-[#fffaf0] px-4 py-3 text-[10px] leading-5 text-[#8b6210]">
          <strong className="block text-[9px] tracking-[0.12em]">EXPERIMENTAL · ADVISORY ONLY</strong>
          QAOA does not modify production risk or execute containment. No quantum advantage is claimed.
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Atom, "Max alerts", initialStatus.maxAlerts],
          [Cpu, "QAOA Depth", initialStatus.depth],
          [Cpu, "Shots", initialStatus.shots],
          [ShieldOff, "Production risk", initialStatus.affectsProductionRisk ? "Enabled" : "Disabled"],
        ].map(([Icon, label, value]) => (
          <article key={String(label)} className="panel p-4">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              {/* @ts-expect-error dynamic component type */}
              <Icon className="size-4" />
              <span className="tech-label">{String(label)}</span>
            </div>
            <div className="mt-3 text-[12px] font-semibold leading-5">{String(value)}</div>
          </article>
        ))}
      </section>

      <section className="panel p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-[12px] text-[var(--text-secondary)]">
          Ready to run QAOA optimization against active alerts.
        </div>
        <button 
          onClick={runOptimization} 
          disabled={loading}
          className="control bg-[var(--accent)] px-5 font-semibold text-white hover:bg-[var(--accent-strong)] flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? "Running Optimization..." : <><Play className="size-3" /> Run Quantum Optimization</>}
        </button>
      </section>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded border border-red-100 text-[12px]">
          {error}
        </div>
      )}

      {result && (
        <>
          <section className="space-y-3">
            <SectionHeading eyebrow="01 / execution" title="Optimization metadata" />
            <div className="panel flex gap-8 p-5 text-[11px]">
              <div><span className="tech-label block mb-1">Alerts Considered</span><span className="font-mono">{result.metadata.alertsConsidered}</span></div>
              <div><span className="tech-label block mb-1">QAOA Depth</span><span className="font-mono">{result.metadata.qaoaDepth}</span></div>
              <div><span className="tech-label block mb-1">Objective Value</span><span className="font-mono">{metric(result.metadata.objectiveValue)}</span></div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeading eyebrow="02 / comparison" title="Classical vs QAOA Ranking" />
            
            {result.metadata.alertsConsidered === 0 ? (
               <div className="panel p-8 text-center text-[var(--text-muted)] text-[12px]">No active alerts to prioritize.</div>
            ) : (
               <div className="grid gap-6 lg:grid-cols-2">
                 <div className="panel overflow-hidden">
                   <div className="bg-[var(--surface-elevated)] border-b border-border px-4 py-3 tech-label">Classical Ranking</div>
                   <div className="divide-y divide-border">
                     {result.classicalRanking.map((item, i) => (
                       <div key={item.alertId} className="p-4">
                         <div className="flex justify-between items-center mb-3">
                           <div className="font-mono font-bold text-[13px]">#{i + 1} {item.alertId}</div>
                           <div className="tech-label text-[var(--medium)]">Score: {metric(item.priorityScore)}</div>
                         </div>
                         <ul className="text-[10px] space-y-1 text-[var(--text-muted)] font-mono bg-gray-50 p-2 rounded">
                           {item.reasoning.map((r, idx) => <li key={idx}>- {r}</li>)}
                         </ul>
                       </div>
                     ))}
                   </div>
                 </div>

                 <div className="panel overflow-hidden border-[var(--accent)]">
                   <div className="bg-[#f4f7fc] border-b border-[var(--accent)]/20 px-4 py-3 tech-label text-[#214f9d]">QAOA Ranking</div>
                   <div className="divide-y divide-[var(--accent)]/10">
                     {result.qaoaRanking.map((item, i) => (
                       <div key={item.alertId} className="p-4">
                         <div className="flex justify-between items-center mb-3">
                           <div className="font-mono font-bold text-[13px] text-[#193250]">#{i + 1} {item.alertId}</div>
                           <div className="tech-label text-[#214f9d]">Prob: {metric(item.probability ?? 0)}</div>
                         </div>
                         <ul className="text-[10px] space-y-1 text-[#4a6b9a] font-mono bg-white p-2 rounded border border-[var(--accent)]/10">
                           {item.reasoning.map((r, idx) => <li key={idx}>- {r}</li>)}
                         </ul>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
