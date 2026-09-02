import { Favicon } from "@/components/ui/favicon"
import type { Project } from "@/types/analysis"
import { Check, Globe, Plus } from "lucide-react"
import { useState } from "react"

interface ProjectSwitcherProps {
	projects: Project[]
	activeProjectId: string | null
	onSwitch: (projectId: string) => void
	onCreateNew: () => void
}

export function ProjectSwitcher({
	projects,
	activeProjectId,
	onSwitch,
	onCreateNew,
}: ProjectSwitcherProps) {
	const [creating, setCreating] = useState(false)

	if (creating) {
		onCreateNew()
		setCreating(false)
		return null
	}

	return (
		<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:border-transparent dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
			<div className="mb-4 flex items-start gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--app-radius)] bg-stone-100 dark:bg-neutral-900">
					<Globe className="size-4.5 text-gray-600 dark:text-gray-400" />
				</div>
				<div className="flex-1">
					<h2 className="text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">
						Sites analyses
					</h2>
					<p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
						Selectionnez le site a auditer ou creez-en un nouveau.
					</p>
				</div>
			</div>

			<div className="space-y-1.5">
				{projects.map((project) => {
					const isActive = project.id === activeProjectId
					return (
						<button
							key={project.id}
							type="button"
							onClick={() => onSwitch(project.id)}
							className={`flex w-full items-center gap-3 rounded-[var(--app-radius)] border px-3.5 py-3 text-left transition ${
								isActive
									? "border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/20"
									: "border-gray-100 bg-white hover:border-gray-200 hover:bg-stone-50 dark:border-gray-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
							}`}
						>
							<Favicon domain={project.domain} name={project.name} size="h-6 w-6" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
									{project.name}
								</p>
								<p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
									{project.domain}
								</p>
							</div>
							{isActive && (
								<span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
									<Check className="size-3" />
									Actif
								</span>
							)}
						</button>
					)
				})}

				<button
					type="button"
					onClick={() => onCreateNew()}
					className="flex w-full items-center gap-2.5 rounded-[var(--app-radius)] border border-dashed border-gray-200 px-3.5 py-3 text-left text-[13px] font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-200"
				>
					<Plus className="size-4 shrink-0" />
					Ajouter un nouveau site
				</button>
			</div>
		</section>
	)
}
