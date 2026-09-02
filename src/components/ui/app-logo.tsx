interface AppLogoProps {
	size?: string
	showText?: boolean
	className?: string
}

export function AppLogo({ size = "h-7 w-7", showText = true, className = "" }: AppLogoProps) {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<img
				src="/audit-logo.webp"
				alt="Logo"
				className={`${size} shrink-0 rounded-[var(--app-radius)] object-contain`}
			/>
			{showText && (
				<span className="text-base font-bold tracking-tight text-gray-950 dark:text-gray-50">
					Audit Visibilite IA
				</span>
			)}
		</div>
	)
}
