import { Button } from "@/components/ui/button"
import { AUDIT_PROVIDERS } from "@/lib/data/audit-providers"
import { dataService } from "@/lib/services"
import {
	TriangleAlert as AlertTriangle,
	CircleCheck as CheckCircle2,
	Eye,
	EyeOff,
	Key,
	Loader as Loader2,
	Plus,
	Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"

interface KeyStatus {
	configured: boolean
	updatedAt: string | null
}

type KeyStatuses = Record<string, KeyStatus>

export function ProviderKeyManager() {
	const [statuses, setStatuses] = useState<KeyStatuses>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editingProvider, setEditingProvider] = useState<string | null>(null)
	const [keyInput, setKeyInput] = useState("")
	const [showKey, setShowKey] = useState(false)
	const [saving, setSaving] = useState(false)
	const [deletingProvider, setDeletingProvider] = useState<string | null>(null)
	const [successMsg, setSuccessMsg] = useState<string | null>(null)

	const loadStatuses = async () => {
		try {
			const result = await dataService.getProviderKeyStatuses()
			setStatuses(result)
			setError(null)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur de chargement.")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadStatuses()
	}, [])

	const handleSave = async (providerId: string) => {
		if (!keyInput.trim()) return
		setSaving(true)
		setError(null)
		setSuccessMsg(null)
		try {
			await dataService.saveProviderApiKey(providerId, keyInput.trim())
			await loadStatuses()
			setEditingProvider(null)
			setKeyInput("")
			setShowKey(false)
			setSuccessMsg("Cle API enregistree avec succes.")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.")
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (providerId: string) => {
		setDeletingProvider(providerId)
		setError(null)
		setSuccessMsg(null)
		try {
			await dataService.deleteProviderApiKey(providerId)
			await loadStatuses()
			setSuccessMsg("Cle API supprimee.")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la suppression.")
		} finally {
			setDeletingProvider(null)
		}
	}

	const startEdit = (providerId: string) => {
		setEditingProvider(providerId)
		setKeyInput("")
		setShowKey(false)
		setSuccessMsg(null)
	}

	const cancelEdit = () => {
		setEditingProvider(null)
		setKeyInput("")
		setShowKey(false)
	}

	if (loading) {
		return (
			<div className="flex items-center gap-2 py-4 text-sm text-gray-400">
				<Loader2 className="size-4 animate-spin" />
				Chargement...
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="flex items-start gap-2 rounded-[var(--app-radius)] border border-red-200 bg-red-50/60 p-3 dark:border-red-900/50 dark:bg-red-950/20">
					<AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
					<p className="text-[13px] text-red-700 dark:text-red-400">{error}</p>
				</div>
			)}

			{successMsg && (
				<div className="flex items-start gap-2 rounded-[var(--app-radius)] border border-green-200 bg-green-50/60 p-3 dark:border-green-900/50 dark:bg-green-950/20">
					<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
					<p className="text-[13px] text-green-700 dark:text-green-400">{successMsg}</p>
				</div>
			)}

			{AUDIT_PROVIDERS.map((provider) => {
				const status = statuses[provider.id]
				const isConfigured = status?.configured ?? false
				const isEditing = editingProvider === provider.id

				return (
					<div
						key={provider.id}
						className="rounded-[var(--app-radius)] border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
					>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2.5">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--app-radius)] bg-stone-100 dark:bg-neutral-900">
									<Key className="size-4 text-gray-500 dark:text-gray-400" />
								</div>
								<div>
									<p className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
										{provider.label}
									</p>
									<p className="text-[11px] text-gray-400">
										{isConfigured
											? `Configuree${status?.updatedAt ? ` le ${new Date(status.updatedAt).toLocaleDateString("fr-FR")}` : ""}`
											: "Non configuree"}
									</p>
								</div>
							</div>
							{!isEditing && (
								<div className="flex items-center gap-2">
									{isConfigured ? (
										<>
											<Button variant="outline" size="sm" onClick={() => startEdit(provider.id)}>
												Remplacer
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => void handleDelete(provider.id)}
												disabled={deletingProvider === provider.id}
												title="Supprimer la cle"
											>
												{deletingProvider === provider.id ? (
													<Loader2 className="size-4 animate-spin" />
												) : (
													<Trash2 className="size-4 text-red-500" />
												)}
											</Button>
										</>
									) : (
										<Button variant="outline" size="sm" onClick={() => startEdit(provider.id)}>
											<Plus className="size-3.5" />
											Ajouter
										</Button>
									)}
								</div>
							)}
						</div>

						{isEditing && (
							<div className="mt-3 space-y-2">
								<div className="relative">
									<input
										type={showKey ? "text" : "password"}
										value={keyInput}
										onChange={(e) => setKeyInput(e.target.value)}
										placeholder={`Cle API ${provider.label}`}
										className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 pr-10 text-[13px] text-gray-900 outline-none transition-colors focus:border-gray-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-gray-100 dark:focus:border-neutral-600"
										autoComplete="off"
										spellCheck={false}
									/>
									<button
										type="button"
										onClick={() => setShowKey((v) => !v)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
										title={showKey ? "Masquer" : "Afficher"}
									>
										{showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
									</button>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										onClick={() => void handleSave(provider.id)}
										disabled={!keyInput.trim() || saving}
									>
										{saving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
									</Button>
									<Button variant="outline" size="sm" onClick={cancelEdit}>
										Annuler
									</Button>
								</div>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}
