"use client"

import { AggregateStatsRow } from "@/components/dashboard/aggregate-stats-row"
import { BrandComparisonChart } from "@/components/dashboard/brand-comparison-chart"
import { BrandPerceptionCard } from "@/components/dashboard/brand-perception-card"
import { CompetitiveLandscape } from "@/components/dashboard/competitive-landscape"
import { DashboardFilters } from "@/components/dashboard/filters"
import { type PromptGroup, PromptResponsesList } from "@/components/dashboard/prompt-responses-list"
import { EmptyDashboardState } from "@/components/dashboard/states"
import { TopSources } from "@/components/dashboard/top-sources"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ANALYSIS_RECORDS } from "@/lib/data/analysis-records"
import { BRAND } from "@/lib/data/brand"
import { PROMPTS } from "@/lib/data/prompts"
import { filterAnalysisRecords } from "@/lib/utils/filter"
import { computeDashboardMetrics } from "@/lib/utils/metrics"
import { ALL_SURFACES } from "@/types/analysis"
import type { TimeRange } from "@/types/dashboard"
import { Info } from "lucide-react"
import { useMemo, useState } from "react"

export function DashboardClient() {
	const [surfaceFilter, setSurfaceFilter] = useState<string>(ALL_SURFACES)
	const [timeFilter, setTimeFilter] = useState<TimeRange>("all")

	const records = ANALYSIS_RECORDS

	const metrics = useMemo(() => {
		const filtered = filterAnalysisRecords(records, {
			surfaceFilter,
			timeFilter,
		})
		return computeDashboardMetrics(filtered, BRAND.name, BRAND.domain)
	}, [records, surfaceFilter, timeFilter])

	const promptGroups = useMemo((): PromptGroup[] => {
		const filtered = filterAnalysisRecords(records, {
			surfaceFilter,
			timeFilter,
		})
		const groupMap = new Map<string, PromptGroup>()

		for (const record of filtered) {
			const promptMeta = PROMPTS.find((p) => p.id === record.prompt_id)
			const existing = groupMap.get(record.prompt_id)
			if (existing) {
				existing.rows.push({
					id: record.id,
					surface: record.surface,
					promptRunAt: record.prompt_run_at,
					response: record.response,
					isAnalysed: record.is_analysed,
					sources: record.sources.map((s) => ({
						title: s.title,
						url: s.url,
						is_owned_domain: s.is_owned_domain,
						is_fictional: s.is_fictional,
					})),
					metrics:
						record.is_analysed && record.brand_analysis
							? {
									visibilityScore: record.brand_analysis.visibility_score,
									sentiment: record.brand_analysis.sentiment,
									position: record.brand_analysis.position,
								}
							: undefined,
				})
			} else {
				groupMap.set(record.prompt_id, {
					promptId: record.prompt_id,
					promptText: record.prompt,
					category: promptMeta?.category ?? "",
					intent: promptMeta?.intent ?? "",
					rows: [
						{
							id: record.id,
							surface: record.surface,
							promptRunAt: record.prompt_run_at,
							response: record.response,
							isAnalysed: record.is_analysed,
							sources: record.sources.map((s) => ({
								title: s.title,
								url: s.url,
								is_owned_domain: s.is_owned_domain,
								is_fictional: s.is_fictional,
							})),
							metrics:
								record.is_analysed && record.brand_analysis
									? {
											visibilityScore: record.brand_analysis.visibility_score,
											sentiment: record.brand_analysis.sentiment,
											position: record.brand_analysis.position,
										}
									: undefined,
						},
					],
				})
			}
		}

		return Array.from(groupMap.values())
	}, [records, surfaceFilter, timeFilter])

	const hasData = metrics.analyzedRecords.length > 0
	const hasCompetitorRows = metrics.competitorData.some((c) => !c.isBrand)
	const hasSourceRows = metrics.sourcesIntelligence.length > 0
	const hasBrandPerceptionData =
		Boolean(metrics.brandPerception.bestKnownFor) ||
		metrics.brandPerception.pricingPerception !== "not_mentioned" ||
		metrics.brandPerception.coreClaims.length > 0 ||
		metrics.brandPerception.differentiators.length > 0
	const insightCardCount = Number(hasSourceRows) + Number(hasBrandPerceptionData)

	return (
		<div className="web-app-shell">
			<AppSidebar />
			<main className="web-app-main">
				<header className="web-app-header">
					<SidebarTrigger className="size-8 shrink-0 rounded-none border-transparent bg-transparent p-0 shadow-none hover:bg-transparent dark:hover:bg-transparent" />
					<h1 className="truncate text-[0.95rem] font-medium tracking-[-0.01em] text-gray-950 dark:text-gray-50">
						Tableau de bord
					</h1>
					<div className="ml-auto flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									className="inline-flex items-center gap-1 rounded-[var(--app-radius)] border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[10px] font-medium text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-400"
								>
									<Info className="h-3 w-3" />
									Donnees de demonstration
								</button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								<p className="max-w-[260px]">
									Toutes les donnees affichees sont fictives et simulees. Aucun audit reel n'a ete
									effectue.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</header>

				<div className="web-app-scroll">
					<div className="web-page-wide">
						<div className="web-page-wide-inner">
							<div className="space-y-5 sm:space-y-6">
								<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
									<DashboardFilters
										brandName={BRAND.name}
										brandDomain={BRAND.domain}
										surfaceFilter={surfaceFilter}
										setSurfaceFilter={setSurfaceFilter}
										timeFilter={timeFilter}
										setTimeFilter={setTimeFilter}
									/>
								</div>

								<div className="flex items-center gap-2">
									<span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
										Score de visibilite IA
									</span>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												className="text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
											>
												<Info className="h-3.5 w-3.5" />
											</button>
										</TooltipTrigger>
										<TooltipContent side="right">
											<p className="max-w-[280px]">
												Indicateur interne de demonstration. Ne correspond pas a une norme
												officielle. Calcule a partir de la presence, du sentiment, de la
												recommendation et du rang.
											</p>
										</TooltipContent>
									</Tooltip>
									<span
										className="ml-1 text-2xl font-bold"
										style={{
											color:
												metrics.visibilityScore >= 60
													? "#22c55e"
													: metrics.visibilityScore >= 30
														? "#f59e0b"
														: "#ef4444",
										}}
									>
										{metrics.visibilityScore}
									</span>
									<span className="text-xs text-muted-foreground">/ 100</span>
								</div>

								{!hasData ? (
									<EmptyDashboardState />
								) : (
									<>
										<AggregateStatsRow
											visibilityScore={metrics.visibilityScore}
											presenceRate={metrics.aggregateStats.presenceRate}
											rank={metrics.avgRank.position}
											topSource={metrics.sourcesIntelligence[0]?.domain ?? "N/A"}
											topCompetitor={metrics.aggregateStats.topCompetitor}
											topCompetitorDomain={metrics.aggregateStats.topCompetitorDomain ?? undefined}
										/>

										<div className="space-y-4 sm:space-y-5">
											{hasCompetitorRows ? (
												<CompetitiveLandscape competitors={metrics.competitorData} />
											) : null}

											{insightCardCount > 0 ? (
												<div
													className={`grid grid-cols-1 items-stretch gap-4 ${
														insightCardCount > 1 ? "lg:grid-cols-2" : "lg:grid-cols-1"
													}`}
												>
													{hasSourceRows ? (
														<TopSources
															sources={metrics.sourcesIntelligence}
															totalCitations={metrics.totalCitations}
														/>
													) : null}
													{hasBrandPerceptionData ? (
														<BrandPerceptionCard
															bestKnownFor={metrics.brandPerception.bestKnownFor}
															pricingPerception={metrics.brandPerception.pricingPerception}
															coreClaims={metrics.brandPerception.coreClaims}
															differentiators={metrics.brandPerception.differentiators}
														/>
													) : null}
												</div>
											) : null}

											<BrandComparisonChart
												competitors={metrics.competitorData}
												brandName={metrics.brandName}
												totalResponses={metrics.impactMetrics.totalResponses}
												brandPresenceRate={metrics.aggregateStats.presenceRate}
												brandRecommendationRate={metrics.impactMetrics.recommendationRate}
												brandSentimentScore={metrics.avgSentiment.score}
												brandAvgRank={metrics.avgRank.position}
											/>
										</div>

										{promptGroups.length > 0 ? <PromptResponsesList groups={promptGroups} /> : null}
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
