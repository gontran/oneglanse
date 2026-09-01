"use client"

import { EmptyStatePanel } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
	return (
		<div className="web-page-wide">
			<div className="web-page-wide-inner py-4">
				<div className="space-y-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-9 w-44 rounded-[var(--app-radius)]" />
						<Skeleton className="h-9 w-44 rounded-[var(--app-radius)]" />
						<Skeleton className="h-9 w-40 rounded-[var(--app-radius)]" />
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{["a", "b", "c", "d"].map((k) => (
							<div
								key={k}
								className="rounded-[var(--app-radius)] border border-gray-100/80 bg-white p-4 dark:border-gray-800 dark:bg-neutral-950"
							>
								<Skeleton className="h-3 w-20 rounded" />
								<Skeleton className="mt-4 h-8 w-24 rounded" />
								<Skeleton className="mt-3 h-3 w-40 rounded" />
							</div>
						))}
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<Skeleton className="h-[280px] rounded-[var(--app-radius)]" />
						<Skeleton className="h-[280px] rounded-[var(--app-radius)]" />
						<Skeleton className="h-[280px] rounded-[var(--app-radius)]" />
					</div>
					<Skeleton className="h-[200px] rounded-[var(--app-radius)]" />
				</div>
			</div>
		</div>
	)
}

export function EmptyDashboardState() {
	return (
		<EmptyStatePanel
			eyebrow="Aucune donnee"
			title="Aucune donnee pour les filtres selectionnes"
			description="Essayez une autre surface IA ou une autre periode pour afficher les resultats."
		/>
	)
}
