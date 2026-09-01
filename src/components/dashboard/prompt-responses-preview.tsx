import { PositionMetricCell, SentimentMetricCell } from "@/components/ui/cell"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { cn } from "@/lib/utils/cn"
import { getSurfaceFavicon } from "@/lib/utils/favicon"
import { formatDateFr, formatPercent } from "@/lib/utils/format"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { SourcesHoverLinks } from "./sources-hover-links"

export type PromptResponsePreviewRow = {
	id: string
	surface: string
	promptRunAt: string
	response: string
	isAnalysed: boolean
	metrics?: {
		visibilityScore: number
		sentiment: number
		position: number | null
	}
	sources: { title: string; url: string; is_owned_domain: boolean; is_fictional: boolean }[]
}

export function PromptResponsesPreview({
	rows,
}: {
	rows: PromptResponsePreviewRow[]
}): React.JSX.Element {
	const [expandedResponses, setExpandedResponses] = useState<Set<number>>(new Set())

	const toggleResponse = (index: number) => {
		setExpandedResponses((prev) => {
			const next = new Set(prev)
			if (next.has(index)) next.delete(index)
			else next.add(index)
			return next
		})
	}

	return (
		<div className="space-y-4.5">
			{rows.map((row, index) => {
				const isExpanded = expandedResponses.has(index)
				return (
					<div
						key={row.id}
						onClick={() => toggleResponse(index)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault()
								toggleResponse(index)
							}
						}}
						className={cn(
							"group cursor-pointer rounded-[var(--app-radius)] border border-gray-100/80 bg-white px-5 py-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.16)] transition-[box-shadow,border-color] duration-200 ease-out hover:shadow-[0_20px_60px_-28px_rgba(15,23,42,0.18)] dark:border-gray-800 dark:bg-neutral-950 dark:shadow-[0_20px_60px_-32px_rgba(0,0,0,0.5)] sm:px-6 sm:py-6",
							isExpanded && "border-gray-200 dark:border-gray-700",
						)}
					>
						<div className="mb-4 flex items-start justify-between gap-4">
							<div className="flex items-center gap-3">
								<img
									src={getSurfaceFavicon(row.surface)}
									alt={row.surface}
									className="h-9 w-9 rounded-[var(--app-radius)]"
								/>
								<div className="flex flex-col">
									<span className="text-sm font-medium text-gray-950 dark:text-gray-50">
										{row.surface}
									</span>
									<span className="text-[11px] text-gray-500 dark:text-gray-400">
										{formatDateFr(row.promptRunAt)}
									</span>
								</div>
							</div>
							<ChevronDown
								className={cn(
									"h-5 w-5 text-gray-400 transition-transform duration-200",
									isExpanded ? "rotate-180" : "rotate-0",
									"group-hover:text-gray-600 dark:group-hover:text-gray-300",
								)}
							/>
						</div>

						{row.isAnalysed && row.metrics ? (
							<div className="mb-4 rounded-[var(--app-radius)] border border-gray-100/80 bg-white px-4 py-3 dark:border-gray-800 dark:bg-neutral-950">
								<div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
											Score de visibilite IA
										</span>
										<span
											className="text-xs font-semibold"
											style={{
												color:
													row.metrics.visibilityScore >= 60
														? "#22c55e"
														: row.metrics.visibilityScore >= 30
															? "#f59e0b"
															: "#ef4444",
											}}
										>
											{row.metrics.visibilityScore}
										</span>
									</div>
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
											Sentiment
										</span>
										<div className="text-xs">
											<SentimentMetricCell sentiment={row.metrics.sentiment} />
										</div>
									</div>
									<div className="flex items-center gap-1.5">
										<span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
											Position
										</span>
										<div className="text-xs">
											{row.metrics.position !== null ? (
												<PositionMetricCell position={row.metrics.position} />
											) : (
												<span className="italic text-gray-400">N/A</span>
											)}
										</div>
									</div>
								</div>
							</div>
						) : null}

						<div
							className={
								isExpanded ? "max-h-[400px] overflow-y-auto" : "line-clamp-3 overflow-hidden"
							}
						>
							<MarkdownRenderer content={row.response} />
						</div>

						<button
							onClick={(e) => {
								e.stopPropagation()
								toggleResponse(index)
							}}
							className="mt-4 inline-flex items-center rounded-[var(--app-radius)] px-0 py-0 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
							type="button"
						>
							{isExpanded ? "Voir moins" : "Voir la reponse complete"}
						</button>

						<SourcesHoverLinks items={row.sources} />
					</div>
				)
			})}
		</div>
	)
}
