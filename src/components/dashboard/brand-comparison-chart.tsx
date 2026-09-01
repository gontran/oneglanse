"use client"

import type { DashboardCompetitorData } from "@/types/dashboard"

interface RadarAxis {
	key: string
	label: string
	max: number
	invert?: boolean
}

const AXES: RadarAxis[] = [
	{ key: "presenceRate", label: "Presence", max: 100 },
	{ key: "recommendationRate", label: "Recommendation", max: 100 },
	{ key: "sentiment", label: "Sentiment", max: 100 },
	{ key: "rankStrength", label: "Force du rang", max: 100, invert: true },
]

function normalizeValue(value: number, axis: RadarAxis): number {
	const ratio = Math.min(1, Math.max(0, value / axis.max))
	return axis.invert ? 1 - ratio : ratio
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
	return {
		x: cx + radius * Math.cos(angle - Math.PI / 2),
		y: cy + radius * Math.sin(angle - Math.PI / 2),
	}
}

function buildPolygon(
	values: number[],
	cx: number,
	cy: number,
	maxRadius: number,
	numAxes: number,
): string {
	return values
		.map((v, i) => {
			const angle = (i / numAxes) * Math.PI * 2
			const point = polarToCartesian(cx, cy, maxRadius * v, angle)
			return `${point.x},${point.y}`
		})
		.join(" ")
}

export function BrandComparisonChart({
	competitors,
	brandName,
	totalResponses,
	brandPresenceRate,
	brandRecommendationRate,
	brandSentimentScore,
	brandAvgRank,
}: {
	competitors: DashboardCompetitorData[]
	brandName: string
	totalResponses: number
	brandPresenceRate: number
	brandRecommendationRate: number
	brandSentimentScore: number
	brandAvgRank: number | null
}) {
	const size = 320
	const cx = size / 2
	const cy = size / 2
	const maxRadius = 110
	const gridLevels = [0.25, 0.5, 0.75, 1.0]
	const numAxes = AXES.length

	const brandValues = [
		normalizeValue(brandPresenceRate, AXES[0]),
		normalizeValue(brandRecommendationRate, AXES[1]),
		normalizeValue(brandSentimentScore, AXES[2]),
		normalizeValue(brandAvgRank ? (6 - brandAvgRank) * 20 : 0, AXES[3]),
	]

	const topCompetitors = competitors.filter((c) => !c.isBrand).slice(0, 2)

	return (
		<div className="rounded-[var(--app-radius)] border border-gray-100/80 bg-white p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.18)] dark:border-gray-800 dark:bg-neutral-950 dark:shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)] lg:p-6">
			<div>
				<h1 className="mt-2 text-base font-semibold leading-none tracking-tight text-gray-900 sm:text-lg dark:text-gray-100">
					Comparaison multi-metriques
				</h1>
				<p className="mt-2 text-xs text-muted-foreground">
					{brandName} face aux principaux concurrents sur {totalResponses} reponses IA.
				</p>
			</div>

			<div className="mt-4 flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-6">
				<div className="relative">
					<svg
						width={size}
						height={size}
						viewBox={`0 0 ${size} ${size}`}
						className="overflow-visible"
						role="img"
						aria-label="Graphique radar comparant PlayVOD aux concurrents"
					>
						{/* Grid circles */}
						{gridLevels.map((level) => {
							const points = buildPolygon(Array(numAxes).fill(level), cx, cy, maxRadius, numAxes)
							return (
								<polygon
									key={level}
									points={points}
									fill="none"
									stroke="currentColor"
									strokeWidth="1"
									className="text-gray-200 dark:text-gray-700"
								/>
							)
						})}

						{/* Axis lines */}
						{AXES.map((axis, i) => {
							const angle = (i / numAxes) * Math.PI * 2
							const point = polarToCartesian(cx, cy, maxRadius, angle)
							return (
								<line
									key={`axis-line-${axis.key}`}
									x1={cx}
									y1={cy}
									x2={point.x}
									y2={point.y}
									stroke="currentColor"
									strokeWidth="1"
									className="text-gray-200 dark:text-gray-700"
								/>
							)
						})}

						{/* Competitor polygons */}
						{topCompetitors.map((comp, idx) => {
							const compValues = [
								normalizeValue(Math.min(100, comp.mentionCount * 3), AXES[0]),
								normalizeValue(comp.visibility, AXES[1]),
								normalizeValue(comp.sentiment, AXES[2]),
								normalizeValue(comp.visibility * 0.8, AXES[3]),
							]
							const colors = ["#94a3b8", "#cbd5e1"]
							return (
								<polygon
									key={comp.name}
									points={buildPolygon(compValues, cx, cy, maxRadius, numAxes)}
									fill={colors[idx]}
									fillOpacity="0.1"
									stroke={colors[idx]}
									strokeWidth="1.5"
								/>
							)
						})}

						{/* Brand polygon */}
						<polygon
							points={buildPolygon(brandValues, cx, cy, maxRadius, numAxes)}
							fill="#3b82f6"
							fillOpacity="0.15"
							stroke="#3b82f6"
							strokeWidth="2"
						/>

						{/* Axis labels */}
						{AXES.map((axis, i) => {
							const angle = (i / numAxes) * Math.PI * 2
							const point = polarToCartesian(cx, cy, maxRadius + 20, angle)
							return (
								<text
									key={axis.key}
									x={point.x}
									y={point.y}
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-gray-500 dark:fill-gray-400 text-[10px] font-medium"
								>
									{axis.label}
								</text>
							)
						})}
					</svg>
				</div>

				<div className="flex flex-col gap-2 text-xs">
					<div className="flex items-center gap-2">
						<span className="h-3 w-3 rounded-[var(--app-radius)] border-2 border-blue-500 bg-blue-500/20" />
						<span className="font-medium text-gray-900 dark:text-gray-100">{brandName}</span>
					</div>
					{topCompetitors.map((comp, idx) => {
						const colors = ["#94a3b8", "#cbd5e1"]
						return (
							<div key={comp.name} className="flex items-center gap-2">
								<span
									className="h-3 w-3 rounded-[var(--app-radius)] border"
									style={{ borderColor: colors[idx], backgroundColor: `${colors[idx]}20` }}
								/>
								<span className="text-gray-600 dark:text-gray-400">{comp.name}</span>
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}
