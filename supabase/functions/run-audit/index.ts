import { createClient } from "npm:@supabase/supabase-js@2.112.4"

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface ProviderConfig {
	id: string
	label: string
	model: string
	envKey: string
	endpoint: string
	extractResponse: (data: Record<string, unknown>) => { text: string; citations: string[]; usage: Record<string, unknown> | null }
}

const PROVIDERS: Record<string, ProviderConfig> = {
	perplexity: {
		id: "perplexity",
		label: "Perplexity",
		model: "sonar",
		envKey: "PERPLEXITY_API_KEY",
		endpoint: "https://api.perplexity.ai/chat/completions",
		extractResponse: (data) => ({
			text: (data?.choices?.[0]?.message?.content as string) ?? "",
			citations: (data?.citations as string[]) ?? [],
			usage: (data?.usage as Record<string, unknown>) ?? null,
		}),
	},
	openai: {
		id: "openai",
		label: "OpenAI",
		model: "gpt-4o",
		envKey: "OPENAI_API_KEY",
		endpoint: "https://api.openai.com/v1/chat/completions",
		extractResponse: (data) => ({
			text: (data?.choices?.[0]?.message?.content as string) ?? "",
			citations: [],
			usage: (data?.usage as Record<string, unknown>) ?? null,
		}),
	},
	gemini: {
		id: "gemini",
		label: "Google Gemini",
		model: "gemini-2.0-flash",
		envKey: "GEMINI_API_KEY",
		endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
		extractResponse: (data) => ({
			text: (data?.candidates?.[0]?.content?.parts?.[0]?.text as string) ?? "",
			citations: [],
			usage: (data?.usageMetadata as Record<string, unknown>) ?? null,
		}),
	},
}

function getProvider(id: string): ProviderConfig | null {
	return PROVIDERS[id] ?? null
}

function buildApiRequest(provider: ProviderConfig, apiKey: string, promptText: string): { url: string; headers: Record<string, string>; body: string } {
	if (provider.id === "gemini") {
		return {
			url: `${provider.endpoint}?key=${apiKey}`,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{ parts: [{ text: promptText }] }],
			}),
		}
	}
	return {
		url: provider.endpoint,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: provider.model,
			messages: [{ role: "user", content: promptText }],
		}),
	}
}

function buildAnalysisRequest(provider: ProviderConfig, apiKey: string, analysisPrompt: string): { url: string; headers: Record<string, string>; body: string } {
	if (provider.id === "gemini") {
		return {
			url: `${provider.endpoint}?key=${apiKey}`,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{ parts: [{ text: analysisPrompt }] }],
				generationConfig: { responseMimeType: "application/json" },
			}),
		}
	}
	return {
		url: provider.endpoint,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: provider.model,
			messages: [{ role: "user", content: analysisPrompt }],
		}),
	}
}

