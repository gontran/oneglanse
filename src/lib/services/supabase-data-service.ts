import { supabase } from "@/lib/auth/auth-context"
import type {
	AnalysisRecord,
	AuditResultDetail,
	BrandAnalysisResult,
	Competitor,
	CompetitorMention,
	Project,
	ProjectPrompt,
	ProjectSurface,
	SourceRef,
} from "@/types/analysis"
import type { IDataService } from "./data-service"

interface ProjectRow {
	id: string
	name: string
	domain: string
	country: string
	country_custom: string | null
	language: string
	language_custom: string | null
}

interface CompetitorRow {
	id: string
	name: string
	domain: string | null
}

interface SurfaceRow {
	id: string
	surface: string
	is_active: boolean
}

interface PromptRow {
	id: string
	text: string
	category: string
	intent: string
	persona: string | null
	is_active: boolean
	sort_order: number
}

function toProject(row: ProjectRow): Project {
	return {
		id: row.id,
		name: row.name,
		domain: row.domain,
		country: row.country,
		country_custom: row.country_custom,
		language: row.language,
		language_custom: row.language_custom,
	}
}

function toCompetitor(row: CompetitorRow): Competitor {
	return { id: row.id, name: row.name, domain: row.domain }
}

function toSurface(row: SurfaceRow): ProjectSurface {
	return { id: row.id, surface: row.surface, is_active: row.is_active }
}

function toPrompt(row: PromptRow): ProjectPrompt {
	return {
		id: row.id,
		text: row.text,
		category: row.category,
		intent: row.intent,
		persona: row.persona,
		is_active: row.is_active,
		sort_order: row.sort_order,
	}
}

const ACTIVE_PROJECT_KEY = "playvod:active-project-id"

export class SupabaseDataService implements IDataService {
	getActiveProjectId(): string | null {
		return localStorage.getItem(ACTIVE_PROJECT_KEY)
	}

	setActiveProject(projectId: string): void {
		localStorage.setItem(ACTIVE_PROJECT_KEY, projectId)
		window.dispatchEvent(new CustomEvent("playvod:active-project-changed"))
	}

	async getAllProjects(): Promise<Project[]> {
		const { data, error } = await supabase
			.from("projects")
			.select("id, name, domain, country, country_custom, language, language_custom")
			.order("created_at", { ascending: true })
		if (error) throw error
		return (data as ProjectRow[]).map(toProject)
	}

	async getProject(): Promise<Project> {
		const activeId = this.getActiveProjectId()
		if (activeId) {
			const { data, error } = await supabase
				.from("projects")
				.select("id, name, domain, country, country_custom, language, language_custom")
				.eq("id", activeId)
				.maybeSingle()
			if (!error && data) return toProject(data as ProjectRow)
		}
		const { data, error } = await supabase
			.from("projects")
			.select("id, name, domain, country, country_custom, language, language_custom")
			.order("created_at", { ascending: true })
			.limit(1)
			.maybeSingle()
		if (error) throw error
		if (!data) throw new Error("Aucun projet configure.")
		const project = toProject(data as ProjectRow)
		this.setActiveProject(project.id)
		return project
	}

	async createProject(data: {
		name: string
		domain: string
		country: string
		country_custom: string | null
		language: string
		language_custom: string | null
	}): Promise<Project> {
		const { data: result, error } = await supabase.rpc("create_project", {
			p_name: data.name.trim(),
			p_domain: data.domain.trim(),
			p_country: data.country,
			p_country_custom: data.country_custom,
			p_language: data.language,
			p_language_custom: data.language_custom,
		})
		if (error) throw error
		const rows = result as ProjectRow[]
		if (!rows || rows.length === 0) throw new Error("Echec de la creation du projet.")
		const project = toProject(rows[0])
		this.setActiveProject(project.id)
		return project
	}

