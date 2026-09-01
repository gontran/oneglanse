export function downloadJson(filename: string, data: unknown): void {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	})
	triggerDownload(filename, blob)
}

export function downloadCsv(filename: string, rows: string[][]): void {
	const csv = rows
		.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
		.join("\n")
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
	triggerDownload(filename, blob)
}

function triggerDownload(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}
