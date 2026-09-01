import { cn } from "@/lib/utils/cn"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type { PromptResponsePreviewRow } from "./prompt-responses-preview"
import { PromptResponsesPreview } from "./prompt-responses-preview"

export type PromptGroup = {
	promptId: string
	promptText: string
	category: string
	intent: string
	rows: PromptResponsePreviewRow[]
}

export function PromptResponsesList({
	groups,
}: {
	groups: PromptGroup[]
}): React.JSX.Element | null {
	const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set())

	if (groups.length === 0) return null

	const togglePrompt = (promptId: string) => {
		setExpandedPrompts((prev) => {
			const next = new Set(prev)
			if (next.has(promptId)) next.delete(promptId)
			else next.add(promptId)
			return next
		})
	}

	return (
		<section aria-label="Reponses aux prompts" className="space-y-4">
			<div className="py-2 sm:py-3">
				<h1 className="mt-2 text-base font-semibold leading-none tracking-tight text-gray-900 sm:text-lg dark:text-gray-100">
					Reponses des surfaces IA
				</h1>
				<p className="mt-2 text-xs text-muted-foreground">
					Cliquez sur un prompt pour voir les reponses de chaque surface IA (donnees de
					demonstration).
				</p>
			</div>

			<div className="space-y-2">
				{groups.map((group) => {
					const isExpanded = expandedPrompts.has(group.promptId)
					return (
						<div
							key={group.promptId}
							className="overflow-hidden rounded-[var(--app-radius)] border border-gray-100/80 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.16)] dark:border-gray-800 dark:bg-neutral-950 dark:shadow-[0_20px_60px_-32px_rgba(0,0,0,0.5)]"
						>
							<button
								type="button"
								onClick={() => togglePrompt(group.promptId)}
								className={cn(
									"flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors duration-150 sm:px-6",
									isExpanded
										? "bg-gray-50/80 dark:bg-neutral-900/60"
										: "hover:bg-gray-50/60 dark:hover:bg-neutral-900/40",
								)}
							>
								<div className="min-w-0 flex-1">
									<span className="line-clamp-1 min-w-0 block text-sm font-medium text-gray-800 dark:text-gray-200">
										{group.promptText}
									</span>
									<div className="mt-1 flex gap-2">
										<span className="rounded-[var(--app-radius)] bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
											{group.category}
										</span>
										<span className="rounded-[var(--app-radius)] bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
											{group.intent}
										</span>
									</div>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-400">
										{group.rows.length} reponses
									</span>
									<ChevronDown
										className={cn(
											"h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500",
											isExpanded && "rotate-180",
										)}
									/>
								</div>
							</button>

							{isExpanded && (
								<div className="border-t border-gray-100 dark:border-gray-800">
									<div className="divide-y divide-gray-100/80 dark:divide-gray-800">
										{group.rows.map((row) => (
											<div key={row.id} className="px-5 py-4 sm:px-6">
												<PromptResponsesPreview rows={[row]} />
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</section>
	)
}
