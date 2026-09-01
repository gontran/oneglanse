import { AuditButton } from "@/components/configuration/audit-button"
import { CompetitorsManager } from "@/components/configuration/competitors-manager"
import { PerplexityTestPanel } from "@/components/configuration/perplexity-test-panel"
import { ProjectInfoForm } from "@/components/configuration/project-info-form"
import { PromptsManager } from "@/components/configuration/prompts-manager"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { isDatabaseMode } from "@/lib/auth/auth-context"
import { dataService } from "@/lib/services"
import type { Competitor, Project, ProjectPrompt } from "@/types/analysis"
import { FlaskConical, MessageSquare, Settings, Users } from "lucide-react"
import { useEffect, useState } from "react"

export function ConfigurationPage() {
	const [project, setProject] = useState<Project | null>(null)
	const [competitors, setCompetitors] = useState<Competitor[]>([])
	const [prompts, setPrompts] = useState<ProjectPrompt[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			try {
				const [p, c, pr] = await Promise.all([
					dataService.getProject(),
					dataService.getCompetitors(),
					dataService.getPrompts(),
				])
				if (cancelled) return
				setProject(p)
				setCompetitors(c)
				setPrompts(pr)
				setError(null)
			} catch (err) {
				if (cancelled) return
				setError(err instanceof Error ? err.message : "Erreur de chargement.")
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => {
			cancelled = true
		}
	}, [])

	return (
		<div className="web-app-shell">
			<AppSidebar />
			<main className="web-app-main">
				<header className="web-app-header">
					<SidebarTrigger className="size-8 shrink-0 rounded-none border-transparent bg-transparent p-0 shadow-none hover:bg-transparent dark:hover:bg-transparent" />
					<h1 className="truncate text-[0.95rem] font-medium tracking-[-0.01em] text-gray-950 dark:text-gray-50">
						Configuration
					</h1>
					<div className="ml-auto">
						<AuditButton />
					</div>
				</header>

				<div className="web-app-scroll">
					<div className="web-page-wide">
						<div className="web-page-wide-inner">
							{loading ? (
								<div className="flex items-center justify-center py-20">
									<p className="text-sm text-gray-400">Chargement...</p>
								</div>
							) : error ? (
								<div className="flex items-center justify-center py-20">
									<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
								</div>
							) : project ? (
								<div className="space-y-6">
									<ConfigSection
										icon={Settings}
										title="Informations du projet"
										description="Configurez l'identite de la marque suivie et sa zone geographique."
									>
										<ProjectInfoForm
											project={project}
											onSave={async (patch) => {
												const updated = await dataService.updateProject(patch)
												setProject(updated)
											}}
										/>
									</ConfigSection>

									<ConfigSection
										icon={Users}
										title="Concurrents"
										description="Ajoutez, modifiez ou supprimez les concurrents suivis lors des audits."
									>
										<CompetitorsManager
											competitors={competitors}
											onAdd={async (name, domain) => {
												await dataService.addCompetitor(name, domain)
												setCompetitors(await dataService.getCompetitors())
											}}
											onUpdate={async (id, patch) => {
												await dataService.updateCompetitor(id, patch)
												setCompetitors(await dataService.getCompetitors())
											}}
											onRemove={async (id) => {
												await dataService.removeCompetitor(id)
												setCompetitors(await dataService.getCompetitors())
											}}
										/>
									</ConfigSection>

									<ConfigSection
										icon={MessageSquare}
										title="Prompts d'audit"
										description="Gerez les prompts envoyes aux moteurs IA lors des audits."
									>
										<PromptsManager
											prompts={prompts}
											onAdd={async (data) => {
												await dataService.addPrompt(data)
												setPrompts(await dataService.getPrompts())
											}}
											onUpdate={async (id, patch) => {
												await dataService.updatePrompt(id, patch)
												setPrompts(await dataService.getPrompts())
											}}
											onRemove={async (id) => {
												await dataService.removePrompt(id)
												setPrompts(await dataService.getPrompts())
											}}
											onToggle={async (id, isActive) => {
												await dataService.togglePrompt(id, isActive)
												setPrompts(await dataService.getPrompts())
											}}
										/>
									</ConfigSection>

									{isDatabaseMode && project && (
										<ConfigSection
											icon={FlaskConical}
											title="Test Perplexity"
											description="Envoyez un prompt a l'API Perplexity Sonar pour un audit reel."
										>
											<PerplexityTestPanel projectId={project.id} prompts={prompts} />
										</ConfigSection>
									)}
								</div>
							) : null}
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}

function ConfigSection({
	icon: Icon,
	title,
	description,
	children,
}: {
	icon: typeof Settings
	title: string
	description: string
	children: React.ReactNode
}) {
	return (
		<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:border-transparent dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
			<div className="mb-4 flex items-start gap-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--app-radius)] bg-stone-100 dark:bg-neutral-900">
					<Icon className="size-4.5 text-gray-600 dark:text-gray-400" />
				</div>
				<div>
					<h2 className="text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">{title}</h2>
					<p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{description}</p>
				</div>
			</div>
			{children}
		</section>
	)
}