	async updateProject(patch: Partial<Omit<Project, "id">>): Promise<Project> {
		const current = await this.getProject()
		const { data, error } = await supabase
			.from("projects")
			.update({
				name: patch.name,
				domain: patch.domain,
				country: patch.country,
				country_custom: patch.country_custom,
				language: patch.language,
				language_custom: patch.language_custom,
			})
			.eq("id", current.id)
			.select("id, name, domain, country, country_custom, language, language_custom")
			.maybeSingle()
		if (error) throw error
		if (!data) throw new Error("Echec de la mise a jour du projet.")
		return toProject(data as ProjectRow)
	}

	async getCompetitors(): Promise<Competitor[]> {
		const project = await this.getProject()
		const { data, error } = await supabase
			.from("competitors")
			.select("id, name, domain")
			.eq("project_id", project.id)
			.order("created_at", { ascending: true })
		if (error) throw error
		return (data as CompetitorRow[]).map(toCompetitor)
	}

	async addCompetitor(name: string, domain: string | null): Promise<Competitor> {
		const project = await this.getProject()
		const { data, error } = await supabase
			.from("competitors")
			.insert({ project_id: project.id, name: name.trim(), domain: domain?.trim() || null })
			.select("id, name, domain")
			.maybeSingle()
		if (error) {
			if (error.code === "23505")
				throw new Error(`Un concurrent nomme "${name.trim()}" existe deja.`)
			throw error
		}
		if (!data) throw new Error("Echec de l'ajout du concurrent.")
		return toCompetitor(data as CompetitorRow)
	}

	async updateCompetitor(
		id: string,
		patch: { name?: string; domain?: string | null },
	): Promise<Competitor> {
		const update: Record<string, unknown> = {}
		if (patch.name !== undefined) update.name = patch.name.trim()
		if (patch.domain !== undefined) update.domain = patch.domain?.trim() || null
		const { data, error } = await supabase
			.from("competitors")
			.update(update)
			.eq("id", id)
			.select("id, name, domain")
			.maybeSingle()
		if (error) {
			if (error.code === "23505") throw new Error("Un concurrent avec ce nom existe deja.")
			throw error
		}
		if (!data) throw new Error("Concurrent introuvable.")
		return toCompetitor(data as CompetitorRow)
	}

	async removeCompetitor(id: string): Promise<void> {
		const { error } = await supabase.from("competitors").delete().eq("id", id)
		if (error) throw error
	}

	async getPrompts(): Promise<ProjectPrompt[]> {
		const project = await this.getProject()
		const { data, error } = await supabase
			.from("project_prompts")
			.select("id, text, category, intent, persona, is_active, sort_order")
			.eq("project_id", project.id)
			.order("sort_order", { ascending: true })
		if (error) throw error
		return (data as PromptRow[]).map(toPrompt)
	}

	async addPrompt(data: Omit<ProjectPrompt, "id">): Promise<ProjectPrompt> {
		const project = await this.getProject()
		const { data: row, error } = await supabase
			.from("project_prompts")
			.insert({
				project_id: project.id,
				text: data.text,
				category: data.category,
				intent: data.intent,
				persona: data.persona,
				is_active: data.is_active,
				sort_order: data.sort_order,
			})
			.select("id, text, category, intent, persona, is_active, sort_order")
			.maybeSingle()
		if (error) throw error
		if (!row) throw new Error("Echec de l'ajout du prompt.")
		return toPrompt(row as PromptRow)
	}

	async updatePrompt(
		id: string,
		patch: Partial<Omit<ProjectPrompt, "id">>,
	): Promise<ProjectPrompt> {
		const update: Record<string, unknown> = {}
		if (patch.text !== undefined) update.text = patch.text
		if (patch.category !== undefined) update.category = patch.category
		if (patch.intent !== undefined) update.intent = patch.intent
		if (patch.persona !== undefined) update.persona = patch.persona
		if (patch.is_active !== undefined) update.is_active = patch.is_active
		if (patch.sort_order !== undefined) update.sort_order = patch.sort_order
		const { data, error } = await supabase
			.from("project_prompts")
			.update(update)
			.eq("id", id)
			.select("id, text, category, intent, persona, is_active, sort_order")
			.maybeSingle()
		if (error) throw error
		if (!data) throw new Error("Prompt introuvable.")
		return toPrompt(data as PromptRow)
	}

