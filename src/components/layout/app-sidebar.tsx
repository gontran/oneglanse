import { Favicon } from "@/components/ui/favicon"
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BRAND } from "@/lib/data/brand"
import { Globe, LayoutGrid, MessageSquare, Settings, TrendingUp, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

const navItems = [
	{ title: "Tableau de bord", url: "/dashboard", icon: LayoutGrid, active: true },
	{ title: "Configuration", url: "/configuration", icon: Settings, active: true },
	{ title: "Prompts", url: "#", icon: MessageSquare, active: false, badge: "Bientot disponible" },
	{ title: "Sources", url: "#", icon: Globe, active: false, badge: "Bientot disponible" },
	{ title: "Concurrents", url: "#", icon: Users, active: false, badge: "Bientot disponible" },
	{ title: "Tendances", url: "#", icon: TrendingUp, active: false, badge: "Bientot disponible" },
]

export function AppSidebar() {
	const location = useLocation()
	const pathname = location.pathname

	return (
		<Sidebar className="flex h-full min-h-full flex-col self-stretch bg-white dark:bg-neutral-950">
			<SidebarHeader className="p-3">
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="flex items-center gap-2 rounded-[var(--app-radius)] px-4 py-2.5">
							<Favicon domain={BRAND.domain} name={BRAND.name} size="h-6 w-6" />
							<span className="text-base font-bold tracking-tight text-gray-950 dark:text-gray-50">
								PlayVOD
							</span>
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="flex-1 overflow-y-auto">
				<SidebarGroup>
					<SidebarGroupLabel className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Navigation
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => {
								const isActive = item.active && pathname === item.url
								if (!item.active) {
									return (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												isActive={false}
												disabled
												className="h-11 rounded-[var(--app-radius)] px-4 text-[13px] font-medium opacity-60"
											>
												<item.icon />
												<span>{item.title}</span>
												{item.badge && (
													<span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
														{item.badge}
													</span>
												)}
											</SidebarMenuButton>
										</SidebarMenuItem>
									)
								}
								return (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											className="h-11 rounded-[var(--app-radius)] px-4 text-[13px] font-medium"
										>
											<Link to={item.url}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	)
}
