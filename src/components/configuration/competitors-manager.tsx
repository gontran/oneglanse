import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import type { Competitor } from "@/types/analysis"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"

interface CompetitorsManagerProps {
	competitors: Competitor[]
	onAdd: (name: string, domain: string | null) => Promise<void>
	onUpdate: (id: string, patch: { name?: string; domain?: string | null }) => Promise<void>
	onRemove: (id: string) => Promise<void>
}

export function CompetitorsManager({
	competitors,
	onAdd,
	onUpdate,
	onRemove,
}: CompetitorsManagerProps) {
	const [adding, setAdding] = useState(false)
	const [newName, setNewName] = useState("")
	const [newDomain, setNewDomain] = useState("")
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editName, setEditName] = useState("")
	const [editDomain, setEditDomain] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	const handleAdd = async () => {
		if (!newName.trim()) return
		setBusy(true)
		setError(null)
		try {
			await onAdd(newName, newDomain || null)
			setNewName("")
			setNewDomain("")
			setAdding(false)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de l'ajout.")
		} finally {
			setBusy(false)
		}
	}

	const handleStartEdit = (c: Competitor) => {
		setEditingId(c.id)
		setEditName(c.name)
		setEditDomain(c.domain ?? "")
		setError(null)
	}

	const handleSaveEdit = async (id: string) => {
		setBusy(true)
		setError(null)
		try {
			await onUpdate(id, { name: editName, domain: editDomain || null })
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

	return (
		<div className="space-y-3">
			{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Nom</TableHead>
						<TableHead>Domaine</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{competitors.map((c) => (
						<TableRow key={c.id}>
							{editingId === c.id ? (
								<>
									<TableCell>
										<input
											type="text"
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
										/>
									</TableCell>
									<TableCell>
										<input
											type="text"
											value={editDomain}
											onChange={(e) => setEditDomain(e.target.value)}
											placeholder="exemple.com"
											className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
										/>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleSaveEdit(c.id)}
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
									<TableCell className="font-medium text-gray-800 dark:text-gray-200">
										{c.name}
									</TableCell>
									<TableCell className="text-gray-500 dark:text-gray-400">
										{c.domain ?? "—"}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleStartEdit(c)}
												disabled={busy}
											>
												<Pencil className="size-4 text-gray-500" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleRemove(c.id)}
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
								<input
									type="text"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									placeholder="Nom du concurrent"
									className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
								/>
							</TableCell>
							<TableCell>
								<input
									type="text"
									value={newDomain}
									onChange={(e) => setNewDomain(e.target.value)}
									placeholder="exemple.com"
									className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
								/>
							</TableCell>
							<TableCell className="text-right">
								<div className="flex items-center justify-end gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={handleAdd}
										disabled={busy || !newName.trim()}
									>
										<Check className="size-4 text-green-600" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setAdding(false)
											setNewName("")
											setNewDomain("")
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
					Ajouter un concurrent
				</Button>
			)}
		</div>
	)
}