function extractAnalysisText(provider: ProviderConfig, data: Record<string, unknown>): string {
	if (provider.id === "gemini") {
		return (data?.candidates?.[0]?.content?.parts?.[0]?.text as string) ?? ""
	}
	return (data?.choices?.[0]?.message?.content as string) ?? ""
}

Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { status: 200, headers: corsHeaders })
	}

	try {
		const authHeader = req.headers.get("Authorization")
		if (!authHeader) {
			return json({ error: "Non authentifie" }, 401)
		}

		const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
		const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
		const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

		const authClient = createClient(supabaseUrl, supabaseAnonKey, {
			global: { headers: { Authorization: authHeader } },
		})

		const admin = createClient(supabaseUrl, serviceRoleKey)

		const { data: userData, error: userError } = await authClient.auth.getUser()
		if (userError || !userData.user) {
			return json({ error: "Non authentifie" }, 401)
		}
		const userId = userData.user.id

		const body = await req.json()
		const projectId = body?.project_id
		const promptId = body?.prompt_id
		const providerId = body?.provider ?? "perplexity"

		if (!projectId || !promptId) {
			return json({ error: "project_id et prompt_id sont requis" }, 400)
		}

		const provider = getProvider(providerId)
		if (!provider) {
			return json({ error: `Fournisseur "${providerId}" non supporte` }, 400)
		}

		const { data: project, error: projectError } = await admin
			.from("projects")
			.select("id, organization_id, domain, name")
			.eq("id", projectId)
			.maybeSingle()

		if (projectError || !project) {
			return json({ error: "Projet introuvable" }, 404)
		}

		const { data: membership } = await admin
			.from("organization_members")
			.select("id, role")
			.eq("organization_id", project.organization_id)
			.eq("user_id", userId)
			.maybeSingle()

		if (!membership) {
			return json({ error: "Acces refuse" }, 403)
		}

		const { data: prompt, error: promptError } = await admin
			.from("project_prompts")
			.select("id, text, is_active")
			.eq("id", promptId)
			.eq("project_id", projectId)
			.maybeSingle()

		if (promptError || !prompt) {
			return json({ error: "Prompt introuvable" }, 404)
		}
		if (!prompt.is_active) {
			return json({ error: "Prompt inactif" }, 400)
		}

		const { data: auditRun, error: runError } = await admin
			.from("audit_runs")
			.insert({
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_count: 1,
				surface_count: 1,
				status: "pending",
			})
			.select("id")
			.maybeSingle()

		if (runError || !auditRun) {
			console.error("audit_runs insert failed:", runError)
			return json({ error: "Echec de la creation de l'audit" }, 500)
		}

		const auditRunId = auditRun.id

		await admin.from("audit_runs").update({ status: "running" }).eq("id", auditRunId)

		const { data: dbKeyData } = await admin
			.rpc("get_provider_api_key", {
				p_org_id: project.organization_id,
				p_provider_id: provider.id,
			})
		const dbKey = (dbKeyData as string | null) ?? null
		const apiKey = dbKey || Deno.env.get(provider.envKey) || null
		if (!apiKey) {
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			await admin.from("audit_results").insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: `${provider.label} API`,
				provider: provider.label,
				model: provider.model,
				collection_method: "api",
				response: "",
				is_analysed: false,
				error_message: `Cle API manquante pour ${provider.label}`,
			})
			return json({ error: `Cle API non configuree pour ${provider.label}. Ajoutez-la dans Configuration > Cles API.` }, 500)
		}

		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 30000)

		const apiReq = buildApiRequest(provider, apiKey, prompt.text)

		let apiResponse: Response
		try {
			apiResponse = await fetch(apiReq.url, {
				method: "POST",
				headers: apiReq.headers,
				body: apiReq.body,
				signal: controller.signal,
			})
		} catch (err) {
			clearTimeout(timeout)
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			const isTimeout = err instanceof DOMException && err.name === "AbortError"
			const errorMsg = isTimeout ? "Delai depasse" : `Erreur de connexion a ${provider.label}`
			await admin.from("audit_results").insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: `${provider.label} API`,
				provider: provider.label,
				model: provider.model,
				collection_method: "api",
				response: "",
				is_analysed: false,
				error_message: errorMsg,
			})
			return json({ error: errorMsg }, isTimeout ? 504 : 502)
		}
		clearTimeout(timeout)

		if (!apiResponse.ok) {
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			await admin.from("audit_results").insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: `${provider.label} API`,
				provider: provider.label,
				model: provider.model,
				collection_method: "api",
				response: "",
				is_analysed: false,
				error_message: `${provider.label} a rejete la requete`,
			})
			return json({ error: `${provider.label} a rejete la requete` }, 502)
		}

		const apiData = await apiResponse.json() as Record<string, unknown>
		const extracted = provider.extractResponse(apiData)
		const responseText = extracted.text
		const citations = extracted.citations
		const usage = extracted.usage

		const brandName = project.name ?? "PlayVOD"
		const brandDomain = project.domain ?? "playvod.com"
		const lowerResponse = responseText.toLowerCase()
		const brandPatterns = [
			brandName.toLowerCase(),
			brandName.toLowerCase().replace(/\s+/g, ""),
			brandDomain.toLowerCase().replace(/^www\./, ""),
		]
		const brandMentioned = brandPatterns.some((p) => p.length > 2 && lowerResponse.includes(p))

		let brandPosition: number | null = null
		if (brandMentioned) {
			for (const pattern of brandPatterns) {
				const idx = lowerResponse.indexOf(pattern)
				if (idx !== -1) {
					brandPosition = idx + 1
					break
				}
			}
		}

		const { data: auditResult, error: resultError } = await admin
			.from("audit_results")
			.insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: `${provider.label} API`,
				provider: provider.label,
				model: provider.model,
				collection_method: "api",
				response: responseText,
				is_analysed: false,
				brand_mentioned: brandMentioned,
				brand_position: brandPosition,
				usage_data: usage,
			})
			.select("id")
			.maybeSingle()

		if (resultError || !auditResult) {
			console.error("audit_results insert failed:", resultError)
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			return json({ error: "Echec de l'enregistrement du resultat" }, 500)
		}

		const auditResultId = auditResult.id

		const projectDomain = project.domain?.toLowerCase().replace(/^www\./, "")
		if (citations.length > 0) {
			const sourceRows = citations.map((url, index) => {
				let domain: string | null = null
				try {
					domain = new URL(url).hostname.replace(/^www\./, "")
				} catch {
					domain = url
				}
				return {
					audit_result_id: auditResultId,
					title: url,
					url,
					domain,
					position: index + 1,
					is_owned_domain: projectDomain ? domain === projectDomain : false,
				}
			})
			await admin.from("result_sources").insert(sourceRows)
		}

		let analysisDone = false
		try {
			const analysisResult = await analyzeBrandResponse(
				provider,
				apiKey,
				prompt.text,
				responseText,
				brandName,
				brandDomain,
			)

			if (analysisResult) {
				const { data: brandAnalysisRow, error: baError } = await admin
					.from("brand_analyses")
					.insert({
						audit_result_id: auditResultId,
						brand_mentioned: analysisResult.brand_mentioned,
						position: analysisResult.position,
						sentiment: analysisResult.sentiment,
						recommendation_type: analysisResult.recommendation_type,
						recommendation_score: analysisResult.recommendation_score,
						visibility_score: analysisResult.visibility_score,
						best_known_for: analysisResult.best_known_for,
						pricing_perception: analysisResult.pricing_perception,
						core_claims: analysisResult.core_claims,
						differentiators: analysisResult.differentiators,
						risks: analysisResult.risks,
					})
					.select("id")
					.maybeSingle()

				if (!baError && brandAnalysisRow) {
					if (analysisResult.competitors.length > 0) {
						const compRows = analysisResult.competitors.map((c) => ({
							brand_analysis_id: brandAnalysisRow.id,
							name: c.name,
							domain: c.domain,
							mention_count: c.mention_count,
							sentiment: c.sentiment,
							visibility: c.visibility,
						}))
						await admin.from("competitor_mentions").insert(compRows)
					}
					analysisDone = true
				}
			}
		} catch (err) {
			console.error("Brand analysis failed:", err)
		}

		await admin
			.from("audit_results")
			.update({ is_analysed: analysisDone })
			.eq("id", auditResultId)

		await admin.from("audit_runs").update({ status: "completed" }).eq("id", auditRunId)

		return json({ audit_run_id: auditRunId, audit_result_id: auditResultId }, 200)
	} catch (err) {
		console.error("run-audit error:", err)
		return json({ error: "Erreur interne du serveur" }, 500)
	}
})

