"use client"

import { useState } from "react"

export function useSortState<C extends string>(initialDirection: "asc" | "desc" = "asc") {
	const [sortColumn, setSortColumn] = useState<C | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">(initialDirection)

	const toggleSort = (column: C) => {
		if (sortColumn === column) {
			setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
		} else {
			setSortColumn(column)
			setSortDirection("asc")
		}
	}

	return { sortColumn, sortDirection, toggleSort }
}
