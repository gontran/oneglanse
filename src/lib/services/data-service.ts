import type {
	AnalysisRecord,
	AuditResultDetail,
	AuditRunStatus,
	Competitor,
	Project,
	ProjectPrompt,
	ProjectSurface,
} from "@/types/analysis"

export interface IDataService {
	getProject(): Promise<Project>
	createProject(data: {
		name: string
		domain: string
		country: string
		country_custom: string | null
		language: string
		language_custom: string | null
	}): Promise<Project>
	updateProject(patch: Partial<Omit<Project, "id">>): Promise<Project>

	getCompetitors(): Promise<Competitor[]>
	addCompetitor(name: string, domain: string | null): Promise<Competitor>
	updateCompetitor(
		id: string,
		patch: { name?: string; domain?: string | null },
	): Promise<Competitor>
	removeCompetitor(id: string): Promise<void>

	getPrompts(): Promise<ProjectPrompt[]>
	addPrompt(data: Omit<ProjectPrompt, "id">): Promise<ProjectPrompt>
	updatePrompt(id: string, patch: Partial<Omit<ProjectPrompt, "id">>): Promise<ProjectPrompt>
	removePrompt(id: string): Promise<void>
	togglePrompt(id: string, isActive: boolean): Promise<void>

	getSurfaces(): Promise<ProjectSurface[]>
	toggleSurface(id: string, isActive: boolean): Promise<void>

	getAnalysisRecords(): Promise<AnalysisRecord[]>
	getAuditResult(resultId: string): Promise<AuditResultDetail | null>
	runPerplexityAudit(
		projectId: string,
		promptId: string,
	): Promise<{ auditRunId: string; auditResultId: string }>
}

export type AuditRunStatusType = AuditRunStatus
