import type { Metadata } from "next";
import { ThreatFilterBar } from "@/components/threats/threat-filter-bar";
import { ThreatQueue } from "@/components/threats/threat-queue";
import { getSentinelDataSource } from "@/data/data-source";
import { parseRiskFilter, parseStatusFilter } from "@/data/threat-query";
import { ThreatStoryPanel } from "@/components/threat-intelligence/threat-story-panel";
import { ContainmentPanel } from "@/components/threats/containment-panel";
import Link from "next/link";
import { X } from "lucide-react";

export const metadata: Metadata = { title: "Threat Queue" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function scalar(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default async function ThreatsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = scalar(params.q) ?? "";
  const risk = parseRiskFilter(scalar(params.risk));
  const status = parseStatusFilter(scalar(params.status));
  const focus = scalar(params.focus);
  const source = getSentinelDataSource();
  const [threats, counts, focusedThreat, mitre] = await Promise.all([
    source.listThreats({ q, risk, status }),
    source.getCounts(),
    focus ? source.getThreat(focus) : Promise.resolve(null),
    focus ? source.getMitreAlert(focus) : Promise.resolve(null),
  ]);
  const [containment, responseHistory] = focusedThreat
    ? await Promise.all([source.getContainmentState(focusedThreat.employeeId), source.getResponseHistory(focusedThreat.employeeId)])
    : [null, { items: [] }];
  const total = counts.alerts;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div><div className="tech-label">Sentinel / Triage</div><h1 className="mt-2 text-[24px] font-bold tracking-[-0.03em]">Alert Investigation</h1><p className="mt-1 text-[12px] text-[var(--text-secondary)]">Prioritised alerts with explainable evidence and investigation context.</p></div>
        <div aria-live="polite" className="font-mono text-[11px] text-[var(--text-muted)]"><span className="text-foreground">{threats.length}</span> / {total} alerts</div>
      </section>

      <ThreatFilterBar q={q} risk={risk} status={status} />
      <ThreatQueue threats={threats} focusedId={focus} />
      {focusedThreat && containment && <>
        <Link href="/threats" aria-label="Close investigation drawer" className="fixed inset-0 z-40 bg-[#10233d]/18 backdrop-blur-[1px]" />
        <aside aria-label={`Investigation for ${focusedThreat.alertId}`} className="fixed inset-y-0 right-0 z-50 w-full max-w-[940px] overflow-y-auto border-l border-border bg-[var(--background)] p-4 shadow-[-22px_0_55px_rgb(16_36_62/0.16)] sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4"><div><div className="tech-label text-[var(--accent)]">Investigation workspace</div><h2 className="mt-2 text-[19px] font-bold tracking-[-0.03em]">{focusedThreat.employeeName} · {focusedThreat.title}</h2><p className="mt-1 font-mono text-[9px] text-[var(--text-muted)]">{focusedThreat.alertId} · RISK {focusedThreat.riskScore.toFixed(0)} · {focusedThreat.status}</p></div><Link href="/threats" aria-label="Close investigation" className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-white text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"><X className="size-4" /></Link></div>
          <div className="space-y-5">{mitre && <ThreatStoryPanel report={mitre} compact />}<ContainmentPanel threat={focusedThreat} initialState={containment} initialHistory={responseHistory.items} mitre={mitre} /></div>
        </aside>
      </>}
    </div>
  );
}
