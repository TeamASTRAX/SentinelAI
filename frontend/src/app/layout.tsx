import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { getSentinelDataSource } from "@/data/data-source";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SentinelAI Q", template: "%s · SentinelAI Q" },
  description: "Hybrid quantum-classical threat intelligence",
};
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const source = getSentinelDataSource();
  const system = await source.getSystemStatus().catch(() => ({ mode: source.mode, data: { label: source.mode === "http" ? "Configured API" : "Fixture", status: "unavailable" }, database: { label: "Database", status: "unknown" }, model: { label: "Model", status: "unknown" }, operator: { label: "Analyst", session: "unavailable" } }));
  return (
    <html lang="en">
      <body><AppShell system={system}><div className="page-enter">{children}</div></AppShell></body>
    </html>
  );
}
