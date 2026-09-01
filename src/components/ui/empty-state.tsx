import { cn } from "@/lib/utils/cn"
import type { LucideIcon } from "lucide-react"
import type * as React from "react"

export function EmptyStatePanel({
	icon: _icon,
	eyebrow,
	title,
	description,
	action,
	className,
}: {
	icon?: LucideIcon
	eyebrow?: string
	title: string
	description: string
	action?: React.ReactNode
	className?: string
}) {
	return (
		<div className={cn("web-centered-state", className)}>
			<div className="w-full max-w-[19rem] min-h-[17.5rem] flex flex-col rounded-[var(--app-radius)] border border-gray-100/80 bg-white px-4 py-3.5 text-center shadow-[0_20px_60px_-32px_rgba(15,23,42,0.18)] dark:border-gray-800 dark:bg-neutral-950 dark:shadow-[0_20px_60px_-32px_rgba(0,0,0,0.55)] sm:max-w-[20.5rem] sm:min-h-[18.5rem] sm:px-4.5 sm:py-4.5">
				<div className="flex flex-1 flex-col justify-center pt-1.5 sm:pt-2">
					<div className="pb-1.5 sm:pb-2">
						{eyebrow ? (
							<div className="mt-0 inline-flex items-center self-center rounded-[var(--app-radius)] border border-gray-200/80 bg-stone-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500 dark:border-gray-800 dark:bg-neutral-900 dark:text-gray-400">
								{eyebrow}
							</div>
						) : null}
						<h2
							className={cn(
								"text-[1rem] font-medium leading-[1.15] tracking-[-0.03em] text-gray-950 dark:text-gray-50 sm:text-[1.08rem]",
								eyebrow ? "mt-1.5" : "mt-0",
							)}
						>
							{title}
						</h2>
						<p className="mx-auto mt-1.5 max-w-xl text-[11px] leading-[1.4] text-gray-500 dark:text-gray-400 sm:text-[12px] sm:leading-[1.45]">
							{description}
						</p>
					</div>
				</div>
				{action ? (
					<div className="mt-3 flex min-h-9 items-center justify-center sm:mt-3.5 sm:min-h-10">
						{action}
					</div>
				) : null}
			</div>
		</div>
	)
}
