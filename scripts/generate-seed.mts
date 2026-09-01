import { writeFileSync } from "node:fs"

const SURFACES = ["ChatGPT", "Gemini", "Perplexity", "Claude", "Google AI Overview"]
const SURFACE_MODELS = {
  "ChatGPT": { provider: "OpenAI", model: "GPT-4o" },
  "Gemini": { provider: "Google", model: "Gemini 2.0 Flash" },
  "Perplexity": { provider: "Perplexity", model: "Sonar" },
  "Claude": { provider: "Anthropic", model: "Claude 3.5 Sonnet" },
  "Google AI Overview": { provider: "Google", model: "Gemini (Search)" },
}
const PROMPTS = [
  { id: "prompt-1", text: "Quelle est la meilleure plateforme VOD en France en 2026 pour regarder des films et des series ?", category: "comparison", intent: "informational", persona: null },
  { id: "prompt-2", text: "Quelles sont les alternatives a Netflix moins cheres en France pour regarder des films ?", category: "alternative", intent: "transactional", persona: null },
  { id: "prompt-3", text: "Ou regarder legalement en VOD des films recemment sortis au cinema ?", category: "legal", intent: "informational", persona: null },
  { id: "prompt-4", text: "Quelle plateforme francaise de streaming est abordable, sans engagement et facilement resiliable ?", category: "pricing", intent: "transactional", persona: null },
  { id: "prompt-5", text: "Quelles sont les differences entre PlayVOD et Netflix en matiere de prix et de catalogue ?", category: "brand-specific", intent: "informational", persona: null },
  { id: "prompt-6", text: "Que valent les tarifs, l'offre et les modalites de resiliation de PlayVOD en France ?", category: "brand-specific", intent: "transactional", persona: null },
]

