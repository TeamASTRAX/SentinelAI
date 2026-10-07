"use client";
import { useState } from "react";
import type { MitreReport } from "@/domain/sentinel";

export function StoryJourney({ report }: { report: MitreReport }) {
  const stages = [
    { name: "Activity", evidence: report.timeline.map(entry => `${entry.activity} · ${entry.observation}`) },
    { name: "Anomaly", evidence: report.threatStory.keyEvidence },
    { name: "MITRE", evidence: report.mappings.map(mapping => `${mapping.techniqueId} · ${mapping.techniqueName}: ${mapping.explanation}`) },
    { name: "Graph correlation", evidence: [...report.threatStory.graphContext, ...report.graphEvidence.map(finding => finding.explanation)] },
    { name: "Investigation focus", evidence: report.threatStory.investigationFocus },
  ].filter(stage => stage.evidence.length);
  const [selected, setSelected] = useState(0);
  const current = stages[selected] ?? stages[0];
  if (!current) return null;
  return <div className="border-b border-border p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="tech-label">Evidence journey</h3><span className="text-[10px] text-[var(--text-muted)]">Only supported stages are shown</span></div><div className="story-stages">{stages.map((stage, index) => <button key={stage.name} className="story-stage" aria-pressed={current.name === stage.name} aria-controls={`journey-${report.subjectId}`} onClick={() => setSelected(index)}><span className="mr-2 opacity-60">0{index + 1}</span>{stage.name}</button>)}</div><div id={`journey-${report.subjectId}`} className="mt-4 rounded-xl bg-[var(--surface-elevated)] p-4" aria-live="polite"><ul key={current.name} className="page-enter space-y-2 text-[11px] leading-5 text-[var(--text-secondary)]">{current.evidence.map((evidence, index) => <li key={index}>{evidence}</li>)}</ul></div></div>;
}
