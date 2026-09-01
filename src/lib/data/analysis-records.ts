import { getSurfaceModel } from "@/lib/utils/favicon"
import type {
	AnalysisRecord,
	AuditRun,
	BrandAnalysisResult,
	SourceRef,
	Surface,
} from "@/types/analysis"
import { SURFACES } from "@/types/analysis"
import { BRAND } from "./brand"
import { PROMPTS } from "./prompts"

export const AUDIT_RUNS: AuditRun[] = [
	{ id: "run-j29", run_at: getRunAt(29), prompt_count: 6, surface_count: 5 },
	{ id: "run-j13", run_at: getRunAt(13), prompt_count: 6, surface_count: 5 },
	{ id: "run-j6", run_at: getRunAt(6), prompt_count: 6, surface_count: 5 },
	{ id: "run-today", run_at: getRunAt(0), prompt_count: 6, surface_count: 5 },
]

function getRunAt(daysAgo: number): string {
	const d = new Date()
	d.setDate(d.getDate() - daysAgo)
	d.setHours(10, 0, 0, 0)
	return d.toISOString()
}

interface AuditProgression {
	presenceRate: number
	avgPosition: number
	sentiment: number
	recommendationScore: number
	visibilityScore: number
}

const PROGRESSION: Record<string, AuditProgression> = {
	"run-j29": {
		presenceRate: 0.3,
		avgPosition: 5.2,
		sentiment: 52,
		recommendationScore: 28,
		visibilityScore: 22,
	},
	"run-j13": {
		presenceRate: 0.4,
		avgPosition: 4.5,
		sentiment: 58,
		recommendationScore: 35,
		visibilityScore: 31,
	},
	"run-j6": {
		presenceRate: 0.5,
		avgPosition: 3.8,
		sentiment: 63,
		recommendationScore: 42,
		visibilityScore: 38,
	},
	"run-today": {
		presenceRate: 0.57,
		avgPosition: 3.2,
		sentiment: 68,
		recommendationScore: 50,
		visibilityScore: 45,
	},
}

function buildSources(runId: string, surface: Surface, promptId: string): SourceRef[] {
	const { provider } = getSurfaceModel(surface)
	const isLatest = runId === "run-today"
	const isOld = runId === "run-j29"

	const sources: SourceRef[] = []

	sources.push({
		title: "Source demo - comparateur VOD",
		url: "demo-vod-comparator.fr",
		cited_text: "",
		is_owned_domain: false,
		is_fictional: true,
	})

	if (isLatest) {
		sources.push({
			title: "Source demo - guide streaming FR",
			url: "demo-streaming-guide.fr",
			cited_text: "",
			is_owned_domain: false,
			is_fictional: true,
		})
	}

	if (runId === "run-j6" || isLatest) {
		sources.push({
			title: "Source demo - blog cinema",
			url: "demo-cinema-blog.fr",
			cited_text: "",
			is_owned_domain: false,
			is_fictional: true,
		})
	}

	if (promptId === "prompt-5" || promptId === "prompt-6") {
		sources.push({
			title: "Site officiel PlayVOD (demo)",
			url: "playvod.com",
			cited_text: "",
			is_owned_domain: true,
			is_fictional: false,
		})
	}

	if (!isOld) {
		sources.push({
			title: "Source demo - forum streaming",
			url: "demo-forum-streaming.fr",
			cited_text: "",
			is_owned_domain: false,
			is_fictional: true,
		})
	}

	return sources
}

function buildResponse(
	surface: Surface,
	promptText: string,
	mentioned: boolean,
	position: number | null,
	sentiment: number,
): string {
	if (!mentioned) {
		return buildResponseWithoutMention(surface, promptText)
	}

	const positionStr = position ? `a la position ${position}` : ""
	const sentimentWord =
		sentiment >= 65 ? "positivement" : sentiment >= 45 ? "neutrement" : "mitigee"

	return `## ${surface}

${promptText}

### Reponse (demo)

D'apmes les informations disponibles, PlayVOD est une plateforme francaise de VOD qui figure ${positionStr} parmi les options citees. La plateforme est mentionnee ${sentimentWord} dans le contexte du marche francais.

**Points cites:**
- Catalogue de films et series en VOD legale
- Tarifs competitifs pour le marche francais
- Sans engagement, resiliation facile

*Note: ceci est une reponse fictive de demonstration et ne reflete pas une vraie reponse de ${surface}.*

### Concurrents cites
Netflix, Amazon Prime Video, Disney+, Apple TV+`
}

function buildResponseWithoutMention(surface: Surface, promptText: string): string {
	return `## ${surface}

${promptText}

### Reponse (demo)

Les principales plateformes citees pour cette requete sont Netflix, Amazon Prime Video, Disney+ et Apple TV+. PlayVOD n'apparait pas dans cette reponse.

*Note: ceci est une reponse fictive de demonstration et ne reflete pas une vraie reponse de ${surface}.*`
}

