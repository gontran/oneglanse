import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { dataService } from "@/lib/services"
import type { ProjectPrompt } from "@/types/analysis"
import {
	TriangleAlert as AlertTriangle,
	ArrowRight,
	CircleCheck as CheckCircle2,
	ExternalLink,
	Info,
	Loader as Loader2,
	Play,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

interface PerplexityTestPanelProps {
	projectId: string
	prompts: ProjectPrompt[]
}

export function PerplexityTestPanel({ projectId, prompts }: PerplexityTestPanelProps) {
	const activePrompts = prompts.filter((p) => p.is_active)
	const [selectedPromptId, setSelectedPromptId] = useState(activePrompts[0]?.id ?? "")
	const [confirming, setConfirming] = useState(false)
	const [running, setRunning] = useState(false)
	const [result, setResult] = useState<{ auditResultId: string } | null>(null)
	const [error, setError] = useState<string | null>(null)

	const handleRun = async () => {
		setRunning(true)
		setError(null)
		setResult(null)
		try {
			const res = await dataService.runPerplexityAudit(projectId, selectedPromptId)
			setResult({ auditResultId: res.auditResultId })
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'audit.")
		} finally {
			setRunning(false)
			setConfirming(false)
		}
	}

	const promptOptions = activePrompts.map((p) => ({
		value: p.id,
		label: p.text.length > 80 ? `${p.text.slice(0, 80)}...` : p.text,
	}))

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-2 rounded-[var(--app-radius)] border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
				<Info className="mt-0.5 size-4 shrink-0 text-blue-500" />
				<p className="text-[13px] text-blue-700 dark:text-blue-400">
					Envoie un prompt selectionne a l'API Perplexity Sonar. Un seul prompt par execution.
				</p>
			</div>

			<div className="space-y-1.5">
				<span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
					Prompt a tester
				</span>
				{activePrompts.length === 0 ? (
					<p className="text-sm text-gray-400">Aucun prompt actif. Activez au moins un prompt.</p>
				) : (
					<SearchableSelect
						options={promptOptions}
						value={selectedPromptId}
						onValueChange={setSelectedPromptId}
						placeholder="Selectionner un prompt"
						searchPlaceholder="Rechercher un prompt..."
					/>
				)}
			</div>

			{!confirming && !running && !result && (
				<Button
					onClick={() => setConfirming(true)}
					disabled={!selectedPromptId || activePrompts.length === 0}
				>
					<Play className="size-4" />
					Tester avec Perplexity
				</Button>
			)}

			{confirming && !running && (
				<div className="space-y-3 rounded-[var(--app-radius)] border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
					<div className="flex items-start gap-2">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
						<p className="text-[13px] text-amber-700 dark:text-amber-400">
							Voulez-vous envoyer ce prompt a l'API Perplexity Sonar ? Un appel reel sera effectue.
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
							Annuler
						</Button>
						<Button size="sm" onClick={() => void handleRun()}>
							Lancer
						</Button>
					</div>
				</div>
			)}

			{running && (
				<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
					<Loader2 className="size-4 animate-spin" />
					En cours...
				</div>
			)}

			{error && (
				<div className="flex items-start gap-2 rounded-[var(--app-radius)] border border-red-200 bg-red-50/60 p-3 dark:border-red-900/50 dark:bg-red-950/20">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
					<p className="text-[13px] text-red-700 dark:text-red-400">{error}</p>
				</div>
			)}

			{result && (
				<div className="space-y-3 rounded-[var(--app-radius)] border border-green-200 bg-green-50/60 p-4 dark:border-green-900/50 dark:bg-green-950/20">
					<div className="flex items-start gap-2">
						<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
						<div className="space-y-1">
							<p className="text-[13px] font-medium text-green-700 dark:text-green-400">
								Audit complete avec succes
							</p>
							<p className="text-[11px] text-green-600 dark:text-green-500">
								Resultat collecte via l'API Perplexity Sonar. Le contenu peut differe de l'interface
								grand public.
							</p>
						</div>
					</div>
					<Link
						to={`/results/${result.auditResultId}`}
						className="inline-flex items-center gap-1.5 text-[13px] font-medium text-green-700 underline dark:text-green-400"
					>
						Voir le resultat
						<ArrowRight className="size-3.5" />
						<ExternalLink className="size-3" />
					</Link>
				</div>
			)}
		</div>
	)
}
