import { createClient } from "npm:@supabase/supabase-js@2.112.4"

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

		// Auth client: verify the user's JWT
		const authClient = createClient(supabaseUrl, supabaseAnonKey, {
			global: { headers: { Authorization: authHeader } },
		})

		// Service client: bypass RLS for internal DB operations
		// (the function does its own auth/membership checks above)
		const admin = createClient(supabaseUrl, serviceRoleKey)

		const { data: userData, error: userError } = await authClient.auth.getUser()
		if (userError || !userData.user) {
			return json({ error: "Non authentifie" }, 401)
		}
		const userId = userData.user.id

		const body = await req.json()
		const projectId = body?.project_id
		const promptId = body?.prompt_id

		if (!projectId || !promptId) {
			return json({ error: "project_id et prompt_id sont requis" }, 400)
		}

		// Verify project exists
		const { data: project, error: projectError } = await admin
			.from("projects")
			.select("id, organization_id, domain")
			.eq("id", projectId)
			.maybeSingle()

		if (projectError || !project) {
			return json({ error: "Projet introuvable" }, 404)
		}

		// Verify user is org member
		const { data: membership } = await admin
			.from("organization_members")
			.select("id, role")
			.eq("organization_id", project.organization_id)
			.eq("user_id", userId)
			.maybeSingle()

		if (!membership) {
			return json({ error: "Acces refuse" }, 403)
		}

		// Verify prompt belongs to project and is active
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

		// Create audit_run with status pending
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
			return json({ error: "Echec de la creation de l'audit" }, 500)
		}

		const auditRunId = auditRun.id

		// Set status to running
		await admin.from("audit_runs").update({ status: "running" }).eq("id", auditRunId)

		// Call Perplexity API
		const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY")
		if (!perplexityKey) {
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			await admin.from("audit_results").insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: "Perplexity API",
				provider: "Perplexity",
				model: "sonar",
				collection_method: "api",
				response: "",
				is_analysed: false,
				error_message: "Configuration serveur incomplete",
			})
			return json({ error: "Configuration serveur incomplete" }, 500)
		}

		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), 30000)

		let perplexityResponse: Response
		try {
			perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${perplexityKey}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "sonar",
					messages: [{ role: "user", content: prompt.text }],
				}),
				signal: controller.signal,
			})
		} catch (err) {
			clearTimeout(timeout)
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			const isTimeout = err instanceof DOMException && err.name === "AbortError"
			const errorMsg = isTimeout ? "Delai depasse" : "Erreur de connexion au fournisseur IA"
			await admin.from("audit_results").insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: "Perplexity API",
				provider: "Perplexity",
				model: "sonar",
				collection_method: "api",
				response: "",
				is_analysed: false,
				error_message: errorMsg,
			})
			return json({ error: errorMsg }, isTimeout ? 504 : 502)
		}
		clearTimeout(timeout)

		if (!perplexityResponse.ok) {
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			await admin.from("audit_results").insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: "Perplexity API",
				provider: "Perplexity",
				model: "sonar",
				collection_method: "api",
				response: "",
				is_analysed: false,
				error_message: "Le fournisseur IA a rejete la requete",
			})
			return json({ error: "Le fournisseur IA a rejete la requete" }, 502)
		}

		const perplexityData = await perplexityResponse.json()
		const responseText = perplexityData?.choices?.[0]?.message?.content ?? ""
		const citations: string[] = perplexityData?.citations ?? []
		const usage = perplexityData?.usage ?? null

		// Deterministic brand detection
		const lowerResponse = responseText.toLowerCase()
		const brandPatterns = ["playvod", "play vod", "playvod.com"]
		const brandMentioned = brandPatterns.some((p) => lowerResponse.includes(p))

		// Calculate brand position (1-based occurrence in response)
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

		// Create audit_result
		const { data: auditResult, error: resultError } = await admin
			.from("audit_results")
			.insert({
				audit_run_id: auditRunId,
				organization_id: project.organization_id,
				project_id: projectId,
				prompt_id: promptId,
				prompt: prompt.text,
				surface: "Perplexity API",
				provider: "Perplexity",
				model: "sonar",
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
			await admin.from("audit_runs").update({ status: "failed" }).eq("id", auditRunId)
			return json({ error: "Echec de l'enregistrement du resultat" }, 500)
		}

		// Insert citations as result_sources
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
					audit_result_id: auditResult.id,
					title: url,
					url,
					domain,
					position: index + 1,
					is_owned_domain: projectDomain ? domain === projectDomain : false,
				}
			})
			await admin.from("result_sources").insert(sourceRows)
		}

		// Set audit_run status to completed
		await admin.from("audit_runs").update({ status: "completed" }).eq("id", auditRunId)

		return json({ audit_run_id: auditRunId, audit_result_id: auditResult.id }, 200)
	} catch (err) {
		console.error("run-perplexity-audit error:", err)
		return json({ error: "Erreur interne du serveur" }, 500)
	}
})

function json(data: Record<string, unknown>, status: number): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { ...corsHeaders, "Content-Type": "application/json" },
	})
}
