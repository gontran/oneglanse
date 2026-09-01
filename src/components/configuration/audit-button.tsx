import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Play } from "lucide-react"

export function AuditButton({ onClick }: { onClick?: () => void }) {
	const { user } = useAuth()
	const canRun = isDatabaseMode && !!user && !!onClick

	if (!canRun) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button disabled variant="default" size="default" className="cursor-not-allowed opacity-60">
						<Play className="size-4" />
						Lancer un audit
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					<p className="max-w-[260px]">
						{isDatabaseMode
							? "Connectez-vous pour lancer un audit"
							: "Connexion aux moteurs IA prevue a l'etape suivante"}
					</p>
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
