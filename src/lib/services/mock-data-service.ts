import { ANALYSIS_RECORDS } from "@/lib/data/analysis-records"
import { BRAND } from "@/lib/data/brand"
import { PROMPTS } from "@/lib/data/prompts"
import { SURFACES } from "@/types/analysis"
import type {
	AnalysisRecord,
	AuditResultDetail,
	Competitor,
	Project,
	ProjectPrompt,
	ProjectSurface,
} from "@/types/analysis"
import type { IDataService } from "./data-service"

const DEFAULT_PROJECT: Project = {
	id: "mock-project-1",
	name: BRAND.name,
	domain: BRAND.domain,
	country: BRAND.country,
	country_custom: null,
	language: BRAND.language,
	language_custom: null,
}

const DEFAULT_COMPETITORS: Competitor[] = [
	{ id: "mock-comp-1", name: "Netflix", domain: "netflix.com" },
	{ id: "mock-comp-2", name: "Amazon Prime Video", domain: "primevideo.com" },
	{ id: "mock-comp-3", name: "Disney+", domain: "disneyplus.com" },
	{ id: "mock-comp-4", name: "Apple TV+", domain: "apple.com/apple-tv-plus" },
]

const DEFAULT_SURFACES: ProjectSurface[] = SURFACES.map((surface, i) => ({
	id: `mock-surface-${i}`,
	surface,
	is_active: true,
}))

const DEFAULT_PROMPTS: ProjectPrompt[] = PROMPTS.map((p, i) => ({
	...p,
	is_active: true,
	sort_order: i,
}))

function genId(): string {
	return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export class MockDataService implements IDataService {
	private projects: Project[] = [{ ...DEFAULT_PROJECT }]
	private activeProjectId: string = DEFAULT_PROJECT.id
	private competitors: Competitor[] = [...DEFAULT_COMPETITORS]
	private prompts: ProjectPrompt[] = DEFAULT_PROMPTS.map((p) => ({ ...p }))
	private surfaces: ProjectSurface[] = DEFAULT_SURFACES.map((s) => ({ ...s }))

	async getProject(): Promise<Project> {
		const found = this.projects.find((p) => p.id === this.activeProjectId)
		return { ...(found ?? this.projects[0]) }
	}

	async getAllProjects(): Promise<Project[]> {
		return this.projects.map((p) => ({ ...p }))
	}

	setActiveProject(projectId: string): void {
		this.activeProjectId = projectId
		window.dispatchEvent(new CustomEvent("playvod:active-project-changed"))
	}

	async createProject(data: {
		name: string
		domain: string
		country: string
		country_custom: string | null
		language: string
		language_custom: string | null
	}): Promise<Project> {
		const project: Project = {
			id: genId(),
			name: data.name.trim(),
			domain: data.domain.trim(),
			country: data.country,
			country_custom: data.country_custom,
			language: data.language,
			language_custom: data.language_custom,
		}
		this.projects.push(project)
		this.activeProjectId = project.id
		return { ...project }
	}

	async updateProject(patch: Partial<Omit<Project, "id">>): Promise<Project> {
		const idx = this.projects.findIndex((p) => p.id === this.activeProjectId)
		if (idx === -1) throw new Error("Aucun projet configure.")
		this.projects[idx] = { ...this.projects[idx], ...patch }
		return { ...this.projects[idx] }
	}

	async getCompetitors(): Promise<Competitor[]> {
		return this.competitors.map((c) => ({ ...c }))
	}

	async addCompetitor(name: string, domain: string | null): Promise<Competitor> {
		const trimmed = name.trim()
		if (this.competitors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
			throw new Error(`Un concurrent nomme "${trimmed}" existe deja.`)
		}
		const competitor: Competitor = { id: genId(), name: trimmed, domain: domain?.trim() || null }
		this.competitors.push(competitor)
		return { ...competitor }
	}

	async updateCompetitor(
		id: string,
		patch: { name?: string; domain?: string | null },
	): Promise<Competitor> {
		const idx = this.competitors.findIndex((c) => c.id === id)
		if (idx === -1) throw new Error("Concurrent introuvable.")
		if (patch.name !== undefined) {
			const trimmed = patch.name.trim()
			if (
				this.competitors.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())
			) {
				throw new Error(`Un concurrent nomme "${trimmed}" existe deja.`)
			}
			this.competitors[idx] = { ...this.competitors[idx], name: trimmed }
		}
		if (patch.domain !== undefined) {
			this.competitors[idx] = {
				...this.competitors[idx],
				domain: patch.domain?.trim() || null,
			}
		}
		return { ...this.competitors[idx] }
	}

	async removeCompetitor(id: string): Promise<void> {
		this.competitors = this.competitors.filter((c) => c.id !== id)
	}

	async getPrompts(): Promise<ProjectPrompt[]> {
		return this.prompts.map((p) => ({ ...p }))
	}

	async addPrompt(data: Omit<ProjectPrompt, "id">): Promise<ProjectPrompt> {
		const prompt: ProjectPrompt = { ...data, id: genId() }
		this.prompts.push(prompt)
		return { ...prompt }
	}

	async updatePrompt(
		id: string,
		patch: Partial<Omit<ProjectPrompt, "id">>,
	): Promise<ProjectPrompt> {
		const idx = this.prompts.findIndex((p) => p.id === id)
		if (idx === -1) throw new Error("Prompt introuvable.")
		this.prompts[idx] = { ...this.prompts[idx], ...patch }
		return { ...this.prompts[idx] }
	}

	async removePrompt(id: string): Promise<void> {
		this.prompts = this.prompts.filter((p) => p.id !== id)
	}

	async togglePrompt(id: string, isActive: boolean): Promise<void> {
		const idx = this.prompts.findIndex((p) => p.id === id)
		if (idx === -1) throw new Error("Prompt introuvable.")
		this.prompts[idx] = { ...this.prompts[idx], is_active: isActive }
	}

	async getSurfaces(): Promise<ProjectSurface[]> {
		return this.surfaces.map((s) => ({ ...s }))
	}

	async toggleSurface(id: string, isActive: boolean): Promise<void> {
		const idx = this.surfaces.findIndex((s) => s.id === id)
		if (idx === -1) throw new Error("Surface introuvable.")
		this.surfaces[idx] = { ...this.surfaces[idx], is_active: isActive }
	}

	async getAnalysisRecords(): Promise<AnalysisRecord[]> {
		return ANALYSIS_RECORDS
	}

	async getAuditResult(_resultId: string): Promise<AuditResultDetail | null> {
		return null
	}

	async runAudit(
		_projectId: string,
		_promptId: string,
		_providerId: string,
	): Promise<{ auditRunId: string; auditResultId: string }> {
		throw new Error("Audit reel non disponible en mode demonstration.")
	}

	async getProviderKeyStatuses(): Promise<Record<string, { configured: boolean; updatedAt: string | null }>> {
		return {}
	}

	async saveProviderApiKey(_providerId: string, _apiKey: string): Promise<void> {
		throw new Error("Gestion des cles API non disponible en mode demonstration.")
	}

	async deleteProviderApiKey(_providerId: string): Promise<void> {
		throw new Error("Gestion des cles API non disponible en mode demonstration.")
	}
}
