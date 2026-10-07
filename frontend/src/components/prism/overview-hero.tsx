import Link from "next/link";
import { ArrowRight, FlaskConical, Layers3, Radar, Network, Fingerprint, Atom, ShieldCheck, Workflow } from "lucide-react";
import { QuantumCore } from "./quantum-core";

export function OverviewHero({ mode, model }: { mode: string; model: string }) {
  return <section className="prism-hero">
    <div className="hero-mesh" aria-hidden="true" />
    <div className="hero-copy"><div className="hero-eyebrow"><span /> PRISM / QUANTUM COMMAND CENTER</div><h1>SentinelAI <span>Q</span></h1><h2>Hybrid Quantum-Classical<br />Threat Intelligence</h2><p>Detect. Explain. Optimize. Respond.</p><div className="hero-actions"><Link href="/quantum" className="prism-button magnetic">Explore Quantum <ArrowRight size={15} /></Link><Link href="/attack-lab" className="prism-button secondary magnetic"><FlaskConical size={15} />Run Attack Lab</Link></div><div className="hero-provenance"><span>{mode} data</span><span>Classical model · {model}</span><span>Quantum · experimental</span></div></div>
    <QuantumCore />
  </section>;
}

const stages = [
  { title: "Employee behaviour", note: "Persisted telemetry", icon: Fingerprint, href: "/activity" },
  { title: "Detection", note: "Rules & baselines", icon: Radar, href: "/models" },
  { title: "Classical + quantum", note: "Independent analysis", icon: Atom, href: "/quantum" },
  { title: "MITRE + graph", note: "Evidence correlation", icon: Network, href: "/graph" },
  { title: "Threat story", note: "Explainable context", icon: Layers3, href: "/threat-intelligence" },
  { title: "QAOA priority", note: "Advisory optimization", icon: Workflow, href: "/quantum#optimization" },
  { title: "Analyst response", note: "Policy & containment", icon: ShieldCheck, href: "/alerts" },
];
export function ArchitectureFlow() {
  return <section className="architecture-section"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><div className="tech-label">From signal to response</div><h2 className="mt-1 text-base font-semibold">Intelligence, connected.</h2></div><p className="text-[11px] text-[var(--text-muted)]">Architecture illustration · quantum outputs remain advisory</p></div><div className="architecture-flow">{stages.map(({ title, note, icon: Icon, href }, index) => <Link key={title} href={href} className="architecture-card tilt-card"><span className="architecture-number">0{index + 1}</span><Icon size={20} /><strong>{title}</strong><small>{note}</small></Link>)}</div></section>;
}
