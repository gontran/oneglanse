export interface DailyMetric {
	date: string
	visibility_score: number
	presence_rate: number
	sentiment_score: number
	average_position: number | null
	recommendation_score: number
}

export interface DashboardCompetitorData {
	name: string
	domain: string | null
	isBrand: boolean
	mentionCount: number
	visibility: number
	sentiment: number
}

export interface DashboardSourceData {
	domain: string
	favicon: string | null
	citationCount: number
	models: Set<string>
	uniqueRecords: Set<string>
	isOwnedDomain: boolean
	isFictional: boolean
}

export interface DashboardMetrics {
	brandName: string
	brandDomain: string
	visibilityScore: number
	avgRank: { position: number | null }
	avgSentiment: { score: number }
	impactMetrics: {
		totalResponses: number
		avgVisibility: number
		recommendationRate: number
		topPickRate: number
		criticalRiskCount: number
	}
	aggregateStats: {
		presenceRate: number
		topCompetitor: string
		topCompetitorDomain: string | null
	}
	competitorData: DashboardCompetitorData[]
	brandPerception: {
		bestKnownFor: string | null
		pricingPerception: string
		coreClaims: string[]
		differentiators: string[]
	}
	sourcesIntelligence: DashboardSourceData[]
	totalCitations: number
	analyzedRecords: import("./analysis").AnalysisRecord[]
}

export type TimeRange = "all" | "7d" | "14d" | "30d"
