"use client"

import { Button } from "@/components/ui/button"
import { Favicon } from "@/components/ui/favicon"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getSurfaceFavicon } from "@/lib/utils/favicon"
import { ALL_SURFACES, SURFACES } from "@/types/analysis"
import type { TimeRange } from "@/types/dashboard"
import { ListFilter as FilterX } from "lucide-react"

export function DashboardFilters({
	brandName,
	brandDomain,
	surfaceFilter,
	setSurfaceFilter,
	timeFilter,
	setTimeFilter,
}: {
	brandName: string
	brandDomain: string
	surfaceFilter: string
	setSurfaceFilter: (v: string) => void
	timeFilter: TimeRange
	setTimeFilter: (v: TimeRange) => void
}) {
	const clearFilters = () => {
		setSurfaceFilter(ALL_SURFACES)
		setTimeFilter("all")
	}

	const hasActiveFilters = surfaceFilter !== ALL_SURFACES || timeFilter !== "all"

	return (
		<div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
			<div className="flex min-w-0 w-full max-w-full items-center gap-2 rounded-[var(--app-radius)] border border-transparent bg-white px-3.5 py-2 text-[13px] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_18px_-14px_rgba(15,23,42,0.12)] sm:w-auto sm:max-w-[240px] sm:h-9 dark:border-transparent dark:bg-neutral-950">
				<Favicon domain={brandDomain} name={brandName} size="h-4 w-4" />
				<span className="truncate font-medium text-gray-900 dark:text-gray-100">{brandName}</span>
			</div>

			<Select value={surfaceFilter} onValueChange={setSurfaceFilter}>
				<SelectTrigger className="w-full sm:w-auto">
					<SelectValue placeholder="Surface IA" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_SURFACES}>
						<span>Toutes les surfaces</span>
					</SelectItem>
					{SURFACES.map((surface) => (
						<SelectItem key={surface} value={surface}>
							<div className="flex items-center gap-2">
								<img
									src={getSurfaceFavicon(surface)}
									alt={surface}
									className="h-4 w-4 rounded-[var(--app-radius)]"
								/>
								<span>{surface}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeRange)}>
				<SelectTrigger className="w-full sm:w-auto">
					<SelectValue placeholder="Periode" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Toute la periode</SelectItem>
					<SelectItem value="7d">7 derniers jours</SelectItem>
					<SelectItem value="14d">14 derniers jours</SelectItem>
					<SelectItem value="30d">30 derniers jours</SelectItem>
				</SelectContent>
			</Select>

			{hasActiveFilters && (
				<>
					<Separator orientation="vertical" className="hidden h-4 sm:block" />
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="w-full gap-2 text-gray-500 transition-colors duration-200 hover:text-gray-700 sm:w-auto"
					>
						<FilterX size={14} />
						Reinitialiser
					</Button>
				</>
			)}
		</div>
	)
}