function buildCompetitors(runId: string) {
	const prog = PROGRESSION[runId]
	const factor = prog.visibilityScore / 45

	return [
		{
			name: "Netflix",
			domain: "netflix.com",
			mention_count: Math.round(28 * factor + 10),
			sentiment: Math.round(72 - factor * 5),
			visibility: Math.round(82 - factor * 8),
		},
		{
			name: "Amazon Prime Video",
			domain: "primevideo.com",
			mention_count: Math.round(22 * factor + 8),
			sentiment: Math.round(65 - factor * 3),
			visibility: Math.round(68 - factor * 6),
		},
		{
			name: "Disney+",
			domain: "disneyplus.com",
			mention_count: Math.round(18 * factor + 6),
			sentiment: Math.round(70 - factor * 4),
			visibility: Math.round(58 - factor * 5),
		},
		{
			name: "Apple TV+",
			domain: "apple.com/apple-tv-plus",
			mention_count: Math.round(12 * factor + 4),
			sentiment: Math.round(67 - factor * 2),
			visibility: Math.round(45 - factor * 3),
		},
	]
}

function buildBrandAnalysis(
	runId: string,
	surface: Surface,
	promptId: string,
): BrandAnalysisResult {
	const prog = PROGRESSION[runId]
	const isBrandPrompt = promptId === "prompt-5" || promptId === "prompt-6"

	let mentioned: boolean
	if (isBrandPrompt) {
		mentioned = true
	} else {
		const seed = hashStr(`${runId}-${surface}-${promptId}`)
		mentioned = (seed % 100) / 100 < prog.presenceRate
	}

	const position = mentioned
		? Math.max(1, Math.round(prog.avgPosition + (hashStr(`${runId}-${surface}`) % 3) - 1))
		: null

	const sentiment = mentioned
		? clamp(prog.sentiment + (hashStr(`${runId}-${surface}-sent`) % 12) - 6, 0, 100)
		: 0

	const recScore = mentioned
		? clamp(prog.recommendationScore + (hashStr(`${runId}-${surface}-rec`) % 14) - 7, 0, 100)
		: 0

	const visScore = mentioned
		? clamp(prog.visibilityScore + (hashStr(`${runId}-${surface}-vis`) % 14) - 7, 0, 100)
		: 0

	const recType =
		recScore >= 70
			? "top_pick"
			: recScore >= 50
				? "recommended"
				: recScore >= 25
					? "mentioned"
					: "not_mentioned"

	const isLatest = runId === "run-today"

	return {
		brand_mentioned: mentioned,
		position,
		sentiment,
		recommendation: {
			type: mentioned ? recType : "not_mentioned",
			score: recScore,
		},
		visibility_score: visScore,
		perception: {
			bestKnownFor: "plateforme VOD francaise abordable sans engagement",
			pricingPerception: isLatest ? "budget" : runId === "run-j6" ? "budget" : "mid_range",
			coreClaims: [
				"catalogue de films et series en VOD legale",
				"tarifs competitifs sans engagement",
				"resiliation facile et sans frais caches",
				"plateforme francaise oriente grand public",
			],
			differentiators: [
				"sans engagement",
				"resiliation facile",
				"tarifs abordables",
				"VOD legale en France",
				"catalogue francais",
			],
		},
		competitors: buildCompetitors(runId),
		risks: isLatest ? [] : runId === "run-j29" ? ["faible visibilite dans les reponses IA"] : [],
	}
}

function hashStr(s: string): number {
	let h = 0
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h + s.charCodeAt(i)) | 0
	}
	return Math.abs(h)
}

function clamp(v: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, v))
}

export function generateAnalysisRecords(): AnalysisRecord[] {
	const records: AnalysisRecord[] = []

	for (const run of AUDIT_RUNS) {
		for (const prompt of PROMPTS) {
			for (const surface of SURFACES) {
				const { provider, model } = getSurfaceModel(surface)
				const ba = buildBrandAnalysis(run.id, surface, prompt.id)
				const response = buildResponse(
					surface,
					prompt.text,
					ba.brand_mentioned,
					ba.position,
					ba.sentiment,
				)
				const sources = buildSources(run.id, surface, prompt.id)

				records.push({
					id: `${run.id}-${prompt.id}-${surface.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`,
					audit_run_id: run.id,
					prompt_id: prompt.id,
					prompt: prompt.text,
					surface,
					provider,
					model,
					country: BRAND.country,
					language: BRAND.language,
					device: "desktop",
					response,
					prompt_run_at: run.run_at,
					is_analysed: true,
					sources,
					brand_analysis: ba,
				})
			}
		}
	}

	return records
}

export const ANALYSIS_RECORDS = generateAnalysisRecords()
