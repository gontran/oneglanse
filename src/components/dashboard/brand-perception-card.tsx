"use client"

import { Card } from "@/components/ui/card"
import { BadgeDollarSign, Lightbulb, Tags } from "lucide-react"

const pricingLabels: Record<string, string> = {
	premium: "Premium",
	mid_range: "Milieu de gamme",
	budget: "Economique",
	free: "Gratuit",
	not_mentioned: "Non mentionne",
}

export function BrandPerceptionCard({
	bestKnownFor,
	pricingPerception,
	coreClaims,
	differentiators,
}: {
	bestKnownFor: string | null
	pricingPerception: string
	coreClaims: string[]
	differentiators: string[]
}) {
	return (
		<Card className="flex h-full min-w-0 flex-col p-5 lg:p-6">
			<div>
				<h1 className="mt-2 text-base font-semibold leading-none tracking-tight text-gray-900 sm:text-lg dark:text-gray-100">
					Perception de marque
				</h1>
				<p className="mt-2 text-xs text-muted-foreground">
					Ce que les IA disent le plus souvent de PlayVOD.
				</p>
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-3.5">
				{pricingPerception !== "not_mentioned" && (
					<div className="ui-list-item rounded-[var(--app-radius)] border border-amber-200/70 bg-amber-50/70 px-3.5 py-3 dark:border-amber-900/60 dark:bg-amber-950/25">
						<p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
							<BadgeDollarSign className="h-3.5 w-3.5" />
							Signal de prix
						</p>
						<p className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
							{pricingLabels[pricingPerception] ?? pricingPerception}
						</p>
					</div>
				)}

				{bestKnownFor && (
					<div className="ui-list-item rounded-[var(--app-radius)] border border-emerald-200/70 bg-emerald-50/60 px-3.5 py-3 dark:border-emerald-900/60 dark:bg-emerald-950/25">
						<p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">
							<Lightbulb className="h-3.5 w-3.5" />
							Point fort reconnu
						</p>
						<p className="mt-2 text-sm font-semibold leading-relaxed text-gray-900 dark:text-gray-100">
							{bestKnownFor.charAt(0).toUpperCase() + bestKnownFor.slice(1)}
						</p>
					</div>
				)}

				{coreClaims.length > 0 && (
					<div className="min-w-0">
						<p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							<Tags className="h-3.5 w-3.5" />
							Affirmations cles
						</p>
						<ul className="space-y-2">
							{coreClaims.slice(0, 4).map((claim) => (
								<li
									key={claim}
									className="ui-list-item flex min-w-0 items-start gap-2 rounded-[var(--app-radius)] border border-gray-100/80 bg-white px-3 py-2 text-xs leading-relaxed dark:border-gray-800 dark:bg-neutral-950"
								>
									<span className="mt-[0.38rem] h-1.5 w-1.5 shrink-0 rounded-[var(--app-radius)] bg-emerald-500 dark:bg-emerald-400" />
									<span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
										{claim.charAt(0).toUpperCase() + claim.slice(1)}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

				{differentiators.length > 0 && (
					<div className="min-w-0">
						<p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							Differenciateurs
						</p>
						<div className="flex flex-wrap gap-2">
							{differentiators.slice(0, 5).map((diff) => (
								<span
									key={diff}
									className="ui-list-item min-w-0 max-w-full rounded-[var(--app-radius)] border border-transparent bg-stone-50 px-3 py-1 text-[11px] font-semibold text-gray-500 dark:bg-neutral-900/80 dark:text-gray-400"
								>
									{diff.charAt(0).toUpperCase() + diff.slice(1)}
								</span>
							))}
						</div>
					</div>
				)}
			</div>
		</Card>
	)
}