interface BrandAnalysisLLMResult {
	brand_mentioned: boolean
	position: number | null
	sentiment: number
	recommendation_type: string
	recommendation_score: number
	visibility_score: number
	best_known_for: string | null
	pricing_perception: string
	core_claims: string[]
	differentiators: string[]
	risks: string[]
	competitors: {
		name: string
		domain: string | null
		mention_count: number
		sentiment: number
		visibility: number
	}[]
}

async function analyzeBrandResponse(
	provider: ProviderConfig,
	apiKey: string,
	originalPrompt: string,
	aiResponse: string,
	brandName: string,
	brandDomain: string,
): Promise<BrandAnalysisLLMResult | null> {
	const analysisPrompt = `Tu es un analyste expert en visibilite de marque dans les reponses d'IA. Analyse la reponse suivante d'une IA a un prompt utilisateur, du point de vue de la marque "${brandName}" (domaine: ${brandDomain}).

Prompt original: "${originalPrompt}"

Reponse de l'IA:
"""
${aiResponse}
"""

Analyse cette reponse et renvoie UNIQUEMENT un objet JSON valide (sans texte avant ou apres) avec la structure suivante:

{
  "brand_mentioned": true/false,
  "position": null ou nombre (position de la marque dans la reponse, 1 = premiere mentionnee),
  "sentiment": nombre de 0 a 100 (0 = tres negatif, 50 = neutre, 100 = tres positif),
  "recommendation_type": "top_pick" | "recommended" | "mentioned" | "not_mentioned",
  "recommendation_score": nombre de 0 a 100,
  "visibility_score": nombre de 0 a 100 (score de visibilite globale de la marque),
  "best_known_for": null ou string courte decrivant pour quoi la marque est connue,
  "pricing_perception": "budget" | "mid_range" | "premium" | "not_mentioned",
  "core_claims": [liste de strings: les arguments cles associes a la marque],
  "differentiators": [liste de strings: les differenciateurs de la marque],
  "risks": [liste de strings: les risques ou points faibles identifies],
  "competitors": [
    { "name": string, "domain": string ou null, "mention_count": nombre, "sentiment": nombre 0-100, "visibility": nombre 0-100 }
  ]
}

Regles:
- "position" est le rang d'apparition de la marque parmi les marques citees (1 = citee en premier). null si non mentionnee.
- "competitors" doit lister toutes les autres marques/plateformes mentionnees dans la reponse, pas seulement les concurrents connus.
- "mention_count" pour chaque concurrent est le nombre de fois ou il apparait dans la reponse.
- Si la marque n'est pas mentionnee, brand_mentioned = false, position = null, sentiment = 0, recommendation_type = "not_mentioned", visibility_score = 0.`

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), 30000)

	try {
		const req = buildAnalysisRequest(provider, apiKey, analysisPrompt)
		const response = await fetch(req.url, {
			method: "POST",
			headers: req.headers,
			body: req.body,
			signal: controller.signal,
		})
		clearTimeout(timeout)

		if (!response.ok) return null

		const data = await response.json() as Record<string, unknown>
		const content = extractAnalysisText(provider, data)

		const jsonMatch = content.match(/\{[\s\S]*\}/)
		if (!jsonMatch) return null

		const parsed = JSON.parse(jsonMatch[0]) as BrandAnalysisLLMResult

		return {
			brand_mentioned: parsed.brand_mentioned ?? false,
			position: parsed.position ?? null,
			sentiment: clampInt(parsed.sentiment, 0, 100),
			recommendation_type: parsed.recommendation_type ?? "not_mentioned",
			recommendation_score: clampInt(parsed.recommendation_score, 0, 100),
			visibility_score: clampInt(parsed.visibility_score, 0, 100),
			best_known_for: parsed.best_known_for ?? null,
			pricing_perception: parsed.pricing_perception ?? "not_mentioned",
			core_claims: Array.isArray(parsed.core_claims) ? parsed.core_claims : [],
			differentiators: Array.isArray(parsed.differentiators) ? parsed.differentiators : [],
			risks: Array.isArray(parsed.risks) ? parsed.risks : [],
			competitors: Array.isArray(parsed.competitors)
				? parsed.competitors.map((c) => ({
						name: String(c.name ?? ""),
						domain: c.domain ?? null,
						mention_count: clampInt(c.mention_count, 0, 9999),
						sentiment: clampInt(c.sentiment, 0, 100),
						visibility: clampInt(c.visibility, 0, 100),
					}))
				: [],
		}
	} catch {
		clearTimeout(timeout)
		return null
	}
}

function clampInt(val: unknown, min: number, max: number): number {
	const n = typeof val === "number" ? val : parseInt(String(val), 10)
	if (Number.isNaN(n)) return min
	return Math.max(min, Math.min(max, Math.round(n)))
}

function json(data: Record<string, unknown>, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	})
}
