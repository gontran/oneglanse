import type { AnalysisRecord, BrandAnalysisResult } from "@/types/analysis"
import type {
	DashboardCompetitorData,
	DashboardMetrics,
	DashboardSourceData,
} from "@/types/dashboard"

export function getBrandMentioned(record: AnalysisRecord): boolean {
	return record.brand_analysis?.brand_mentioned ?? false
}

export function getPosition(record: AnalysisRecord): number | null {
	return record.brand_analysis?.position ?? null
}

export function getVisibilityScore(record: AnalysisRecord): number {
	return record.brand_analysis?.visibility_score ?? 0
}

export function getSentiment(record: AnalysisRecord): number {
	return record.brand_analysis?.sentiment ?? 0
}

export function getRecommendationScore(record: AnalysisRecord): number {
	return record.brand_analysis?.recommendation.score ?? 0
}

export function getRecommendationType(record: AnalysisRecord): string {
	return record.brand_analysis?.recommendation.type ?? "not_mentioned"
}

export function getBrandAnalysis(record: AnalysisRecord): BrandAnalysisResult | null {
	return record.brand_analysis
}

export function computePresenceRate(records: AnalysisRecord[]): number {
	if (records.length === 0) return 0
	const mentioned = records.filter(getBrandMentioned).length
	return (mentioned / records.length) * 100
}

export function computeAveragePosition(records: AnalysisRecord[]): number | null {
	const positions = records.map(getPosition).filter((p): p is number => p !== null)
	if (positions.length === 0) return null
	const sum = positions.reduce((a, b) => a + b, 0)
	return Math.round((sum / positions.length) * 10) / 10
}

export function computeAverageSentiment(records: AnalysisRecord[]): number {
	const sentiments = records.map(getSentiment)
	if (sentiments.length === 0) return 0
	return sentiments.reduce((a, b) => a + b, 0) / sentiments.length
}

export function computeRecommendationScore(records: AnalysisRecord[]): number {
	if (records.length === 0) return 0
	const scores = records.map(getRecommendationScore)
	return scores.reduce((a, b) => a + b, 0) / records.length
}

