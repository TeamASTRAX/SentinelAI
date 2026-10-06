"use server";

import { getSentinelDataSource } from "@/data/data-source";
import type { QaoaOptimizationResult } from "@/domain/sentinel";

export async function runQaoaOptimization(): Promise<{ ok: true; result: QaoaOptimizationResult } | { ok: false; error: string }> {
  try {
    const result = await getSentinelDataSource().runQuantumOptimization();
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Quantum response optimization could not be completed." };
  }
}
