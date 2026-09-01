import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Check, Loader as Loader2, Plus } from "lucide-react"
import { useState } from "react"

const COUNTRY_OPTIONS = [
	{ value: "FR", label: "France" },
	{ value: "BE", label: "Belgique" },
	{ value: "CH", label: "Suisse" },
	{ value: "CA", label: "Canada" },
	{ value: "GB", label: "Royaume-Uni" },
	{ value: "US", label: "Etats-Unis" },
	{ value: "ES", label: "Espagne" },
	{ value: "DE", label: "Allemagne" },
	{ value: "IT", label: "Italie" },
	{ value: "other", label: "Autre" },
]

const LANGUAGE_OPTIONS = [
	{ value: "fr", label: "Francais" },
	{ value: "en", label: "Anglais" },
	{ value: "es", label: "Espagnol" },
	{ value: "de", label: "Allemand" },
	{ value: "it", label: "Italien" },
	{ value: "nl", label: "Neerlandais" },
	{ value: "other", label: "Autre" },
]

interface NewProjectFormProps {
	onCreate: (data: {
		name: string
		domain: string
		country: string
		country_custom: string | null
		language: string
		language_custom: string | null
	}) => Promise<void>
}

export function NewProjectForm({ onCreate }: NewProjectFormProps) {
	const [name, setName] = useState("")
	const [domain, setDomain] = useState("")
	const [country, setCountry] = useState("FR")
	const [countryCustom, setCountryCustom] = useState("")
	const [language, setLanguage] = useState("fr")
	const [languageCustom, setLanguageCustom] = useState("")
	const [creating, setCreating] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleCreate = async () => {
		setCreating(true)
		setError(null)
		try {
			const data: {
				name: string
				domain: string
				country: string
				country_custom: string | null
				language: string
				language_custom: string | null
			} = {
				name: name.trim(),
				domain: domain.trim(),
				country,
				country_custom: country === "other" ? countryCustom.trim() || null : null,
				language,
				language_custom: language === "other" ? languageCustom.trim() || null : null,
			}
			if (country === "other" && countryCustom.trim()) {
				data.country = countryCustom.trim().toUpperCase().slice(0, 2)
			}
			if (language === "other" && languageCustom.trim()) {
				data.language = languageCustom.trim().toLowerCase().slice(0, 2)
			}
			await onCreate(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la creation.")
		} finally {
			setCreating(false)
		}
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div className="space-y-1.5">
					<label
						htmlFor="new-project-name"
						className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
					>
						Nom de la marque
					</label>
					<input
						id="new-project-name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Ex: PlayVOD"
						className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-[border-color,box-shadow] focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
					/>
				</div>

				<div className="space-y-1.5">
					<label
						htmlFor="new-project-domain"
						className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
					>
						Domaine principal
					</label>
					<input
						id="new-project-domain"
						type="text"
						value={domain}
						onChange={(e) => setDomain(e.target.value)}
						placeholder="exemple.com"
						className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-[border-color,box-shadow] focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
					/>
				</div>

				<div className="space-y-1.5">
					<span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Pays</span>
					<SearchableSelect
						options={COUNTRY_OPTIONS}
						value={country}
						onValueChange={setCountry}
						placeholder="Selectionner un pays"
						searchPlaceholder="Rechercher un pays..."
					/>
					{country === "other" && (
						<input
							type="text"
							value={countryCustom}
							onChange={(e) => setCountryCustom(e.target.value)}
							placeholder="Code ISO (ex. PT, NL)"
							maxLength={2}
							className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-[border-color,box-shadow] focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
						/>
					)}
				</div>

				<div className="space-y-1.5">
					<span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Langue</span>
					<SearchableSelect
						options={LANGUAGE_OPTIONS}
						value={language}
						onValueChange={setLanguage}
						placeholder="Selectionner une langue"
						searchPlaceholder="Rechercher une langue..."
					/>
					{language === "other" && (
						<input
							type="text"
							value={languageCustom}
							onChange={(e) => setLanguageCustom(e.target.value)}
							placeholder="Code ISO (ex. pt, ja)"
							maxLength={2}
							className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition-[border-color,box-shadow] focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
						/>
					)}
				</div>
			</div>

			{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

			<div className="flex items-center gap-3">
				<Button onClick={handleCreate} disabled={creating || !name.trim() || !domain.trim()}>
					{creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
					{creating ? "Creation..." : "Creer le projet"}
				</Button>
			</div>
		</div>
	)
}
