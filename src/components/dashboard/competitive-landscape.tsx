import { SentimentMetricCell } from "@/components/ui/cell"
import { Favicon } from "@/components/ui/favicon"
import { SortableHeader } from "@/components/ui/sortable-header"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useSortState } from "@/components/ui/use-sort-state"
import { cn } from "@/lib/utils/cn"
import type { DashboardCompetitorData } from "@/types/dashboard"

type SortColumn = "name" | "mentionCount" | "visibility" | "sentiment"

export function CompetitiveLandscape({
	competitors,
}: {
	competitors: DashboardCompetitorData[]
}) {
	const { sortColumn, sortDirection, toggleSort } = useSortState<SortColumn>("desc")

	const sorted = [...competitors].sort((a, b) => {
		if (!sortColumn) return b.mentionCount - a.mentionCount
		const dir = sortDirection === "asc" ? 1 : -1
		if (sortColumn === "name") return a.name.localeCompare(b.name) * dir
		return (a[sortColumn] - b[sortColumn]) * dir
	})

	return (
		<div className="space-y-3">
			<div>
				<h1 className="mt-2 text-base font-semibold leading-none tracking-tight text-gray-900 sm:text-lg dark:text-gray-100">
					Paysage concurrentiel
				</h1>
				<p className="mt-2 text-xs text-muted-foreground">
					Comparaison de la visibilite de PlayVOD et de ses concurrents dans les reponses IA.
				</p>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<SortableHeader
								column="name"
								currentSort={sortColumn}
								currentDirection={sortDirection}
								onSort={toggleSort}
							>
								Marque
							</SortableHeader>
						</TableHead>
						<TableHead>
							<SortableHeader
								column="mentionCount"
								currentSort={sortColumn}
								currentDirection={sortDirection}
								onSort={toggleSort}
							>
								Mentions
							</SortableHeader>
						</TableHead>
						<TableHead>
							<SortableHeader
								column="visibility"
								currentSort={sortColumn}
								currentDirection={sortDirection}
								onSort={toggleSort}
							>
								Visibilite
							</SortableHeader>
						</TableHead>
						<TableHead>
							<SortableHeader
								column="sentiment"
								currentSort={sortColumn}
								currentDirection={sortDirection}
								onSort={toggleSort}
							>
								Sentiment
							</SortableHeader>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sorted.map((comp) => (
						<TableRow key={comp.name}>
							<TableCell>
								<div className="flex items-center gap-2">
									{comp.domain && <Favicon domain={comp.domain} name={comp.name} size="h-5 w-5" />}
									<span className="font-medium text-gray-900 dark:text-gray-100">{comp.name}</span>
									{comp.isBrand && (
										<span className="rounded-[var(--app-radius)] bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
											Vous
										</span>
									)}
								</div>
							</TableCell>
							<TableCell className="font-medium">{comp.mentionCount}</TableCell>
							<TableCell>
								<div className="flex items-center gap-2">
									<div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800">
										<div
											className={cn(
												"h-full rounded-full transition-all duration-300",
												comp.isBrand ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-500",
											)}
											style={{ width: `${Math.min(100, comp.visibility)}%` }}
										/>
									</div>
									<span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
										{comp.visibility}
									</span>
								</div>
							</TableCell>
							<TableCell>
								<SentimentMetricCell sentiment={comp.sentiment} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