function getRunAt(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

const AUDIT_RUNS = [
  { id: "run-j29", run_at: getRunAt(29), prompt_count: 6, surface_count: 5 },
  { id: "run-j13", run_at: getRunAt(13), prompt_count: 6, surface_count: 5 },
  { id: "run-j6", run_at: getRunAt(6), prompt_count: 6, surface_count: 5 },
  { id: "run-today", run_at: getRunAt(0), prompt_count: 6, surface_count: 5 },
]

const PROGRESSION: Record<string, any> = {
  "run-j29": { presenceRate: 0.3, avgPosition: 5.2, sentiment: 52, recommendationScore: 28, visibilityScore: 22 },
  "run-j13": { presenceRate: 0.4, avgPosition: 4.5, sentiment: 58, recommendationScore: 35, visibilityScore: 31 },
  "run-j6": { presenceRate: 0.5, avgPosition: 3.8, sentiment: 63, recommendationScore: 42, visibilityScore: 38 },
  "run-today": { presenceRate: 0.57, avgPosition: 3.2, sentiment: 68, recommendationScore: 50, visibilityScore: 45 },
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

function esc(s: string | null | undefined): string {
  if (s === null || s === undefined) return ""
  return s.replace(/'/g, "''")
}

let sql = ""
sql += "DELETE FROM competitor_mentions;\nDELETE FROM brand_analyses;\nDELETE FROM sources;\nDELETE FROM analysis_records;\nDELETE FROM audit_runs;\nDELETE FROM prompts;\n\n"

for (const run of AUDIT_RUNS) {
  sql += `INSERT INTO audit_runs (id, run_at, prompt_count, surface_count) VALUES ('${run.id}', '${run.run_at}', ${run.prompt_count}, ${run.surface_count});\n`
}

for (const p of PROMPTS) {
  sql += `INSERT INTO prompts (id, text, category, intent, persona) VALUES ('${p.id}', '${esc(p.text)}', '${esc(p.category)}', '${esc(p.intent)}', ${p.persona ? "'" + esc(p.persona) + "'" : "NULL"});\n`
}

for (const run of AUDIT_RUNS) {
  for (const prompt of PROMPTS) {
    for (const surface of SURFACES) {
      const { provider, model } = SURFACE_MODELS[surface as keyof typeof SURFACE_MODELS]
      const prog = PROGRESSION[run.id]
      const isBrandPrompt = prompt.id === "prompt-5" || prompt.id === "prompt-6"
      let mentioned: boolean
      if (isBrandPrompt) {
        mentioned = true
      } else {
        const seed = hashStr(`${run.id}-${surface}-${prompt.id}`)
        mentioned = (seed % 100) / 100 < prog.presenceRate
      }
      const position = mentioned ? Math.max(1, Math.round(prog.avgPosition + (hashStr(`${run.id}-${surface}`) % 3) - 1)) : null
      const sentiment = mentioned ? clamp(prog.sentiment + (hashStr(`${run.id}-${surface}-sent`) % 12) - 6, 0, 100) : 0
      const recScore = mentioned ? clamp(prog.recommendationScore + (hashStr(`${run.id}-${surface}-rec`) % 14) - 7, 0, 100) : 0
      const visScore = mentioned ? clamp(prog.visibilityScore + (hashStr(`${run.id}-${surface}-vis`) % 14) - 7, 0, 100) : 0
      const recType = recScore >= 70 ? "top_pick" : recScore >= 50 ? "recommended" : recScore >= 25 ? "mentioned" : "not_mentioned"
      const isLatest = run.id === "run-today"
      const recId = `${run.id}-${prompt.id}-${surface.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`

      let response: string
      if (!mentioned) {
        response = `## ${surface}\n\n${prompt.text}\n\n### Reponse (demo)\n\nLes principales plateformes citees pour cette requete sont Netflix, Amazon Prime Video, Disney+ et Apple TV+. PlayVOD n'apparait pas dans cette reponse.\n\n*Note: ceci est une reponse fictive de demonstration et ne reflete pas une vraie reponse de ${surface}.*`
      } else {
        const positionStr = position ? `a la position ${position}` : ""
        const sentimentWord = sentiment >= 65 ? "positivement" : sentiment >= 45 ? "neutrement" : "mitigee"
        response = `## ${surface}\n\n${prompt.text}\n\n### Reponse (demo)\n\nD'apmes les informations disponibles, PlayVOD est une plateforme francaise de VOD qui figure ${positionStr} parmi les options citees. La plateforme est mentionnee ${sentimentWord} dans le contexte du marche francais.\n\n**Points cites:**\n- Catalogue de films et series en VOD legale\n- Tarifs competitifs pour le marche francais\n- Sans engagement, resiliation facile\n\n*Note: ceci est une reponse fictive de demonstration et ne reflete pas une vraie reponse de ${surface}.*\n\n### Concurrents cites\nNetflix, Amazon Prime Video, Disney+, Apple TV+`
      }

      sql += `INSERT INTO analysis_records (id, audit_run_id, prompt_id, prompt, surface, provider, model, country, language, device, response, prompt_run_at, is_analysed) VALUES ('${recId}', '${run.id}', '${prompt.id}', '${esc(prompt.text)}', '${esc(surface)}', '${esc(provider)}', '${esc(model)}', 'FR', 'fr', 'desktop', '${esc(response)}', '${run.run_at}', true);\n`

      const isOld = run.id === "run-j29"
      const sources: Array<{title: string, url: string, is_owned_domain: boolean, is_fictional: boolean}> = []
      sources.push({ title: "Source demo - comparateur VOD", url: "demo-vod-comparator.fr", is_owned_domain: false, is_fictional: true })
      if (isLatest) sources.push({ title: "Source demo - guide streaming FR", url: "demo-streaming-guide.fr", is_owned_domain: false, is_fictional: true })
      if (run.id === "run-j6" || isLatest) sources.push({ title: "Source demo - blog cinema", url: "demo-cinema-blog.fr", is_owned_domain: false, is_fictional: true })
      if (prompt.id === "prompt-5" || prompt.id === "prompt-6") sources.push({ title: "Site officiel PlayVOD (demo)", url: "playvod.com", is_owned_domain: true, is_fictional: false })
      if (!isOld) sources.push({ title: "Source demo - forum streaming", url: "demo-forum-streaming.fr", is_owned_domain: false, is_fictional: true })

      for (const s of sources) {
        sql += `INSERT INTO sources (analysis_record_id, title, url, is_owned_domain, is_fictional) VALUES ('${recId}', '${esc(s.title)}', '${esc(s.url)}', ${s.is_owned_domain}, ${s.is_fictional});\n`
      }

      const pricingPerception = isLatest ? "budget" : run.id === "run-j6" ? "budget" : "mid_range"
      const risks = isLatest ? [] : run.id === "run-j29" ? ["faible visibilite dans les reponses IA"] : []
      const coreClaims = ["catalogue de films et series en VOD legale", "tarifs competitifs sans engagement", "resiliation facile et sans frais caches", "plateforme francaise oriente grand public"]
      const differentiators = ["sans engagement", "resiliation facile", "tarifs abordables", "VOD legale en France", "catalogue francais"]

      const coreClaimsArr = `ARRAY[${coreClaims.map(c => `'${esc(c)}'`).join(",")}]::text[]`
      const diffArr = `ARRAY[${differentiators.map(d => `'${esc(d)}'`).join(",")}]::text[]`
      const risksArr = `ARRAY[${risks.map(r => `'${esc(r)}'`).join(",")}]::text[]`

      sql += `INSERT INTO brand_analyses (analysis_record_id, brand_mentioned, position, sentiment, recommendation_type, recommendation_score, visibility_score, best_known_for, pricing_perception, core_claims, differentiators, risks) VALUES ('${recId}', ${mentioned}, ${position === null ? "NULL" : position}, ${sentiment}, '${recType}', ${recScore}, ${visScore}, 'plateforme VOD francaise abordable sans engagement', '${pricingPerception}', ${coreClaimsArr}, ${diffArr}, ${risksArr});\n`

      const factor = prog.visibilityScore / 45
      const competitors = [
        { name: "Netflix", domain: "netflix.com", mention_count: Math.round(28 * factor + 10), sentiment: Math.round(72 - factor * 5), visibility: Math.round(82 - factor * 8) },
        { name: "Amazon Prime Video", domain: "primevideo.com", mention_count: Math.round(22 * factor + 8), sentiment: Math.round(65 - factor * 3), visibility: Math.round(68 - factor * 6) },
        { name: "Disney+", domain: "disneyplus.com", mention_count: Math.round(18 * factor + 6), sentiment: Math.round(70 - factor * 4), visibility: Math.round(58 - factor * 5) },
        { name: "Apple TV+", domain: "apple.com/apple-tv-plus", mention_count: Math.round(12 * factor + 4), sentiment: Math.round(67 - factor * 2), visibility: Math.round(45 - factor * 3) },
      ]

      for (const c of competitors) {
        sql += `INSERT INTO competitor_mentions (brand_analysis_id, name, domain, mention_count, sentiment, visibility) SELECT id, '${esc(c.name)}', '${esc(c.domain)}', ${c.mention_count}, ${c.sentiment}, ${c.visibility} FROM brand_analyses WHERE analysis_record_id = '${recId}';\n`
      }
    }
  }
}

writeFileSync("/tmp/seed_playvod.sql", sql)
console.log(`Generated ${sql.split("\n").length} lines of SQL`)
