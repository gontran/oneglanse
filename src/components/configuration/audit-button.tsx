import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Play } from "lucide-react"

export function AuditButton() {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button disabled variant="default" size="default" className="cursor-not-allowed opacity-60">
					<Play className="size-4" />
					Lancer un audit
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				<p className="max-w-[260px]">Connexion aux moteurs IA prevue a l'etape suivante</p>
			</TooltipContent>
		</Tooltip>
	)
}
