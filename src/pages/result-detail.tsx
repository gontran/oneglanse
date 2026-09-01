import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { dataService } from "@/lib/services"
import { formatDateFr } from "@/lib/utils/format"
import type { AuditResultDetail } from "@/types/analysis"
import { ArrowLeft, ExternalLink, Info, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

export function ResultDetailPage() {
	const { resultId } = useParams<{ resultId: string }>()
	const [result, setResult] = useState<AuditResultDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			if (!resultId) return
			try {
				const data = await dataService.getAuditResult(resultId)
				if (cancelled) return
				setResult(data)
				setError(data ? null : "Resultat introuvable ou acces refuse.")
			} catch (err) {
				if (cancelled) return
				setError(err instanceof Error ? err.message : "Erreur de chargement.")
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [resultId])

	return (
		<div className="web-app-shell">
			<AppSidebar />
			<main className="web-app-main">
				<header className="web-app-header">
					<SidebarTrigger className="size-8 shrink-0 rounded-none border-transparent bg-transparent p-0 shadow-none hover:bg-transparent dark:hover:bg-transparent" />
					<h1 className="truncate text-[0.95rem] font-medium tracking-[-0.01em] text-gray-950 dark:text-gray-50">
						Detail du resultat
					</h1>
				</header>

				<div className="web-app-scroll">
					<div className="web-page-wide">
						<div className="web-page-wide-inner">
							<div className="max-w-3xl space-y-5">
								<Button variant="outline" size="sm" asChild>
									<Link to="/dashboard">
										<ArrowLeft className="size-4" />
										Retour au dashboard
									</Link>
								</Button>

								{loading ? (
									<div className="flex items-center justify-center py-20">
										<Loader2 className="size-5 animate-spin text-gray-400" />
									</div>
								) : error ? (
									<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
								) : result ? (
									<div className="space-y-5">
										<div className="flex flex-wrap items-center gap-2">
											{result.collection_method === "api" && (
												<span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
													API
												</span>
											)}
											<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
												result.run_status === "completed"
													? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
													: result.run_status === "failed"
														? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
														: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
											}`}>
												{result.run_status}
											</span>
										</div>

										{result.collection_method === "api" && (
											<div className="flex items-start gap-2 rounded-[var(--app-radius)] border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
												<Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
												<p className="text-[13px] text-amber-700 dark:text-amber-400">
													Resultat collecte via l'API Perplexity Sonar. Le contenu peut differe de l'interface grand public.
												</p>
											</div>
										)}

										{result.error_message && (
											<div className="rounded-[var(--app-radius)] border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-950/20">
												<p className="text-[13px] font-medium text-red-700 dark:text-red-400">Erreur</p>
												<p className="mt-1 text-[13px] text-red-600 dark:text-red-500">{result.error_message}</p>
											</div>
										)}

										<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
											<h2 className="mb-3 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">Prompt</h2>
											<p className="text-sm text-gray-700 dark:text-gray-300">{result.prompt}</p>
										</section>

										<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
											<h2 className="mb-3 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">Reponse</h2>
											{result.response ? (
												<MarkdownRenderer content={result.response} />
											) : (
												<p className="text-sm text-gray-400">Aucune reponse enregistree.</p>
											)}
										</section>

										<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
											<h2 className="mb-3 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">Informations</h2>
											<div className="grid grid-cols-2 gap-3 text-sm">
												<div>
													<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Date</span>
													<p className="text-gray-700 dark:text-gray-300">{formatDateFr(result.prompt_run_at)}</p>
												</div>
												<div>
													<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Fournisseur</span>
													<p className="text-gray-700 dark:text-gray-300">{result.provider}</p>
												</div>
												<div>
													<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Modele</span>
													<p className="text-gray-700 dark:text-gray-300">{result.model}</p>
												</div>
												<div>
													<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Methode</span>
													<p className="text-gray-700 dark:text-gray-300">{result.collection_method}</p>
												</div>
												<div>
													<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">PlayVOD present</span>
													<p className="text-gray-700 dark:text-gray-300">
														{result.brand_mentioned === null ? "Non analyse" : result.brand_mentioned ? "Oui" : "Non"}
													</p>
												</div>
												<div>
													<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Position</span>
													<p className="text-gray-700 dark:text-gray-300">
														{result.brand_position === null ? "Non calculable" : result.brand_position}
													</p>
												</div>
											</div>
										</section>

										{result.usage_data && (
											<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
												<h2 className="mb-3 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">Usage et cout</h2>
												<pre className="overflow-x-auto rounded-[var(--app-radius)] bg-stone-50 p-3 text-xs text-gray-600 dark:bg-neutral-900 dark:text-gray-400">
													{JSON.stringify(result.usage_data, null, 2)}
												</pre>
											</section>
										)}

										{result.sources.length > 0 && (
											<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
												<h2 className="mb-3 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">
													Citations ({result.sources.length})
												</h2>
												<div className="space-y-2">
													{result.sources.map((source, i) => (
														<div key={i} className="rounded-[var(--app-radius)] border border-gray-100 p-3 dark:border-gray-800">
															<div className="flex items-center justify-between gap-2">
																<span className="text-xs font-medium text-gray-500">#{source.position ?? i + 1}</span>
																{source.is_owned_domain && (
																	<span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
																		Domaine propre
																	</span>
																)}
															</div>
															<a
																href={source.url}
																target="_blank"
																rel="noopener noreferrer"
																className="mt-1 flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
															>
																{source.domain || source.url}
																<ExternalLink className="size-3 shrink-0" />
															</a>
															{source.snippet && (
																<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{source.snippet}</p>
															)}
														</div>
													))}
												</div>
											</section>
										)}
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
