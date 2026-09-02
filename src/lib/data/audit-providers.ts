export interface AuditProvider {
	id: string
	label: string
	model: string
	envKey: string
}

export const AUDIT_PROVIDERS: AuditProvider[] = [
	{ id: "perplexity", label: "Perplexity Sonar", model: "sonar", envKey: "PERPLEXITY_API_KEY" },
	{ id: "openai", label: "OpenAI GPT-4o", model: "gpt-4o", envKey: "OPENAI_API_KEY" },
	{ id: "gemini", label: "Google Gemini", model: "gemini-2.0-flash", envKey: "GEMINI_API_KEY" },
]

export const DEFAULT_AUDIT_PROVIDER = AUDIT_PROVIDERS[0]
