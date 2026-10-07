"use client";

import { useState, type CSSProperties } from "react";
import { Atom } from "lucide-react";
import type { QuantumCircuitAnalysis } from "@/domain/sentinel";

const labels = ["Login-time deviation", "Failed-login behaviour", "Download-volume anomaly", "Device / location anomaly"];
export function QuantumCore({ circuit }: { circuit?: QuantumCircuitAnalysis }) {
  const [selected, setSelected] = useState(0);
  const mapping = circuit?.featureQubitMapping.find(item => item.qubit === selected);
  return <div className={`core-scene ${circuit ? "core-encoded" : ""}`}>
    <div className="core-stage">
      <div className="core-floor" aria-hidden="true" />
      <div className="core-orbit orbit-a" aria-hidden="true"><i /></div><div className="core-orbit orbit-b" aria-hidden="true"><i /></div>
      <svg className="core-connections" viewBox="0 0 360 300" aria-hidden="true"><path d="M180 34 L312 150 L180 266 L48 150 Z M180 34 V266 M48 150 H312" /></svg>
      <div className="core-center" aria-hidden="true"><Atom size={44} strokeWidth={1.2} /><span>QUANTUM CORE</span></div>
      {labels.map((label, index) => <button key={label} type="button" className={`qubit qubit-${index} ${selected === index ? "qubit-selected" : ""}`} style={{ "--node-delay": `${index * 160}ms` } as CSSProperties} aria-label={`q${index}: ${label}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><span>q{index}</span><i aria-hidden="true" /></button>)}
    </div>
    <div className="core-caption" aria-live="polite"><span className="core-caption-id">q{selected}</span><span><strong>{mapping?.label ?? labels[selected]}</strong><small>{mapping && circuit ? `Normalized ${circuit.normalizedFeatureValues[mapping.feature].toFixed(3)} · ${mapping.normalization}` : "Four-qubit feature encoding · conceptual visual"}</small></span></div>
  </div>;
}
