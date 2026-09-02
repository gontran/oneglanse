import type { UserPrompt } from "@/types/analysis"

export const PROMPTS: UserPrompt[] = [
	{
		id: "prompt-1",
		text: "Quelle est la meilleure plateforme VOD en France en 2026 pour regarder des films et des series ?",
		category: "comparison",
		intent: "informational",
		persona: null,
	},
	{
		id: "prompt-2",
		text: "Quelles sont les alternatives a Netflix moins cheres en France pour regarder des films ?",
		category: "alternative",
		intent: "transactional",
		persona: null,
	},
	{
		id: "prompt-3",
		text: "Ou regarder legalement en VOD des films recemment sortis au cinema ?",
		category: "legal",
		intent: "informational",
		persona: null,
	},
	{
		id: "prompt-4",
		text: "Quelle plateforme francaise de streaming est abordable, sans engagement et facilement resiliable ?",
		category: "pricing",
		intent: "transactional",
		persona: null,
	},
	{
		id: "prompt-5",
		text: "Que valent les tarifs, l'offre et les modalites de resiliation de cette plateforme en France ?",
		category: "brand-specific",
		intent: "transactional",
		persona: null,
	},
	{
		id: "prompt-6",
		text: "Quelles sont les differences entre cette plateforme et Netflix en matiere de prix et de catalogue ?",
		category: "brand-specific",
		intent: "informational",
		persona: null,
	},
]
