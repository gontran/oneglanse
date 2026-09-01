import { getDomain, getFaviconUrls } from "@/lib/utils/favicon"
import { useState } from "react"

interface FaviconProps {
	domain: string
	name?: string
	size?: string
	className?: string
}

function getInitials(name: string): string {
	const parts = name.replace(/^https?:\/\//, "").split(/[.\s-]/)
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase()
	}
	return name.slice(0, 2).toUpperCase()
}

const COLOR_HASHES = [
	"bg-blue-500",
	"bg-emerald-500",
	"bg-amber-500",
	"bg-rose-500",
	"bg-cyan-500",
	"bg-violet-500",
	"bg-teal-500",
]

function getColorForDomain(domain: string): string {
	let h = 0
	for (let i = 0; i < domain.length; i++) {
		h = ((h << 5) - h + domain.charCodeAt(i)) | 0
	}
	return COLOR_HASHES[Math.abs(h) % COLOR_HASHES.length]
}

export function Favicon({ domain, name, size = "h-5 w-5", className = "" }: FaviconProps) {
	const [errored, setErrored] = useState(false)
	const hostname = getDomain(domain) ?? domain
	const faviconUrls = getFaviconUrls(hostname, name ?? "")
	const initials = getInitials(name ?? hostname)
	const bgColor = getColorForDomain(hostname)

	if (errored || faviconUrls.length === 0) {
		return (
			<div
				className={`${size} ${bgColor} shrink-0 rounded-[var(--app-radius)] flex items-center justify-center text-[10px] font-semibold text-white ${className}`}
				aria-label={hostname}
			>
				{initials}
			</div>
		)
	}

	return (
		<img
			src={faviconUrls[0]}
			alt=""
			className={`${size} shrink-0 rounded-[var(--app-radius)] object-contain ${className}`}
			onError={() => setErrored(true)}
		/>
	)
}
