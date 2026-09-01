import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { ProjectPrompt } from "@/types/analysis"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

const CATEGORY_OPTIONS = [
	{ value: "comparison", label: "Comparaison" },
	{ value: "alternative", label: "Alternative" },
	{ value: "legal", label: "Legal" },
	{ value: "pricing", label: "Tarification" },
	{ value: "brand-specific", label: "Specifique marque" },
	{ value: "general", label: "General" },
]

const INTENT_OPTIONS = [
	{ value: "informational", label: "Informationnel" },
	{ value: "transactional", label: "Transactionnel" },
	{ value: "navigational", label: "Navigationnel" },
]

interface PromptsManagerProps {
	prompts: ProjectPrompt[]
	onAdd: (data: Omit<ProjectPrompt, "id">) => Promise<void>
	onUpdate: (id: string, patch: Partial<Omit<ProjectPrompt, "id">>) => Promise<void>
	onRemove: (id: string) => Promise<void>
	onToggle: (id: string, isActive: boolean) => Promise<void>
}

interface EditState {
	text: string
	category: string
	intent: string
	persona: string
}

export function PromptsManager({
	prompts,
	onAdd,
	onUpdate,
	onRemove,
	onToggle,
}: PromptsManagerProps) {
	const [adding, setAdding] = useState(false)
	const [newText, setNewText] = useState("")
	const [newCategory, setNewCategory] = useState("comparison")
	const [newIntent, setNewIntent] = useState("informational")
	const [newPersona, setNewPersona] = useState("")
	const [editingId, setEditingId] = useState<string | null>(null)
	const [edit, setEdit] = useState<EditState>({ text: "", category: "", intent: "", persona: "" })
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	const handleAdd = async () => {
		if (!newText.trim()) return
		setBusy(true)
		setError(null)
		try {
			await onAdd({
				text: newText.trim(),
				category: newCategory,
				intent: newIntent,
				persona: newPersona.trim() || null,
				is_active: true,
				sort_order: prompts.length,
			})
			setNewText("")
			setNewPersona("")
			setAdding(false)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'ajout.")
		} finally {
			setBusy(false)
		}
	}

	const handleStartEdit = (p: ProjectPrompt) => {
		setEditingId(p.id)
		setEdit({
			text: p.text,
			category: p.category,
			intent: p.intent,
			persona: p.persona ?? "",
		})
		setError(null)
	}

	const handleSaveEdit = async (id: string) => {
		setBusy(true)
		setError(null)
		try {
			await onUpdate(id, {
				text: edit.text.trim(),
				category: edit.category,
				intent: edit.intent,
				persona: edit.persona.trim() || null,
			})
			setEditingId(null)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la modification.")
		} finally {
			setBusy(false)
		}
	}

	const handleRemove = async (id: string) => {
		setBusy(true)
		setError(null)
		try {
			await onRemove(id)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la suppression.")
		} finally {
			setBusy(false)
		}
	}

	const handleToggle = async (id: string, isActive: boolean) => {
		setBusy(true)
		setError(null)
		try {
			await onToggle(id, isActive)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors du changement d'etat.")
		} finally {
			setBusy(false)
		}
	}

	const categoryLabel = (val: string) => CATEGORY_OPTIONS.find((c) => c.value === val)?.label ?? val
	const intentLabel = (val: string) => INTENT_OPTIONS.find((i) => i.value === val)?.label ?? val

	return (
		<div className="space-y-3">
			{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="min-w-[200px]">Prompt</TableHead>
						<TableHead>Categorie</TableHead>
						<TableHead>Intention</TableHead>
						<TableHead>Persona</TableHead>
						<TableHead>Actif</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{prompts.map((p) => (
						<TableRow key={p.id}>
							{editingId === p.id ? (
								<>
									<TableCell>
										<textarea
											value={edit.text}
											onChange={(e) => setEdit({ ...edit, text: e.target.value })}
											rows={2}
											className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
										/>
									</TableCell>
									<TableCell>
										<Select
											value={edit.category}
											onValueChange={(v) => setEdit({ ...edit, category: v })}
										>
											<SelectTrigger className="min-w-[120px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{CATEGORY_OPTIONS.map((c) => (
													<SelectItem key={c.value} value={c.value}>
														{c.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<Select
											value={edit.intent}
											onValueChange={(v) => setEdit({ ...edit, intent: v })}
										>
											<SelectTrigger className="min-w-[120px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{INTENT_OPTIONS.map((i) => (
													<SelectItem key={i.value} value={i.value}>
														{i.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<input
											type="text"
											value={edit.persona}
											onChange={(e) => setEdit({ ...edit, persona: e.target.value })}
											placeholder="Facultatif"
											className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
										/>
									</TableCell>
									<TableCell />
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleSaveEdit(p.id)}
												disabled={busy}
											>
												<Check className="size-4 text-green-600" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setEditingId(null)}
												disabled={busy}
											>
												<X className="size-4 text-gray-400" />
											</Button>
										</div>
									</TableCell>
								</>
							) : (
								<>
									<TableCell
										className="max-w-[320px] truncate text-gray-700 dark:text-gray-300"
										title={p.text}
									>
										{p.text}
									</TableCell>
									<TableCell className="text-gray-500 dark:text-gray-400">
										{categoryLabel(p.category)}
									</TableCell>
									<TableCell className="text-gray-500 dark:text-gray-400">
										{intentLabel(p.intent)}
									</TableCell>
									<TableCell className="text-gray-500 dark:text-gray-400">
										{p.persona ?? "—"}
									</TableCell>
									<TableCell>
										<button
											type="button"
											onClick={() => handleToggle(p.id, !p.is_active)}
											disabled={busy}
											className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
												p.is_active ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"
											}`}
										>
											<span
												className={`inline-block size-4 transform rounded-full bg-white transition-transform duration-200 ${
													p.is_active ? "translate-x-4" : "translate-x-0.5"
												}`}
											/>
										</button>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleStartEdit(p)}
												disabled={busy}
											>
												<Pencil className="size-4 text-gray-500" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleRemove(p.id)}
												disabled={busy}
											>
												<Trash2 className="size-4 text-red-500" />
											</Button>
										</div>
									</TableCell>
								</>
							)}
						</TableRow>
					))}

					{adding && (
						<TableRow>
							<TableCell>
								<textarea
									value={newText}
									onChange={(e) => setNewText(e.target.value)}
									rows={2}
									placeholder="Saisir le prompt..."
									className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
								/>
							</TableCell>
							<TableCell>
								<Select value={newCategory} onValueChange={setNewCategory}>
									<SelectTrigger className="min-w-[120px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CATEGORY_OPTIONS.map((c) => (
											<SelectItem key={c.value} value={c.value}>
												{c.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</TableCell>
							<TableCell>
								<Select value={newIntent} onValueChange={setNewIntent}>
									<SelectTrigger className="min-w-[120px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{INTENT_OPTIONS.map((i) => (
											<SelectItem key={i.value} value={i.value}>
												{i.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</TableCell>
							<TableCell>
								<input
									type="text"
									value={newPersona}
									onChange={(e) => setNewPersona(e.target.value)}
									placeholder="Facultatif"
									className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
								/>
							</TableCell>
							<TableCell />
							<TableCell className="text-right">
								<div className="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={handleAdd}
										disabled={busy || !newText.trim()}
									>
										<Check className="size-4 text-green-600" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setAdding(false)
											setNewText("")
											setNewPersona("")
										}}
										disabled={busy}
									>
										<X className="size-4 text-gray-400" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>

			{!adding && (
				<Button variant="outline" size="sm" onClick={() => setAdding(true)}>
					<Plus className="size-4" />
					Ajouter un prompt
				</Button>
			)}
		</div>
	)
}
