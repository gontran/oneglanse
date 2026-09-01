"use client"

import { Card } from "@/components/ui/card"
import { Favicon } from "@/components/ui/favicon"
import { formatCitationLabel } from "@/lib/utils/format"
import type { DashboardSourceData } from "@/types/dashboard"

export function TopSources({
	sources,
	totalCitations = 1,
}: {
	sources: DashboardSourceData[]
	totalCitations?: number
}) {
	const visibleSources = sources.slice(0, 5)

	return (
		<Card className="flex h-full min-w-0 flex-col p-5 lg:p-6">
			<div>
				<h1 className="mt-2 text-base font-semibold leading-none tracking-tight text-gray-900 sm:text-lg dark:text-gray-100">
					Sources principales
				</h1>
				<p className="mt-2 text-xs text-muted-foreground">
					Domaines les plus cites par les IA (sources fictives de demonstration).
				</p>
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-3">
				{visibleSources.map((source, idx) => {
					const usagePercent = ((source.citationCount / totalCitations) * 100).toFixed(1)
					return (
						<div
							key={source.domain}
							className="ui-list-item group grid min-w-0 grid-cols-[1fr_auto] items-center gap-3 rounded-[var(--app-radius)] border border-gray-100/80 bg-white px-4 py-3 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.18)] hover:border-gray-200 hover:bg-stone-50 dark:border-gray-800 dark:bg-neutral-950 dark:shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)] dark:hover:bg-neutral-900"
						>
							<div className="flex min-w-0 items-start gap-3">
								<Favicon domain={source.domain} name={source.domain} size="h-5 w-5" />
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1.5">
										<p className="truncate text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
											{source.domain}
										</p>
										{source.isOwnedDomain && (
											<span className="rounded-[var(--app-radius)] bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
												Vous
											</span>
										)}
									</div>
									<div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
										<span className="rounded-[var(--app-radius)] border border-transparent bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-900/80 dark:text-gray-400">
											{formatCitationLabel(source.citationCount)}
										</span>
										<span className="rounded-[var(--app-radius)] border border-transparent bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-900/80 dark:text-gray-400">
											{source.models.size} surfaces
										</span>
										<span className="rounded-[var(--app-radius)] border border-transparent bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-900/80 dark:text-gray-400">
											#{idx + 1}
										</span>
										{source.isFictional && (
											<span className="rounded-[var(--app-radius)] border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
												Fictive
											</span>
										)}
									</div>
								</div>
							</div>
							<div className="flex min-w-[4.75rem] items-center justify-center text-center text-xs font-semibold text-gray-900 dark:text-gray-100">
								{usagePercent}%
							</div>
						</div>
					)
				})}
			</div>
		</Card>
	)
}
