export function formatDateFr(dateStr: string): string {
	const d = new Date(dateStr)
	const day = String(d.getDate()).padStart(2, "0")
	const month = String(d.getMonth() + 1).padStart(2, "0")
	const year = d.getFullYear()
	const hours = String(d.getHours()).padStart(2, "0")
	const minutes = String(d.getMinutes()).padStart(2, "0")
	return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function formatDateShortFr(dateStr: string): string {
	const d = new Date(dateStr)
	const day = String(d.getDate()).padStart(2, "0")
	const month = String(d.getMonth() + 1).padStart(2, "0")
	return `${day}/${month}`
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value)
}

export function formatPercent(value: number): string {
	return `${Math.round(value)}%`
}

export function formatScore(value: number): string {
	return Math.round(value).toString()
}

export function formatCitationLabel(count: number): string {
	if (count === 1) return "1 citation"
	return `${count} citations`
}
