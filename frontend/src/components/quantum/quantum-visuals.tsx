"use client";

import { useState } from "react";
import { ArrowRight, Atom, Braces, CircleDot, GitCompareArrows } from "lucide-react";
import type { QuantumCircuitAnalysis, QuantumThreatSimilarity } from "@/domain/sentinel";

function metric(value: number) { return value.toFixed(3); }

export function FeatureEncodingVisual({ circuit }: { circuit: QuantumCircuitAnalysis }) {
  return (
    <div className="panel quantum-panel overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2 border-b border-[var(--quantum-border)] bg-[var(--quantum-soft)] px-4 py-3 text-center text-[9px] font-bold uppercase tracking-[.1em] text-[var(--quantum-strong)]">
        <span>Behaviour feature</span><ArrowRight className="size-3" /><span>Normalization</span><ArrowRight className="size-3" /><span>Rotation angle</span><ArrowRight className="size-3" /><span>Qubit encoding</span><ArrowRight className="size-3" /><span>Quantum circuit</span>
      </div>
      <div className="divide-y divide-border">
        {circuit.featureQubitMapping.map((item, index) => {
          const rotation = circuit.rotationParameters.find((entry) => entry.qubit === item.qubit);
          return (
            <div key={item.feature} className="group grid gap-3 px-4 py-4 transition-colors hover:bg-[#fbfaff] md:grid-cols-[minmax(180px,1.4fr)_110px_110px_90px] md:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--quantum-soft)] font-mono text-[11px] font-bold text-[var(--quantum-strong)]">q{item.qubit}</span>
                <div className="min-w-0"><div className="text-[11px] font-bold">{item.label}</div><div className="mt-1 break-words font-mono text-[9px] text-[var(--text-muted)]">{item.sourceFeature}</div><div className="mt-1 text-[9px] text-[var(--text-muted)]">{item.normalization}</div></div>
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
  const [detail, setDetail] = useState("Select a gate to inspect its operation. This diagram represents returned simulator results, not execution progress.");
  const [active, setActive] = useState<number | null>(null);
  const connections = circuit.gateSequence.flatMap(stage => {
    const pair = stage.match(/^CX\((\d+)→(\d+)\)$/);
    return pair ? [{ control: Number(pair[1]), target: Number(pair[2]) }] : [];
  });
  function inspect(qubit: number, text: string) { setActive(qubit); setDetail(text); }
  return <div className="panel quantum-panel overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"><span className="text-[11px] font-semibold">{circuit.entanglementStructure}</span><span className="tech-label">{circuit.qubits} qubits · simulator</span></div>
    <div className="soft-grid overflow-x-auto p-4">
      <svg viewBox="0 0 640 260" className="min-w-[530px] w-full" role="group" aria-label="Interactive circuit from backend gate sequence">
        {circuit.featureQubitMapping.map((item, index) => {
          const y = 40 + index * 58;
          const rotation = circuit.rotationParameters.find(entry => entry.qubit === item.qubit);
          return <g key={item.qubit}><text x="8" y={y + 4} fontSize="12" fill="var(--quantum-strong)">q{item.qubit}</text><line x1="44" x2="625" y1={y} y2={y} stroke={active === item.qubit ? "var(--quantum)" : "var(--border-strong)"} strokeWidth={active === item.qubit ? 2 : 1} />{(["RY", "RZ"] as const).map((gate, gateIndex) => {
            const angle = gate === "RY" ? rotation?.ryRadians : rotation?.rzRadians;
            const explanation = `${gate} rotates q${item.qubit} around the ${gate === "RY" ? "Y" : "Z"} axis by ${angle?.toFixed(3) ?? "unavailable"} radians, encoding ${item.label.toLowerCase()}.`;
            const x = 70 + gateIndex * 75;
            return <g key={gate} className="gate-reveal" style={{ animationDelay: `${index * 90 + gateIndex * 60}ms` }}><rect className="circuit-gate" role="button" tabIndex={0} aria-label={explanation} x={x} y={y - 17} width="38" height="34" rx="7" onClick={() => inspect(item.qubit, explanation)} onFocus={() => inspect(item.qubit, explanation)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inspect(item.qubit, explanation); } }}><title>{explanation}</title></rect><text x={x + 19} y={y + 4} textAnchor="middle" fontSize="10" fill="var(--quantum-strong)" pointerEvents="none">{gate}</text></g>;
          })}</g>;
        })}
        {connections.map(({ control, target }, index) => {
          const x = 265 + index * 90;
          const y1 = 40 + circuit.featureQubitMapping.findIndex(item => item.qubit === control) * 58;
          const y2 = 40 + circuit.featureQubitMapping.findIndex(item => item.qubit === target) * 58;
          const explanation = `CX q${control} → q${target}: controlled-X flips the target when the control is 1. Ring connections couple qubits and can create entanglement.`;
          return <g key={`${control}-${target}`} className="gate-reveal" style={{ animationDelay: `${350 + index * 100}ms` }}><line x1={x} x2={x} y1={y1} y2={y2} stroke="var(--quantum)" /><circle cx={x} cy={y1} r="5" fill="var(--quantum)" /><circle className="circuit-gate" role="button" tabIndex={0} aria-label={explanation} cx={x} cy={y2} r="13" onClick={() => inspect(target, explanation)} onFocus={() => inspect(target, explanation)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inspect(target, explanation); } }}><title>{explanation}</title></circle><text x={x} y={y2 + 5} textAnchor="middle" fill="var(--quantum-strong)" pointerEvents="none">+</text></g>;
        })}
      </svg>
    </div>
    <p aria-live="polite" className="min-h-[76px] border-t border-border bg-[var(--quantum-soft)] p-4 text-[11px] leading-5 text-[var(--quantum-strong)]">{detail}</p>
    <details className="border-t border-border px-4 py-3 text-[10px] text-[var(--text-secondary)]"><summary className="cursor-pointer font-semibold">Inspect exact circuit output</summary><pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-elevated)] p-4 font-mono text-[10px] leading-5">{circuit.circuitDiagram}</pre></details>
  </div>;
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
