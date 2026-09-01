import { BRAND } from "@/lib/data/brand"
import { filterAnalysisRecords } from "@/lib/utils/filter"
import { computeDashboardMetrics } from "@/lib/utils/metrics"
import type { AnalysisRecord } from "@/types/analysis"
import { ALL_SURFACES } from "@/types/analysis"
import type { DashboardMetrics, TimeRange } from "@/types/dashboard"
import { useMemo } from "react"

export function useDashboardData(
	records: AnalysisRecord[],
	surfaceFilter: string,
	timeFilter: TimeRange,
): DashboardMetrics {
	return useMemo(() => {
		const filtered = filterAnalysisRecords(records, {
			surfaceFilter,
			timeFilter,
		})
		return computeDashboardMetrics(filtered, BRAND.name, BRAND.domain)
	}, [records, surfaceFilter, timeFilter])
}

export function useFilteredRecords(
	records: AnalysisRecord[],
	surfaceFilter: string,
	timeFilter: TimeRange,
): AnalysisRecord[] {
	return useMemo(() => {
		return filterAnalysisRecords(records, { surfaceFilter, timeFilter })
	}, [records, surfaceFilter, timeFilter])
}

export { ALL_SURFACES }
