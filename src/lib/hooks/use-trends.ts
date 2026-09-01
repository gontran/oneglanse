"use client"

import { AUDIT_RUNS } from "@/lib/data/analysis-records"
import { computeDailyMetricsFromRecords } from "@/lib/utils/metrics"
import type { AnalysisRecord } from "@/types/analysis"
import type { DailyMetric } from "@/types/dashboard"
import { useMemo } from "react"

export function useTrends(records: AnalysisRecord[]): DailyMetric[] {
	return useMemo(() => {
		const auditPoints = AUDIT_RUNS.map((run) => ({
			date: run.run_at.split("T")[0],
			records: records.filter((r) => r.audit_run_id === run.id),
		}))

		return computeDailyMetricsFromRecords(auditPoints, 30)
	}, [records])
}