export function computeVisibilityScore(records: AnalysisRecord[]): number {
	if (records.length === 0) return 0
	const scores = records.map(getVisibilityScore)
	return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

export function computeAvgVisibility(records: AnalysisRecord[]): number {
	if (records.length === 0) return 0
	return computeVisibilityScore(records)
}

export function computeRecommendationRate(records: AnalysisRecord[]): number {
	if (records.length === 0) return 0
	const recommended = records.filter(
		(r) => getRecommendationType(r) === "recommended" || getRecommendationType(r) === "top_pick",
	).length
	return (recommended / records.length) * 100
}

export function computeTopPickRate(records: AnalysisRecord[]): number {
	if (records.length === 0) return 0
	const topPicks = records.filter((r) => getRecommendationType(r) === "top_pick").length
	return (topPicks / records.length) * 100
}

export function computeCriticalRiskCount(records: AnalysisRecord[]): number {
	let count = 0
	for (const r of records) {
		const ba = getBrandAnalysis(r)
		if (ba && ba.risks.length > 0) count++
	}
	return count
}

export function computeCompetitorData(
	records: AnalysisRecord[],
	brandName: string,
	brandDomain: string,
): DashboardCompetitorData[] {
	const map = new Map<string, DashboardCompetitorData>()

	map.set(brandName, {
		name: brandName,
		domain: brandDomain,
		isBrand: true,
		mentionCount: records.filter(getBrandMentioned).length,
		visibility: computeVisibilityScore(records),
		sentiment: computeAverageSentiment(records),
	})

	for (const r of records) {
		const ba = getBrandAnalysis(r)
		if (!ba) continue
		for (const comp of ba.competitors) {
			const existing = map.get(comp.name)
			if (existing) {
				existing.mentionCount += comp.mention_count
				existing.visibility = Math.max(existing.visibility, comp.visibility)
				existing.sentiment = Math.round((existing.sentiment + comp.sentiment) / 2)
			} else {
				map.set(comp.name, {
					name: comp.name,
					domain: comp.domain,
					isBrand: false,
					mentionCount: comp.mention_count,
					visibility: comp.visibility,
					sentiment: comp.sentiment,
				})
			}
		}
	}

	return Array.from(map.values()).sort((a, b) => b.mentionCount - a.mentionCount)
}

export function computeSourcesIntelligence(records: AnalysisRecord[]): DashboardSourceData[] {
	const map = new Map<string, DashboardSourceData>()

	for (const r of records) {
		for (const s of r.sources) {
			let domain = s.url
			try {
				const u = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`)
				domain = u.hostname.replace(/^www\./, "")
			} catch {
				domain = s.url
			}

			const existing = map.get(domain)
			if (existing) {
				existing.citationCount += 1
				existing.models.add(r.surface)
				existing.uniqueRecords.add(r.id)
			} else {
				map.set(domain, {
					domain,
					favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
					citationCount: 1,
					models: new Set([r.surface]),
					uniqueRecords: new Set([r.id]),
					isOwnedDomain: s.is_owned_domain,
					isFictional: s.is_fictional,
				})
			}
		}
	}

	return Array.from(map.values()).sort((a, b) => b.citationCount - a.citationCount)
}

export function computeTotalCitations(records: AnalysisRecord[]): number {
	let total = 0
	for (const r of records) {
		total += r.sources.length
	}
	return total
}

export function computeTopCompetitor(competitors: DashboardCompetitorData[]): {
	name: string
	domain: string | null
} {
	const nonBrand = competitors.filter((c) => !c.isBrand)
	if (nonBrand.length === 0) return { name: "N/A", domain: null }
	const top = nonBrand[0]
	return { name: top.name, domain: top.domain }
}

export function computeBrandPerception(records: AnalysisRecord[]): {
	bestKnownFor: string | null
	pricingPerception: string
	coreClaims: string[]
	differentiators: string[]
} {
	const analysed = records.filter((r) => r.brand_analysis)
	if (analysed.length === 0) {
		return {
			bestKnownFor: null,
			pricingPerception: "not_mentioned",
			coreClaims: [],
			differentiators: [],
		}
	}

	const latest = analysed[analysed.length - 1]
	const perception = latest.brand_analysis!.perception

	const claimSet = new Set<string>()
	for (const r of analysed) {
		for (const c of r.brand_analysis!.perception.coreClaims) {
			claimSet.add(c)
		}
	}

	const diffSet = new Set<string>()
	for (const r of analysed) {
		for (const d of r.brand_analysis!.perception.differentiators) {
			diffSet.add(d)
		}
	}

	return {
		bestKnownFor: perception.bestKnownFor,
		pricingPerception: perception.pricingPerception,
		coreClaims: Array.from(claimSet),
		differentiators: Array.from(diffSet),
	}
}

export function computeDashboardMetrics(
	records: AnalysisRecord[],
	brandName: string,
	brandDomain: string,
): DashboardMetrics {
	const competitorData = computeCompetitorData(records, brandName, brandDomain)
	const sourcesIntelligence = computeSourcesIntelligence(records)
	const totalCitations = computeTotalCitations(records)
	const topCompetitor = computeTopCompetitor(competitorData)

	return {
		brandName,
		brandDomain,
		visibilityScore: computeVisibilityScore(records),
		avgRank: { position: computeAveragePosition(records) },
		avgSentiment: { score: Math.round(computeAverageSentiment(records)) },
		impactMetrics: {
			totalResponses: records.length,
			avgVisibility: computeAvgVisibility(records),
			recommendationRate: computeRecommendationRate(records),
			topPickRate: computeTopPickRate(records),
			criticalRiskCount: computeCriticalRiskCount(records),
		},
		aggregateStats: {
			presenceRate: Math.round(computePresenceRate(records)),
			topCompetitor: topCompetitor.name,
			topCompetitorDomain: topCompetitor.domain,
		},
		competitorData,
		brandPerception: computeBrandPerception(records),
		sourcesIntelligence,
		totalCitations,
		analyzedRecords: records,
	}
}

export function computeDailyMetricsFromRecords(
	auditPoints: { date: string; records: AnalysisRecord[] }[],
	totalDays = 30,
): import("@/types/dashboard").DailyMetric[] {
	const results: import("@/types/dashboard").DailyMetric[] = []
	const auditMap = new Map<string, import("@/types/dashboard").DailyMetric>()

	for (const point of auditPoints) {
		const records = point.records
		const metric: import("@/types/dashboard").DailyMetric = {
			date: point.date,
			visibility_score: computeVisibilityScore(records),
			presence_rate: Math.round(computePresenceRate(records)),
			sentiment_score: Math.round(computeAverageSentiment(records)),
			average_position: computeAveragePosition(records),
			recommendation_score: Math.round(computeRecommendationScore(records)),
		}
		auditMap.set(point.date, metric)
		results.push(metric)
	}

	const sortedAudits = auditPoints
		.map((p) => p.date)
		.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

	const allDates: string[] = []
	const now = new Date()
	for (let i = totalDays - 1; i >= 0; i--) {
		const d = new Date(now)
		d.setDate(d.getDate() - i)
		const dateStr = d.toISOString().split("T")[0]
		allDates.push(dateStr)
	}

	const fullSeries: import("@/types/dashboard").DailyMetric[] = allDates.map((date) => {
		const auditMetric = auditMap.get(date)
		if (auditMetric) return auditMetric

		let prev: import("@/types/dashboard").DailyMetric | null = null
		let next: import("@/types/dashboard").DailyMetric | null = null
		const dateMs = new Date(date).getTime()

		for (const auditDate of sortedAudits) {
			const auditMs = new Date(auditDate).getTime()
			if (auditMs < dateMs) {
				prev = auditMap.get(auditDate)!
			}
			if (auditMs > dateMs && !next) {
				next = auditMap.get(auditDate)!
			}
		}

		if (prev && next) {
			const prevMs = new Date(
				sortedAudits[sortedAudits.indexOf(sortedAudits.find((a) => auditMap.get(a) === prev)!)],
			).getTime()
			const nextMs = new Date(
				sortedAudits[sortedAudits.indexOf(sortedAudits.find((a) => auditMap.get(a) === next)!)],
			).getTime()
			const t = (dateMs - prevMs) / (nextMs - prevMs)
			return {
				date,
				visibility_score: Math.round(
					prev.visibility_score + (next.visibility_score - prev.visibility_score) * t,
				),
				presence_rate: Math.round(
					prev.presence_rate + (next.presence_rate - prev.presence_rate) * t,
				),
				sentiment_score: Math.round(
					prev.sentiment_score + (next.sentiment_score - prev.sentiment_score) * t,
				),
				average_position: prev.average_position,
				recommendation_score: Math.round(
					prev.recommendation_score + (next.recommendation_score - prev.recommendation_score) * t,
				),
			}
		}

		if (prev) return { ...prev, date }
		if (next) return { ...next, date }

		return {
			date,
			visibility_score: 0,
			presence_rate: 0,
			sentiment_score: 0,
			average_position: null,
			recommendation_score: 0,
		}
	})

	return fullSeries
}
