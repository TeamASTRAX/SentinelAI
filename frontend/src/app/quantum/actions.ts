"use server";

import { getSentinelDataSource } from "@/data/data-source";
import type { QaoaOptimizationResult } from "@/domain/sentinel";

export async function runQaoaOptimization(): Promise<{ ok: true; result: QaoaOptimizationResult } | { ok: false; error: string }> {
  try {
    const result = await getSentinelDataSource().runQuantumOptimization();
    return { ok: true, result };
  } catch {
    return { ok: false, error: "The backend could not complete this run. Check service availability and try again." };
  }
}
