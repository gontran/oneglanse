export function getDomain(url: string): string | null {
	try {
		const u = new URL(url.startsWith("http") ? url : `https://${url}`)
		return u.hostname.replace(/^www\./, "")
	} catch {
		return null
	}
}

export function getFaviconUrls(domain?: string, name?: string): string[] {
	const hostname = getDomain(domain ?? "")
	if (!hostname) return []
	return [
		`https://www.google.com/s2/favicons?sz=64&domain=${hostname}`,
		`https://icons.duckduckgo.com/ip3/${hostname}.ico`,
	]
}

const SURFACE_DOMAINS: Record<string, string> = {
	ChatGPT: "openai.com",
	Gemini: "gemini.google.com",
	Perplexity: "perplexity.ai",
	Claude: "claude.ai",
	"Google AI Overview": "google.com",
}

export function getSurfaceFavicon(surface: string): string {
	const domain = SURFACE_DOMAINS[surface] ?? `${surface.toLowerCase()}.com`
	return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
}

export function getSurfaceDisplayName(surface: string): string {
	return surface
}

const SURFACE_MODELS: Record<string, { provider: string; model: string }> = {
	ChatGPT: { provider: "OpenAI", model: "GPT-4o" },
	Gemini: { provider: "Google", model: "Gemini 2.0 Flash" },
	Perplexity: { provider: "Perplexity", model: "Sonar" },
	Claude: { provider: "Anthropic", model: "Claude 3.5 Sonnet" },
	"Google AI Overview": { provider: "Google", model: "Gemini (Search)" },
}

export function getSurfaceModel(surface: string): { provider: string; model: string } {
	return SURFACE_MODELS[surface] ?? { provider: surface, model: surface }
}