	async removePrompt(id: string): Promise<void> {
		const { error } = await supabase.from("project_prompts").delete().eq("id", id)
		if (error) throw error
	}

	async togglePrompt(id: string, isActive: boolean): Promise<void> {
		const { error } = await supabase
			.from("project_prompts")
			.update({ is_active: isActive })
			.eq("id", id)
		if (error) throw error
	}

	async getSurfaces(): Promise<ProjectSurface[]> {
		const project = await this.getProject()
		const { data, error } = await supabase
			.from("project_surfaces")
			.select("id, surface, is_active")
			.eq("project_id", project.id)
			.order("surface", { ascending: true })
		if (error) throw error
		return (data as SurfaceRow[]).map(toSurface)
	}

	async toggleSurface(id: string, isActive: boolean): Promise<void> {
		const { error } = await supabase
			.from("project_surfaces")
			.update({ is_active: isActive })
			.eq("id", id)
		if (error) throw error
	}

	async getAnalysisRecords(): Promise<AnalysisRecord[]> {
		try {
			const project = await this.getProject()
			const { data, error } = await supabase
				.from("audit_results")
				.select(`
					id, audit_run_id, prompt_id, prompt, surface, provider, model,
					country, language, device, response, prompt_run_at, is_analysed,
					collection_method, error_message, brand_mentioned, brand_position,
					result_sources (id, title, url, domain, snippet, position, is_owned_domain, cited_text),
					brand_analyses (
						id, brand_mentioned, position, sentiment, recommendation_type,
						recommendation_score, visibility_score, best_known_for,
						pricing_perception, core_claims, differentiators, risks,
						competitor_mentions (name, domain, mention_count, sentiment, visibility)
					)
				`)
				.eq("project_id", project.id)
				.order("prompt_run_at", { ascending: false })
				.limit(100)

			if (error) throw error
			if (!data || data.length === 0) return []

			return (data as unknown[]).map((row) => {
				const r = row as Record<string, unknown>
				const sources = (r.result_sources as Record<string, unknown>[]) || []
				const baRows = (r.brand_analyses as Record<string, unknown>[]) || []
				const baRow = baRows[0] || null

				let brandAnalysis: BrandAnalysisResult | null = null
				if (baRow) {
					const competitors = (baRow.competitor_mentions as Record<string, unknown>[]) || []
					brandAnalysis = {
						brand_mentioned: baRow.brand_mentioned as boolean,
						position: baRow.position as number | null,
						sentiment: baRow.sentiment as number,
						recommendation: {
							type: baRow.recommendation_type as string,
							score: baRow.recommendation_score as number,
						},
						visibility_score: baRow.visibility_score as number,
						perception: {
							bestKnownFor: (baRow.best_known_for as string) || null,
							pricingPerception: baRow.pricing_perception as string,
							coreClaims: (baRow.core_claims as string[]) || [],
							differentiators: (baRow.differentiators as string[]) || [],
						},
						competitors: competitors.map((c): CompetitorMention => ({
							name: c.name as string,
							domain: (c.domain as string) || null,
							mention_count: c.mention_count as number,
							sentiment: c.sentiment as number,
							visibility: c.visibility as number,
						})),
						risks: (baRow.risks as string[]) || [],
					}
				}

				return {
					id: r.id as string,
					audit_run_id: r.audit_run_id as string,
					prompt_id: r.prompt_id as string,
					prompt: r.prompt as string,
					surface: r.surface as AnalysisRecord["surface"],
					provider: r.provider as string,
					model: r.model as string,
					country: r.country as string,
					language: r.language as string,
					device: r.device as AnalysisRecord["device"],
					response: r.response as string,
					prompt_run_at: r.prompt_run_at as string,
					is_analysed: r.is_analysed as boolean,
					collection_method: r.collection_method as string | undefined,
					brand_mentioned: r.brand_mentioned as boolean | null | undefined,
					brand_position: r.brand_position as number | null | undefined,
					sources: sources.map(
						(s): SourceRef => ({
							title: s.title as string,
							url: s.url as string,
							cited_text: (s.cited_text as string) || undefined,
							is_owned_domain: s.is_owned_domain as boolean,
							is_fictional: false,
							domain: (s.domain as string) || null,
							snippet: (s.snippet as string) || null,
							position: s.position as number | null,
						}),
					),
					brand_analysis: brandAnalysis,
				}
			})
		} catch {
			return []
		}
	}

