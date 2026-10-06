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
  const system = await getSentinelDataSource().getSystemStatus();
  return (
    <html lang="en">
      <body><AppShell system={system}><div className="page-enter">{children}</div></AppShell></body>
    </html>
  );
}
