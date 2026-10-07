"use client";

import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { Atom, ChevronDown, Cpu, Gauge, Play, ShieldCheck, ShieldOff, Sparkles, Target } from "lucide-react";
import { SectionHeading } from "@/components/system/section-heading";
import type { QaoaExplanation, QaoaOptimizationStatus, QaoaOptimizationResult } from "@/domain/sentinel";
import { runQaoaOptimization } from "./actions";

function metric(value: number) { return value.toFixed(3); }

function Ranking({ title, items, quantum = false, revision = 0 }: { title: string; items: QaoaExplanation[]; quantum?: boolean; revision?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const previous = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const rows = Array.from(host.current?.querySelectorAll<HTMLElement>("[data-alert]") ?? []);
    const target = new Map(rows.map(row => [row.dataset.alert!, row.offsetTop]));
    let top = rows[0]?.offsetTop ?? 0;
    const initial = new Map<string, number>();
    [...rows].sort((a, b) => a.dataset.alert!.localeCompare(b.dataset.alert!)).forEach(row => { initial.set(row.dataset.alert!, top); top += row.offsetHeight; });
    const animations: Animation[] = [];
    if (revision > 0 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) rows.forEach(row => {
      const from = previous.current.get(row.dataset.alert!) ?? initial.get(row.dataset.alert!) ?? row.offsetTop;
      animations.push(row.animate([{ transform: `translateY(${from - row.offsetTop}px)`, opacity: .65 }, { transform: "translateY(0)", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" }));
    });
    previous.current = target;
    return () => animations.forEach(animation => animation.cancel());
  }, [items, revision]);
  return <article className={`panel overflow-hidden ${quantum ? "quantum-panel" : ""}`}>
    <div className={`flex items-center justify-between border-b px-4 py-3 ${quantum ? "border-[var(--quantum-border)] bg-[var(--quantum-soft)] text-[var(--quantum-strong)]" : "border-border bg-[var(--surface-elevated)]"}`}><span className="tech-label text-inherit">{title}</span><span className="font-mono text-[9px]">{items.length} ALERTS</span></div>
    <div ref={host} className="relative divide-y divide-border">{items.map((item, index) => <div data-alert={item.alertId} key={item.alertId} className={`p-4 transition-colors ${index === 0 ? (quantum ? "bg-[#fbfaff]" : "bg-[#f8fbff]") : "hover:bg-[var(--surface-hover)]"}`}>
      <div className="flex items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-xl font-mono text-[11px] font-bold ${index === 0 ? (quantum ? "bg-[var(--quantum)] text-white" : "bg-[var(--accent)] text-white") : "bg-[var(--surface-elevated)] text-[var(--text-secondary)]"}`}>#{index + 1}</span><div className="min-w-0 flex-1"><div className="truncate font-mono text-[11px] font-bold">{item.alertId}</div><div className="mt-0.5 text-[8px] uppercase tracking-wider text-[var(--text-muted)]">{index === 0 ? "Top recommendation" : "Advisory priority"}</div></div><div className="text-right"><div className="font-mono text-[12px] font-bold">{(quantum ? item.probability === undefined ? "—" : metric(item.probability) : metric(item.priorityScore))}</div><div className="text-[8px] uppercase text-[var(--text-muted)]">{quantum ? "selection rate" : "priority score"}</div></div></div>
      <details className="group mt-3 rounded-lg border border-border bg-white px-3 py-2"><summary className="flex cursor-pointer list-none items-center justify-between text-[9px] font-bold text-[var(--text-secondary)]">Why this priority?<ChevronDown className="size-3 transition-transform group-open:rotate-180" /></summary><ul className="mt-2 space-y-1.5 border-t border-border pt-2 text-[9px] leading-4 text-[var(--text-muted)]">{item.reasoning.map((reason) => <li key={reason}>• {reason}</li>)}</ul></details>
    </div>)}</div>
  </article>;
}

export function QaoaSection({ initialStatus, initialLatest, available }: { available: boolean; initialStatus: QaoaOptimizationStatus; initialLatest: QaoaOptimizationResult | null }) {
  const [revision, setRevision] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QaoaOptimizationResult | null>(initialLatest);
  const [error, setError] = useState<string | null>(null);

  function runOptimization() {
    setError(null);
    startTransition(async () => {
      const response = await runQaoaOptimization();
      if (response.ok) { setResult(response.result); setRevision(value => value + 1); }
      else setError(response.error);
    });
  }

  return <div id="optimization" className="mt-10 scroll-mt-24 space-y-6 border-t border-border pt-10">
    <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[var(--quantum-strong)]"><Sparkles className="size-3.5" />Quantum Response Optimization</div><h2 className="mt-2 text-[24px] font-bold tracking-[-0.04em]">QAOA Priority Lab</h2><p className="mt-1 max-w-[760px] text-[11px] leading-5 text-[var(--text-secondary)]">Compare deterministic classical priority with the experimental QAOA ordering for the same active alerts.</p></div><div className="flex flex-wrap gap-2 text-[9px] font-bold"><span className="rounded-full border border-[var(--low)]/25 bg-[#effaf4] px-3 py-1.5 text-[var(--low)]"><ShieldCheck className="mr-1 inline size-3" />ADVISORY ONLY</span><span className="rounded-full border border-border bg-white px-3 py-1.5 text-[var(--text-secondary)]">affectsProductionRisk = false</span><span className="rounded-full border border-border bg-white px-3 py-1.5 text-[var(--text-secondary)]">executesContainment = false</span></div></section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { icon: Target, label: "Maximum alerts", value: initialStatus.maxAlerts }, { icon: Atom, label: "QAOA depth", value: initialStatus.depth }, { icon: Cpu, label: "Circuit shots", value: initialStatus.shots }, { icon: ShieldOff, label: "Production risk", value: initialStatus.affectsProductionRisk ? "Enabled" : "Disabled" },
    ].map(({ icon: Icon, label, value }) => <article key={label} className="panel interactive-panel p-4"><div className="flex items-center gap-2 text-[var(--quantum)]"><Icon className="size-4" /><span className="tech-label">{label}</span></div><div className={`mt-3 text-[15px] font-bold ${label === "Production risk" ? "text-[var(--low)]" : ""}`}>{value}</div></article>)}</section>

    <section className="panel quantum-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--quantum-soft)] text-[var(--quantum)]"><Gauge className="size-4" /></span><div className="text-[11px] font-semibold">{available ? "Analyze persisted active alerts" : "Optimization requires the configured backend"}<p className="mt-1 text-[9px] font-normal text-[var(--text-muted)]">Results are read-only, experimental, and never execute containment.</p></div></div><button onClick={runOptimization} disabled={isPending || !available} className="magnetic prism-button inline-flex items-center justify-center gap-2 border-[var(--quantum)] bg-[var(--quantum)] px-5 font-semibold text-white hover:bg-[var(--quantum-strong)] disabled:cursor-wait disabled:opacity-60"><Play className="size-3" />{isPending ? "Running optimization…" : "Run Quantum Optimization"}</button></section>

    <p className="text-[11px] text-[var(--quantum-strong)]">Experimental quantum optimization · Advisory only · No quantum advantage is claimed.</p>
    {isPending && <div role="status" aria-label="Quantum optimization in progress" className="grid gap-4 sm:grid-cols-2"><div className="skeleton-block h-52" /><div className="skeleton-block h-52" /></div>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-[11px] text-red-700"><strong>Optimization unavailable.</strong> {error}</div>}

    {result && <><section className="space-y-3"><SectionHeading eyebrow="08 / Execution" title="Optimization metadata" description="Values returned by the existing QAOA API" /><div className="panel grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">{[
      ["Alerts analyzed", result.metadata.alertsConsidered], ["QAOA depth", result.metadata.qaoaDepth], ["Circuit shots", result.metadata.shots], ["Objective value", metric(result.metadata.objectiveValue)], ["Optimizer", result.metadata.optimizerSuccess ? "Converged" : "Not converged"], ["Backend", "Not reported by optimization API"], ["Runtime", "Not reported by optimization API"], ["Candidate actions", "Alert prioritization only; actions not reported"],
    ].map(([label, value]) => <div key={String(label)}><span className="tech-label block">{label}</span><span className="mt-2 block font-mono text-[12px] font-semibold">{value}</span></div>)}</div></section><section className="space-y-3"><SectionHeading eyebrow="09 / Comparison" title="Classical priority vs QAOA priority" description="Rankings use the same persisted alert inputs and deterministic explanation factors" />{result.metadata.alertsConsidered === 0 ? <div className="panel p-8 text-center text-[11px] text-[var(--text-muted)]">No active alerts are available to prioritize.</div> : <div className="grid gap-5 lg:grid-cols-2"><Ranking title="Classical priority" items={result.classicalRanking} revision={revision} /><Ranking title="QAOA priority" items={result.qaoaRanking} revision={revision} quantum /></div>}</section><p className="flex items-center gap-2 rounded-xl border border-[var(--quantum-border)] bg-[var(--quantum-soft)] px-4 py-3 text-[9px] font-medium text-[var(--quantum-strong)]"><Atom className="size-3.5" />Experimental quantum analysis. No quantum advantage is claimed.</p></>}
  </div>;
}
