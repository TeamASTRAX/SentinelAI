import type { Metadata } from "next";
import { Atom, Binary, Cpu, FlaskConical, ShieldOff, Workflow } from "lucide-react";
import { getSentinelDataSource } from "@/data/data-source";
import { SectionHeading } from "@/components/system/section-heading";

export const metadata: Metadata = { title: "Quantum Analysis" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function scalar(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function metric(value: number) { return value.toFixed(3); }

import { QaoaSection } from "./qaoa-section";

export default async function QuantumAnalysisPage({ searchParams }: { searchParams: SearchParams }) {
  const data = getSentinelDataSource();
  const params = await searchParams;
  const [status, events, qaoaStatus, qaoaLatest] = await Promise.all([
    data.getQuantumStatus(),
    data.listActivity({ sort: "risk_score", direction: "desc", pageSize: 50 }),
    data.getQuantumOptimizationStatus(),
    data.getQuantumOptimizationLatest(),
  ]);
  const selectedEventId = scalar(params.eventId) ?? events.items[0]?.eventId;
  const analysis = selectedEventId && status.status === "ready" ? await data.getQuantumEventAnalysis(selectedEventId) : null;

  return <div className="mx-auto max-w-[1700px] space-y-6">
    <section className="flex flex-col gap-4 border-b border-border pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div><div className="tech-label">Sentinel / Experimental Lab</div><h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em]">Quantum Analysis</h1><p className="mt-1 max-w-[760px] text-[12px] text-[var(--text-secondary)]">Four-qubit behavioural encoding, fidelity-kernel analysis, and VQC inference for one persisted security event.</p></div>
      <div className="rounded-lg border border-[var(--medium)]/30 bg-[#fffaf0] px-4 py-3 text-[10px] leading-5 text-[#8b6210]"><strong className="block text-[9px] tracking-[0.12em]">EXPERIMENTAL · ADVISORY ONLY</strong>Quantum outputs never modify production risk or trigger response actions.</div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[
        [Cpu, "Quantum backend", status.backend], [Binary, "Qubits", String(status.qubits)],
        [Workflow, "Quantum kernel", status.quantumKernelStatus], [FlaskConical, "VQC", status.vqcStatus],
        [ShieldOff, "Production risk", status.affectsProductionRisk ? "Enabled" : "Disabled"],
      ].map(([Icon, label, value]) => <article key={String(label)} className="panel p-4"><div className="flex items-center gap-2 text-[var(--accent)]"><Icon className="size-4" /><span className="tech-label">{String(label)}</span></div><div className="mt-3 text-[12px] font-semibold leading-5">{String(value)}</div></article>)}
    </section>

    <section className="panel p-4">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1"><span className="tech-label">Select event</span><select name="eventId" defaultValue={selectedEventId} className="control mt-2 w-full px-3 font-mono text-[11px]">{events.items.map((event) => <option key={event.eventId} value={event.eventId}>{event.eventId} · {event.employeeName} · {event.activityType} · risk {event.riskScore?.toFixed(0) ?? "—"}</option>)}</select></label>
        <button className="control bg-[var(--accent)] px-5 font-semibold text-white hover:bg-[var(--accent-strong)]">Run analysis</button>
      </form>
    </section>

    {!analysis ? <section className="panel border-[var(--medium)]/30 p-8 text-center"><Atom className="mx-auto size-8 text-[var(--medium)]" /><h2 className="mt-3 text-[14px] font-semibold">Live quantum analysis is unavailable in fixture mode</h2><p className="mx-auto mt-2 max-w-[620px] text-[11px] leading-5 text-[var(--text-muted)]">{status.reason ?? "Start the FastAPI service and set SENTINEL_DATA_SOURCE=http to execute Qiskit circuits against persisted events."}</p></section> : <>
      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.35fr]">
        <div className="space-y-3"><SectionHeading eyebrow="01 / Encoding" title="Behavioural feature encoding" description={`${analysis.eventId} · ${analysis.employee.employeeName} · ${analysis.employee.department}`} /><div className="panel overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-border bg-[var(--surface-elevated)] text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]"><tr><th className="px-4 py-3">Qubit</th><th className="px-4 py-3">Behavioural feature</th><th className="px-4 py-3">Original</th><th className="px-4 py-3">Normalized</th></tr></thead><tbody className="divide-y divide-border">{analysis.circuit.featureQubitMapping.map((item) => <tr key={item.feature}><td className="px-4 py-3 font-mono text-[11px] text-[var(--accent)]">q[{item.qubit}]</td><td className="px-4 py-3"><div className="text-[11px] font-semibold">{item.label}</div><div className="mt-1 font-mono text-[9px] text-[var(--text-muted)]">{item.normalization}</div></td><td className="px-4 py-3 font-mono text-[11px]">{metric(analysis.circuit.originalFeatureValues[item.feature])}</td><td className="px-4 py-3 font-mono text-[11px]">{metric(analysis.circuit.normalizedFeatureValues[item.feature])}</td></tr>)}</tbody></table></div></div>
        <div className="space-y-3"><SectionHeading eyebrow="02 / Circuit" title="Quantum feature map" description={analysis.circuit.entanglementStructure} /><div className="panel overflow-hidden"><div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border bg-[var(--surface-elevated)] px-4 py-3 text-[9px] text-[var(--text-muted)]"><span><b className="text-foreground">BACKEND</b> {analysis.circuit.backend}</span><span><b className="text-foreground">GATES</b> {analysis.circuit.gateSequence.length}</span><span><b className="text-foreground">MODE</b> simulator</span></div><pre className="scrollbar-thin overflow-x-auto p-5 font-mono text-[10px] leading-5 text-[#193250]">{analysis.circuit.circuitDiagram}</pre></div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5"><SectionHeading eyebrow="03 / Quantum kernel" title="Normal-baseline fidelity" /><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg bg-[var(--surface-elevated)] p-4"><div className="font-mono text-[26px] font-semibold">{metric(analysis.quantumKernel.similarityToNormalBaseline)}</div><div className="mt-1 tech-label">Similarity</div></div><div className="rounded-lg bg-[var(--surface-elevated)] p-4"><div className="font-mono text-[26px] font-semibold text-[var(--high)]">{metric(analysis.quantumKernel.anomalyScore)}</div><div className="mt-1 tech-label">Anomaly score</div></div></div><p className="mt-4 text-[11px] font-medium">{analysis.quantumKernel.interpretation}</p><p className="mt-2 text-[10px] leading-5 text-[var(--text-muted)]">{analysis.quantumKernel.scoreMeaning}</p></article>
        <article className="panel p-5"><SectionHeading eyebrow="04 / Variational classifier" title="VQC inference" /><div className="mt-5 flex items-end justify-between gap-4"><div><div className={`font-mono text-[26px] font-semibold ${analysis.vqc.prediction === "SUSPICIOUS" ? "text-[var(--high)]" : "text-[var(--low)]"}`}>{analysis.vqc.prediction}</div><div className="mt-1 tech-label">Prediction</div></div><div className="text-right"><div className="font-mono text-[26px] font-semibold">{metric(analysis.vqc.modelScore)}</div><div className="mt-1 tech-label">Model score</div></div></div><dl className="mt-5 grid gap-3 border-t border-border pt-4 text-[10px] sm:grid-cols-2"><div><dt className="tech-label">Ansatz</dt><dd className="mt-1 leading-4">{analysis.vqc.ansatz}</dd></div><div><dt className="tech-label">Training</dt><dd className="mt-1 leading-4">{analysis.vqc.trainingRows} representative rows · {analysis.vqc.optimizer}</dd></div></dl><p className="mt-3 text-[10px] leading-5 text-[var(--text-muted)]">{analysis.vqc.scoreMeaning}</p></article>
      </section>

      <section className="space-y-3"><SectionHeading eyebrow="05 / Comparison" title="Classical vs quantum" description="The same event, evaluated independently by three models" /><div className="grid gap-3 lg:grid-cols-3">{[
        { title: "Classical model", name: analysis.comparison.classicalModel.model, prediction: analysis.comparison.classicalModel.prediction, score: analysis.comparison.classicalModel.anomalyScore, dimensions: analysis.comparison.classicalModel.featureDimensions, backend: analysis.comparison.classicalModel.executionBackend },
        { title: "Quantum model 1", name: analysis.comparison.quantumKernel.model, prediction: "SIMILARITY", score: analysis.comparison.quantumKernel.similarityToNormalBaseline, dimensions: analysis.comparison.quantumKernel.featureDimensions, backend: analysis.comparison.quantumKernel.executionBackend },
        { title: "Quantum model 2", name: analysis.comparison.vqc.modelType, prediction: analysis.comparison.vqc.prediction, score: analysis.comparison.vqc.modelScore, dimensions: analysis.comparison.vqc.featureDimensions, backend: analysis.comparison.vqc.executionBackend },
      ].map((item) => <article key={item.title} className="panel p-5"><div className="tech-label">{item.title}</div><h3 className="mt-2 text-[13px] font-semibold">{item.name}</h3><div className="mt-5 flex items-end justify-between"><span className="font-mono text-[12px] font-semibold">{item.prediction}</span><span className="font-mono text-[24px] font-semibold">{item.score === null ? "—" : metric(item.score)}</span></div><dl className="mt-4 space-y-2 border-t border-border pt-3 text-[10px]"><div className="flex justify-between gap-3"><dt className="text-[var(--text-muted)]">Feature dimensions</dt><dd className="font-mono">{item.dimensions}</dd></div><div className="flex justify-between gap-3"><dt className="text-[var(--text-muted)]">Execution</dt><dd className="text-right">{item.backend}</dd></div></dl></article>)}</div><div className="rounded-lg border border-[var(--accent)]/20 bg-[var(--accent-dim)] px-4 py-3 text-[10px] font-medium text-[#214f9d]">{analysis.comparison.disclosure}</div></section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-3"><SectionHeading eyebrow="06 / Similarity" title="Quantum threat similarity" description="Actual fidelity-kernel comparisons against representative encoded profiles" /><div className="panel divide-y divide-border">{analysis.threatSimilarity.items.map((item) => <div key={item.profile} className="grid grid-cols-[minmax(0,1fr)_120px_52px] items-center gap-3 px-4 py-3"><span className="text-[11px] font-medium">{item.profile}</span><span className="h-1.5 overflow-hidden rounded-full bg-[#edf1f6]"><span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${item.similarity * 100}%` }} /></span><span className="text-right font-mono text-[11px]">{metric(item.similarity)}</span></div>)}</div><p className="text-[10px] text-[var(--text-muted)]">{analysis.threatSimilarity.scoreMeaning}</p></div>
        <div className="space-y-3"><SectionHeading eyebrow="07 / Guardrails" title="Experimental limitations" /><div className="panel p-5"><ul className="space-y-3 text-[10px] leading-5 text-[var(--text-muted)]">{analysis.limitations.map((item) => <li key={item} className="flex gap-2"><span className="text-[var(--medium)]">—</span><span>{item}</span></li>)}</ul></div></div>
      </section>

      <QaoaSection initialStatus={qaoaStatus} initialLatest={qaoaLatest} />
    </>}
  </div>;
}
