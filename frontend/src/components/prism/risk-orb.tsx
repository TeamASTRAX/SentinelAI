import { AnimatedNumber } from "@/components/system/animated-number";
export function RiskOrb({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "var(--critical)" : score >= 50 ? "var(--high)" : "var(--accent)";
  return <div className={`risk-orb ${score >= 70 ? "risk-critical" : ""}`} style={{ background: `conic-gradient(${color} ${Math.min(100, Math.max(0, score)) * 3.6}deg, var(--border) 0)` }} aria-label={`${score.toFixed(1)} out of 100, ${label}`}><div><strong aria-hidden="true"><AnimatedNumber value={score} /></strong><span>{label}</span></div></div>;
}
