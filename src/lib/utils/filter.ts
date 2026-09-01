import type { AnalysisRecord } from "@/types/analysis"
import type { Surface } from "@/types/analysis"
import { ALL_SURFACES } from "@/types/analysis"
import type { TimeRange } from "@/types/dashboard"

export interface FilterOptions {
	surfaceFilter: string
	timeFilter: TimeRange
}

export function isWithinRange(dateStr: string, days: number): boolean {
	const date = new Date(dateStr)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffDays = diffMs / (1000 * 60 * 60 * 24)
	return diffDays <= days
}

export function filterAnalysisRecords(
	records: AnalysisRecord[],
	opts: FilterOptions,
): AnalysisRecord[] {
	const { surfaceFilter, timeFilter } = opts

	return records.filter((r) => {
		if (surfaceFilter !== ALL_SURFACES && r.surface !== surfaceFilter) {
			return false
		}

		if (timeFilter !== "all") {
			const days = Number.parseInt(timeFilter.replace("d", ""), 10)
			if (!isWithinRange(r.prompt_run_at, days)) return false
		}

		return true
	})
}

export function getAvailableSurfaces(records: AnalysisRecord[]): Surface[] {
	const set = new Set<Surface>()
	for (const r of records) {
		set.add(r.surface)
	}
	return Array.from(set)
}