	async getAuditResult(resultId: string): Promise<AuditResultDetail | null> {
		const { data: result, error } = await supabase
			.from("audit_results")
			.select(`
				id, audit_run_id, prompt_id, prompt, surface, provider, model,
				collection_method, response, prompt_run_at, is_analysed,
				brand_mentioned, brand_position, error_message, usage_data, cost_data,
				audit_runs!inner (id, status),
				projects!inner (name)
			`)
			.eq("id", resultId)
			.maybeSingle()

		if (error || !result) return null

		const r = result as Record<string, unknown>
		const runInfo = (r.audit_runs as Record<string, unknown>[]) || []
		const runRow = runInfo[0] || {}
		const projectInfo = (r.projects as Record<string, unknown>[]) || []
		const projectRow = projectInfo[0] || {}
		const brandName = (projectRow.name as string) ?? null

		const { data: sourcesData } = await supabase
			.from("result_sources")
			.select("title, url, domain, snippet, position, is_owned_domain, cited_text")
			.eq("audit_result_id", resultId)
			.order("position", { ascending: true })

		const sources: SourceRef[] = ((sourcesData as Record<string, unknown>[]) || []).map((s) => ({
			title: s.title as string,
			url: s.url as string,
			cited_text: (s.cited_text as string) || undefined,
			is_owned_domain: s.is_owned_domain as boolean,
			is_fictional: false,
			domain: (s.domain as string) || null,
			snippet: (s.snippet as string) || null,
			position: s.position as number | null,
		}))

		return {
			id: r.id as string,
			audit_run_id: r.audit_run_id as string,
			prompt_id: r.prompt_id as string,
			prompt: r.prompt as string,
			surface: r.surface as string,
			provider: r.provider as string,
			model: r.model as string,
			collection_method: r.collection_method as string,
			response: r.response as string,
			prompt_run_at: r.prompt_run_at as string,
			is_analysed: r.is_analysed as boolean,
			brand_mentioned: (r.brand_mentioned as boolean | null) ?? null,
			brand_position: (r.brand_position as number | null) ?? null,
			brand_name: brandName,
			error_message: (r.error_message as string | null) ?? null,
			usage_data: (r.usage_data as Record<string, unknown> | null) ?? null,
			cost_data: (r.cost_data as Record<string, unknown> | null) ?? null,
			run_status: (runRow.status as AuditResultDetail["run_status"]) ?? "completed",
			sources,
		}
	}

	async runAudit(
		projectId: string,
		promptId: string,
		providerId: string,
	): Promise<{ auditRunId: string; auditResultId: string }> {
		const { data: sessionData } = await supabase.auth.getSession()
		const token = sessionData.session?.access_token
		if (!token) throw new Error("Non authentifie.")

		const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-audit`
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
			},
			body: JSON.stringify({ project_id: projectId, prompt_id: promptId, provider: providerId }),
		})

		if (!response.ok) {
			const body = await response.json().catch(() => ({}))
			throw new Error(body.error || `Erreur ${response.status}`)
		}

		const body = await response.json()
		if (!body.audit_run_id || !body.audit_result_id) {
			throw new Error("Reponse invalide du serveur.")
		}

		return {
			auditRunId: body.audit_run_id as string,
			auditResultId: body.audit_result_id as string,
		}
	}
}
