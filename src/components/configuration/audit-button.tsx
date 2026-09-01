import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import { Play } from "lucide-react"

export function AuditButton({
	onClick,
	projectExists,
}: {
	onClick?: () => void
	projectExists?: boolean
}) {
	const { user } = useAuth()
	const canRun = isDatabaseMode && !!user && !!onClick && !!projectExists

	if (!canRun) {
		let tooltipMsg: string
		if (!isDatabaseMode) {
			tooltipMsg = "Connexion aux moteurs IA prevue a l'etape suivante"
		} else if (!user) {
			tooltipMsg = "Connectez-vous pour lancer un audit"
		} else {
			tooltipMsg = "Creer un projet avant de lancer un audit"
		}

		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						disabled
						variant="default"
						size="default"
						className="cursor-not-allowed opacity-60"
					>
						<Play className="size-4" />
						Lancer un audit
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p className="max-w-[260px]">{tooltipMsg}</p>
				</TooltipContent>
			</Tooltip>
		)
	}

	return (
		<Button onClick={onClick} variant="default" size="default">
			<Play className="size-4" />
			Lancer un audit
		</Button>
	)
}
