import { cn } from "@/lib/utils/cn"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface SearchableSelectOption {
	value: string
	label: string
}

interface SearchableSelectProps {
	options: SearchableSelectOption[]
	value: string
	onValueChange: (value: string) => void
	placeholder?: string
	searchPlaceholder?: string
	className?: string
}

export function SearchableSelect({
	options,
	value,
	onValueChange,
	placeholder = "Selectionner...",
	searchPlaceholder = "Rechercher...",
	className,
}: SearchableSelectProps) {
	const [search, setSearch] = useState("")
	const [open, setOpen] = useState(false)

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return options
		return options.filter((o) => o.label.toLowerCase().includes(q))
	}, [options, search])

	const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

	return (
		<Select
			open={open}
			onOpenChange={(v) => {
				setOpen(v)
				if (!v) setSearch("")
			}}
			value={value}
			onValueChange={(v) => {
				onValueChange(v)
				setOpen(false)
				setSearch("")
			}}
		>
			<SelectTrigger className={cn("w-full", className)}>
				<SelectValue>{selectedLabel}</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<div className="sticky top-0 z-10 bg-white p-1 dark:bg-neutral-950">
					<div className="flex items-center gap-2 rounded-[var(--app-radius)] border border-gray-200 bg-stone-50 px-2.5 py-1.5 dark:border-gray-700 dark:bg-neutral-900">
						<Search className="size-3.5 shrink-0 text-gray-400" />
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={searchPlaceholder}
							className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
							onKeyDown={(e) => {
								if (e.key === "Escape") {
									e.preventDefault()
									setOpen(false)
									setSearch("")
								}
							}}
						/>
					</div>
				</div>
				<SelectPrimitive.Viewport className="p-1">
					{filtered.length === 0 ? (
						<div className="py-4 text-center text-sm text-gray-400">Aucun resultat</div>
					) : (
						filtered.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))
					)}
				</SelectPrimitive.Viewport>
			</SelectContent>
		</Select>
	)
}
