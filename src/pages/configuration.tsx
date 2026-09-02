import { AuditButton } from "@/components/configuration/audit-button"
import { CompetitorsManager } from "@/components/configuration/competitors-manager"
import { NewProjectForm } from "@/components/configuration/new-project-form"
import { AuditTestPanel } from "@/components/configuration/audit-test-panel"
import { ProjectInfoForm } from "@/components/configuration/project-info-form"
import { ProjectSwitcher } from "@/components/configuration/project-switcher"
import { ProviderKeyManager } from "@/components/configuration/provider-key-manager"
import { PromptsManager } from "@/components/configuration/prompts-manager"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { isDatabaseMode } from "@/lib/auth/auth-context"
import { dataService } from "@/lib/services"
import type { Competitor, Project, ProjectPrompt } from "@/types/analysis"
import { FlaskConical, KeyRound, MessageSquare, Plus, Settings, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export function ConfigurationPage() {
	const [project, setProject] = useState<Project | null>(null)
	const [allProjects, setAllProjects] = useState<Project[]>([])
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [competitors, setCompetitors] = useState<Competitor[]>([])
	const [prompts, setPrompts] = useState<ProjectPrompt[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const testSectionRef = useRef<HTMLDivElement>(null)

	const scrollToTestPanel = () => {
		testSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
	}

	const loadAll = async () => {
		try {
			const projects = await dataService.getAllProjects()
			setAllProjects(projects)
			const p = await dataService.getProject()
			setProject(p)
			const [c, pr] = await Promise.all([
				dataService.getCompetitors(),
				dataService.getPrompts(),
			])
			setCompetitors(c)
			setPrompts(pr)
			setError(null)
		} catch (err) {
			if (err instanceof Error && err.message === "Aucun projet configure.") {
				setProject(null)
				setError(null)
			} else {
				setError(err instanceof Error ? err.message : "Erreur de chargement.")
			}
		}
	}

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			await loadAll()
			if (!cancelled) setLoading(false)
		}
		load()
		return () => {
			cancelled = true
		}
	}, [])

	const handleSwitch = async (projectId: string) => {
		dataService.setActiveProject(projectId)
		setShowCreateForm(false)
		setLoading(true)
		await loadAll()
		setLoading(false)
	}

	const handleCreateNew = () => {
		setShowCreateForm(true)
	}

	const handleProjectCreated = async () => {
		setShowCreateForm(false)
		setLoading(true)
		await loadAll()
		setLoading(false)
	}

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
						<AuditButton onClick={scrollToTestPanel} projectExists={!!project} />
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
							) : showCreateForm || (allProjects.length === 0 && !project) ? (
								<ConfigSection
									icon={Plus}
									title="Creer un projet"
									description="Configurez votre marque et sa zone geographique pour demarrer les audits."
								>
									<NewProjectForm
										onCreate={async (data) => {
											await dataService.createProject(data)
											await handleProjectCreated()
										}}
									/>
								</ConfigSection>
							) : (
								<div className="space-y-6">
									<ProjectSwitcher
										projects={allProjects}
										activeProjectId={project?.id ?? null}
										onSwitch={handleSwitch}
										onCreateNew={handleCreateNew}
									/>

									{showCreateForm ? (
										<ConfigSection
											icon={Plus}
											title="Creer un nouveau site"
											description="Configurez une nouvelle marque a analyser."
										>
											<NewProjectForm
												onCreate={async (data) => {
													await dataService.createProject(data)
													await handleProjectCreated()
												}}
											/>
										</ConfigSection>
									) : project ? (
										<>
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
														const projects = await dataService.getAllProjects()
														setAllProjects(projects)
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
													icon={KeyRound}
													title="Cles API des fournisseurs"
													description="Renseignez les cles API de chaque fournisseur d'audit que vous souhaitez utiliser."
												>
													<ProviderKeyManager />
												</ConfigSection>
											)}

											{isDatabaseMode && project && (
												<div ref={testSectionRef}>
													<ConfigSection
														icon={FlaskConical}
														title="Lancer un audit"
														description="Choisissez une API de recherche et envoyez un prompt pour un audit reel."
													>
														<AuditTestPanel projectId={project.id} prompts={prompts} />
													</ConfigSection>
												</div>
											)}
										</>
									) : null}
								</div>
							)}
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
