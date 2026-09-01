export type Surface = "ChatGPT" | "Gemini" | "Perplexity" | "Claude" | "Google AI Overview"

export const SURFACES: Surface[] = [
	"ChatGPT",
	"Gemini",
	"Perplexity",
	"Claude",
	"Google AI Overview",
]

export const ALL_SURFACES = "Toutes les surfaces" as const

export type Device = "desktop" | "mobile" | null

export interface SourceRef {
	title: string
	url: string
	cited_text?: string
	is_owned_domain: boolean
	is_fictional: boolean
}

export interface CompetitorMention {
	name: string
	domain: string | null
	mention_count: number
	sentiment: number
	visibility: number
}

export interface BrandAnalysisResult {
	brand_mentioned: boolean
	position: number | null
	sentiment: number
	recommendation: {
		type: string
		score: number
	}
	visibility_score: number
	perception: {
		bestKnownFor: string | null
		pricingPerception: string
		coreClaims: string[]
		differentiators: string[]
	}
	competitors: CompetitorMention[]
	risks: string[]
}

export interface AnalysisRecord {
	id: string
	audit_run_id: string
	prompt_id: string
	prompt: string
	surface: Surface
	provider: string
	model: string
	country: string
	language: string
	device: Device
	response: string
	prompt_run_at: string
	is_analysed: boolean
	sources: SourceRef[]
	brand_analysis: BrandAnalysisResult | null
}

export interface UserPrompt {
	id: string
	text: string
	category: string
	intent: string
	persona: string | null
}

export interface AuditRun {
	id: string
	run_at: string
	prompt_count: number
	surface_count: number
}

export interface Project {
	id: string
	name: string
	domain: string
	country: string
	country_custom: string | null
	language: string
	language_custom: string | null
}

export interface Competitor {
	id: string
	name: string
	domain: string | null
}

export interface ProjectSurface {
	id: string
	surface: string
	is_active: boolean
}

export interface ProjectPrompt extends UserPrompt {
	is_active: boolean
	sort_order: number
}

export type { SourceRef as ResultSource }
export type { AnalysisRecord as AuditResult }
