import { ANALYSIS_RECORDS } from "@/lib/data/analysis-records"
import type {
	AnalysisRecord,
	Competitor,
	Project,
	ProjectPrompt,
	ProjectSurface,
} from "@/types/analysis"
import { createClient } from "@supabase/supabase-js"
import type { IDataService } from "./data-service"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export class SupabaseDataService implements IDataService {
	async getProject(): Promise<Project> {
		const { data, error } = await supabase
			.from("projects")
			.select("id, name, domain, country, country_custom, language, language_custom")
			.limit(1)
			.maybeSingle()
		if (error) throw error
		if (!data) throw new Error("Aucun projet configure.")
		return toProject(data as ProjectRow)
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
			const { data, error } = await supabase
				.from("audit_results")
				.select(
					"id, audit_run_id, prompt_id, prompt, surface, provider, model, country, language, device, response, prompt_run_at, is_analysed",
				)
				.limit(1)
			if (error) throw error
			if (!data || data.length === 0) {
				return ANALYSIS_RECORDS
			}
			// Full fetch would require joining sources and brand_analyses;
			// for now, fall back to mock data until the audit pipeline is built
			return ANALYSIS_RECORDS
		} catch {
			return ANALYSIS_RECORDS
		}
	}
}
