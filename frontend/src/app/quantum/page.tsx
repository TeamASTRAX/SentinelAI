import { QuantumCore } from "@/components/prism/quantum-core";
import { ModelComparison } from "@/components/quantum/model-comparison";
import type { Metadata } from "next";
import { Atom, Binary, Cpu, FlaskConical, ShieldOff, Sparkles, Workflow } from "lucide-react";
import { getSentinelDataSource } from "@/data/data-source";
import { SectionHeading } from "@/components/system/section-heading";
import { ComparisonBanner, FeatureEncodingVisual, QuantumCircuitVisual, SimilarityVisual } from "@/components/quantum/quantum-visuals";

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
    <section className="relative overflow-hidden rounded-[22px] border border-[var(--quantum-border)] bg-white px-6 py-7 shadow-[0_18px_48px_rgb(89_54_223/0.08)] xl:flex xl:items-end xl:justify-between">
      <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-[var(--quantum-soft)] opacity-80" />
      <div className="relative"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--quantum-strong)]"><span className="quantum-pulse grid size-7 place-items-center rounded-lg bg-[var(--quantum-soft)]"><Atom className="size-3.5" /></span>SentinelAI Q / Experimental Lab</div><h1 className="mt-4 text-[30px] font-bold tracking-[-0.045em]">Quantum Analysis</h1><p className="mt-1 text-[13px] font-semibold text-[var(--text-secondary)]">Hybrid Quantum-Classical Behaviour Analysis</p><p className="mt-2 max-w-[740px] text-[10px] leading-5 text-[var(--text-muted)]">Four-qubit behavioural encoding, fidelity-kernel analysis, VQC inference, and advisory response optimization using persisted security events.</p></div>
      <div className="relative mt-5 rounded-xl border border-[var(--medium)]/30 bg-[#fffaf0] px-4 py-3 text-[10px] leading-5 text-[#8b6210] xl:mt-0"><strong className="block text-[9px] tracking-[0.12em]">EXPERIMENTAL · ADVISORY ONLY</strong>No quantum advantage is claimed. Outputs never modify production risk or trigger response actions.</div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {[
        [Cpu, "Quantum backend", status.backend], [Binary, "Qubits", String(status.qubits)],
        [Workflow, "Quantum kernel", status.quantumKernelStatus], [FlaskConical, "VQC", status.vqcStatus],
        [Sparkles, "QAOA", qaoaStatus.experimental ? "Experimental" : "Unavailable"],
        [ShieldOff, "Production Risk Contribution", status.affectsProductionRisk ? "Enabled" : "Disabled"],
      ].map(([Icon, label, value]) => <article key={String(label)} className={`panel tilt-card p-4 ${label === "Production Risk Contribution" ? "border-[var(--low)]/30" : ""}`}><div className="flex items-center gap-2 text-[var(--quantum)]"><Icon className="size-4" /><span className="tech-label">{String(label)}</span></div><div className={`mt-3 text-[12px] font-semibold leading-5 ${label === "Production Risk Contribution" ? "text-[var(--low)]" : ""}`}>{String(value)}</div></article>)}
    </section>

    <section className="panel p-4">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1"><span className="tech-label">Select event</span><select name="eventId" defaultValue={selectedEventId} className="control mt-2 w-full px-3 font-mono text-[11px]">{events.items.map((event) => <option key={event.eventId} value={event.eventId}>{event.eventId} · {event.employeeName} · {event.activityType} · risk {event.riskScore?.toFixed(0) ?? "—"}</option>)}</select></label>
        <button disabled={!events.items.length || status.status !== "ready"} className="magnetic prism-button disabled:opacity-50 px-5 font-semibold text-white hover:bg-[var(--accent-strong)]">Run Quantum Analysis</button>
      </form>
    </section>

    {!analysis ? <section className="panel border-[var(--medium)]/30 p-8 text-center"><Atom className="mx-auto size-8 text-[var(--medium)]" /><h2 className="mt-3 text-[14px] font-semibold">Quantum analysis is unavailable</h2><p className="mx-auto mt-2 max-w-[620px] text-[11px] leading-5 text-[var(--text-muted)]">{data.mode === "fixture" ? "Fixture mode contains no executed quantum results. Connect the configured backend to analyze persisted events." : "No analysis was returned. Check backend availability or select another persisted event."}</p></section> : <>
      <section className="panel prism-hero" key={analysis.eventId}><div><div className="tech-label text-[var(--quantum-strong)]">Encoded event / {analysis.eventId}</div><h2 className="mt-3 text-2xl font-semibold">Four signals. One quantum state.</h2><p className="mt-3 max-w-md text-[12px] leading-6 text-[var(--text-secondary)]">Select a qubit to inspect its behavioural signal. These values are returned by the analysis backend.</p><p className="mt-3 text-[11px] text-[var(--text-muted)]">{analysis.circuit.backend}</p><p className="mt-2 text-[10px] text-[var(--quantum-strong)]">Result reveal animation · not execution timing</p></div><QuantumCore circuit={analysis.circuit} /></section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.03fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-3"><SectionHeading eyebrow="01 / Encoding" title="Quantum feature encoding" description={`${analysis.eventId} · ${analysis.employee.employeeName} · ${analysis.employee.department}`} /><FeatureEncodingVisual circuit={analysis.circuit} /></div>
        <div className="min-w-0 space-y-3"><SectionHeading eyebrow="02 / Circuit" title="Four-qubit feature map" description="Hover or focus a gate to inspect its rotation purpose" /><QuantumCircuitVisual circuit={analysis.circuit} /></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="panel p-5"><SectionHeading eyebrow="03 / Quantum kernel" title="Normal-baseline fidelity" /><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg bg-[var(--surface-elevated)] p-4"><div className="font-mono text-[26px] font-semibold">{metric(analysis.quantumKernel.similarityToNormalBaseline)}</div><div className="mt-1 tech-label">Similarity</div></div><div className="rounded-lg bg-[var(--surface-elevated)] p-4"><div className="font-mono text-[26px] font-semibold text-[var(--high)]">{metric(analysis.quantumKernel.anomalyScore)}</div><div className="mt-1 tech-label">Anomaly score</div></div></div><p className="mt-4 text-[11px] font-medium">{analysis.quantumKernel.interpretation}</p><p className="mt-2 text-[10px] leading-5 text-[var(--text-muted)]">{analysis.quantumKernel.scoreMeaning}</p></article>
        <article className="panel p-5"><SectionHeading eyebrow="04 / Variational classifier" title="VQC inference" /><div className="mt-5 flex items-end justify-between gap-4"><div><div className={`font-mono text-[26px] font-semibold ${analysis.vqc.prediction === "SUSPICIOUS" ? "text-[var(--high)]" : "text-[var(--low)]"}`}>{analysis.vqc.prediction}</div><div className="mt-1 tech-label">Prediction</div></div><div className="text-right"><div className="font-mono text-[26px] font-semibold">{metric(analysis.vqc.modelScore)}</div><div className="mt-1 tech-label">Model score</div></div></div><dl className="mt-5 grid gap-3 border-t border-border pt-4 text-[10px] sm:grid-cols-2"><div><dt className="tech-label">Ansatz</dt><dd className="mt-1 leading-4">{analysis.vqc.ansatz}</dd></div><div><dt className="tech-label">Training</dt><dd className="mt-1 leading-4">{analysis.vqc.trainingRows} representative rows · {analysis.vqc.optimizer}</dd></div></dl><p className="mt-3 text-[10px] leading-5 text-[var(--text-muted)]">{analysis.vqc.scoreMeaning}</p></article>
      </section>

      <section className="space-y-3"><SectionHeading eyebrow="05 / Comparison" title="Classical vs quantum" description="The same event, evaluated independently by three models" /><ComparisonBanner /><ModelComparison data={analysis.comparison} /></section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-3"><SectionHeading eyebrow="06 / Similarity" title="Quantum threat similarity" description="Actual fidelity-kernel comparisons against representative encoded profiles" /><SimilarityVisual data={analysis.threatSimilarity} /></div>
        <div className="space-y-3"><SectionHeading eyebrow="07 / Guardrails" title="Experimental limitations" /><div className="panel p-5"><ul className="space-y-3 text-[10px] leading-5 text-[var(--text-muted)]">{analysis.limitations.map((item) => <li key={item} className="flex gap-2"><span className="text-[var(--medium)]">—</span><span>{item}</span></li>)}</ul></div></div>
      </section>

    </>}
    <QaoaSection initialStatus={qaoaStatus} initialLatest={qaoaLatest} available={data.mode === "http"} />
  </div>;
}
