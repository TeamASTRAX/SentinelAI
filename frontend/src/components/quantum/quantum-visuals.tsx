"use client";

import { ArrowRight, Atom, Braces, CircleDot, GitCompareArrows, Orbit } from "lucide-react";
import type { QuantumCircuitAnalysis, QuantumThreatSimilarity } from "@/domain/sentinel";

function metric(value: number) { return value.toFixed(3); }

export function FeatureEncodingVisual({ circuit }: { circuit: QuantumCircuitAnalysis }) {
  return (
    <div className="panel quantum-panel overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2 border-b border-[var(--quantum-border)] bg-[var(--quantum-soft)] px-4 py-3 text-center text-[9px] font-bold uppercase tracking-[.1em] text-[var(--quantum-strong)]">
        <span>Behaviour feature</span><ArrowRight className="size-3" /><span>Normalization</span><ArrowRight className="size-3" /><span>Qubit encoding</span><ArrowRight className="size-3" /><span>Quantum circuit</span>
      </div>
      <div className="divide-y divide-border">
        {circuit.featureQubitMapping.map((item, index) => {
          const rotation = circuit.rotationParameters.find((entry) => entry.qubit === item.qubit);
          return (
            <div key={item.feature} className="group grid gap-3 px-4 py-4 transition-colors hover:bg-[#fbfaff] md:grid-cols-[minmax(180px,1.4fr)_110px_110px_90px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--quantum-soft)] font-mono text-[11px] font-bold text-[var(--quantum-strong)]">q{item.qubit}</span>
                <div className="min-w-0"><div className="text-[11px] font-bold">{item.label}</div><div className="mt-1 truncate font-mono text-[8px] text-[var(--text-muted)]">{item.sourceFeature}</div></div>
              </div>
              <div><div className="tech-label">Original</div><div className="mt-1 font-mono text-[12px] font-semibold">{metric(circuit.originalFeatureValues[item.feature])}</div></div>
              <div><div className="tech-label">Normalized</div><div className="mt-1 flex items-center gap-2"><span className="h-1.5 w-12 overflow-hidden rounded-full bg-[#eceff5]"><span className="progress-reveal block h-full rounded-full bg-[var(--quantum)]" style={{ width: `${circuit.normalizedFeatureValues[item.feature] * 100}%`, animationDelay: `${index * 80}ms` }} /></span><span className="font-mono text-[10px]">{metric(circuit.normalizedFeatureValues[item.feature])}</span></div></div>
              <div title={`RY ${rotation ? metric(rotation.ryRadians) : "—"} rad · RZ ${rotation ? metric(rotation.rzRadians) : "—"} rad`}><div className="tech-label">Rotation</div><div className="mt-1 font-mono text-[10px] font-semibold text-[var(--quantum-strong)]">RY {rotation ? metric(rotation.ryRadians) : "—"}</div><div className="font-mono text-[8px] text-[var(--text-muted)]">RZ {rotation ? metric(rotation.rzRadians) : "—"}</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuantumCircuitVisual({ circuit }: { circuit: QuantumCircuitAnalysis }) {
  return (
    <div className="panel quantum-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--quantum-border)] bg-[var(--quantum-soft)] px-4 py-3">
        <div className="flex items-center gap-2"><Orbit className="size-4 text-[var(--quantum)]" /><span className="text-[10px] font-bold text-[var(--quantum-strong)]">{circuit.entanglementStructure}</span></div>
        <div className="flex gap-3 font-mono text-[8px] text-[var(--text-muted)]"><span>{circuit.qubits} QUBITS</span><span>{circuit.gateSequence.length} STAGES</span><span>SIMULATOR</span></div>
      </div>
      <div className="soft-grid overflow-x-auto p-5">
        <div className="min-w-[620px] space-y-4">
          {circuit.featureQubitMapping.map((item, index) => {
            const rotation = circuit.rotationParameters.find((entry) => entry.qubit === item.qubit);
            return (
              <div key={item.qubit} className="grid grid-cols-[38px_1fr] items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-[var(--quantum-strong)]">q{item.qubit}</span>
                <div className="relative flex h-10 items-center gap-8 before:absolute before:left-0 before:right-0 before:h-px before:bg-[#aebbd0]">
                  <Gate label="RY" detail={`${metric(rotation?.ryRadians ?? 0)} rad`} delay={index * 70} />
                  <Gate label="RZ" detail={`${metric(rotation?.rzRadians ?? 0)} rad`} delay={index * 70 + 80} />
                  <span className="gate-reveal relative z-10 grid size-7 place-items-center rounded-full border-2 border-[var(--quantum)] bg-white text-[9px] font-bold text-[var(--quantum-strong)]" style={{ animationDelay: `${index * 80 + 220}ms` }} title={`CX ring participant q${item.qubit}`}>{index === 3 ? "●" : "×"}</span>
                  <span className="relative z-10 ml-auto rounded-full border border-[var(--quantum-border)] bg-white px-2.5 py-1 font-mono text-[8px] text-[var(--text-muted)]">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <details className="border-t border-border px-4 py-3 text-[9px] text-[var(--text-muted)]">
        <summary className="cursor-pointer font-semibold text-[var(--text-secondary)]">Inspect exact circuit output</summary>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#f8f9fc] p-4 font-mono text-[9px] leading-5 text-[#273c59]">{circuit.circuitDiagram}</pre>
      </details>
    </div>
  );
}

function Gate({ label, detail, delay }: { label: string; detail: string; delay: number }) {
  return <span className="gate-reveal group/gate relative z-10 grid size-9 place-items-center rounded-lg border border-[var(--quantum-border)] bg-white font-mono text-[9px] font-bold text-[var(--quantum-strong)] shadow-sm" style={{ animationDelay: `${delay}ms` }} tabIndex={0}>{label}<span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+7px)] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--foreground)] px-2 py-1 text-[8px] font-normal text-white group-hover/gate:block group-focus/gate:block">{label} rotation · {detail}</span></span>;
}

export function SimilarityVisual({ data }: { data: QuantumThreatSimilarity }) {
  return (
    <div className="panel overflow-hidden">
      <div className="divide-y divide-border">
        {data.items.map((item, index) => <div key={item.profile} className="grid grid-cols-[minmax(0,1fr)_minmax(100px,1.2fr)_56px] items-center gap-4 px-4 py-4"><span className="text-[11px] font-semibold">{item.profile}</span><span className="h-2 overflow-hidden rounded-full bg-[#edf0f5]"><span className="progress-reveal block h-full rounded-full bg-[var(--quantum)]" style={{ width: `${item.similarity * 100}%`, animationDelay: `${index * 90}ms` }} /></span><span className="text-right font-mono text-[11px] font-semibold">{metric(item.similarity)}</span></div>)}
      </div>
      <div className="flex items-start gap-2 border-t border-border bg-[var(--surface-elevated)] px-4 py-3 text-[9px] leading-4 text-[var(--text-muted)]"><CircleDot className="mt-0.5 size-3 shrink-0 text-[var(--quantum)]" />Similarity score · {data.scoreMeaning}</div>
    </div>
  );
}

export function ComparisonBanner() {
  return <div className="flex items-center justify-center gap-4 rounded-2xl border border-[var(--quantum-border)] bg-[var(--quantum-soft)] px-4 py-3 text-[10px] font-bold uppercase tracking-[.11em] text-[var(--quantum-strong)]"><Braces className="size-4" />Classical detection <GitCompareArrows className="size-4" /> Quantum analysis <Atom className="size-4" /></div>;
}
