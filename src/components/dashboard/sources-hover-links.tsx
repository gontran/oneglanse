"use client"

import { Favicon } from "@/components/ui/favicon"
import { cn } from "@/lib/utils/cn"
import { getDomain } from "@/lib/utils/favicon"
import { useMemo, useState } from "react"

export type HoverSourceLink = {
	title?: string
	url?: string
	is_owned_domain?: boolean
	is_fictional?: boolean
}

export function SourcesHoverLinks({
	items,
	maxVisible = 5,
}: {
	items: HoverSourceLink[]
	maxVisible?: number
}): React.JSX.Element | null {
	const [showAllLinks, setShowAllLinks] = useState(false)

	const linksToShow = useMemo(() => {
		const normalized: {
			title: string
			url: string
			is_owned_domain: boolean
			is_fictional: boolean
		}[] = []
		for (const item of items) {
			const rawUrl = item.url?.trim()
			if (!rawUrl) continue
			normalized.push({
				title: item.title || rawUrl,
				url: rawUrl,
				is_owned_domain: item.is_owned_domain ?? false,
				is_fictional: item.is_fictional ?? false,
			})
		}
		return normalized
	}, [items])

	const visibleLinks = showAllLinks ? linksToShow : linksToShow.slice(0, maxVisible)
	const remainingCount = linksToShow.length - maxVisible

	if (linksToShow.length === 0) return null

	return (
		<div className="mt-4 flex flex-wrap items-start gap-2.5">
			{visibleLinks.map((item, index) => {
				const domain = getDomain(item.url) ?? item.url
				return (
					<span
						key={`${item.url}-${index}`}
						className="inline-flex min-h-11 w-fit max-w-[18rem] flex-col gap-1.5 rounded-[var(--app-radius)] border border-slate-200/70 bg-slate-50/90 px-3.5 py-3 text-[11px] shadow-[0_16px_40px_-26px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-neutral-900/80"
					>
						<div className="flex items-start gap-2.5">
							<Favicon domain={item.url} name={domain} size="h-3.5 w-3.5" />
							<div className="min-w-0 flex-1 overflow-hidden">
								<div className="mb-1 flex items-center gap-1.5">
									<span className="block min-w-0 truncate text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
										{domain}
									</span>
									{item.is_owned_domain && (
										<span className="inline-flex flex-shrink-0 rounded-[var(--app-radius)] bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
											Vous
										</span>
									)}
									{item.is_fictional && (
										<span className="inline-flex flex-shrink-0 rounded-[var(--app-radius)] bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
											Fictive
										</span>
									)}
								</div>
								<span className="line-clamp-2 break-words text-[11px] leading-snug font-normal text-slate-700 dark:text-slate-300">
									{item.title}
								</span>
							</div>
						</div>
					</span>
				)
			})}

			{!showAllLinks && remainingCount > 0 ? (
				<button
					onClick={() => setShowAllLinks(true)}
					className="inline-flex min-h-11 items-center rounded-[var(--app-radius)] border border-slate-200/70 bg-slate-50/90 px-3.5 py-2 text-[11px] font-medium text-slate-500 dark:border-white/10 dark:bg-neutral-900/80 dark:text-slate-400"
					type="button"
				>
					+{remainingCount} de plus
				</button>
			) : null}
		</div>
	)
}
