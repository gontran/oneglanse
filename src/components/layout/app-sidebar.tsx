import { AppLogo } from "@/components/ui/app-logo"
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
import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import { dataService } from "@/lib/services"
import {
	Globe,
	LayoutGrid,
	LogOut,
	MessageSquare,
	Settings,
	TrendingUp,
	User,
	Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

const navItems = [
	{ title: "Tableau de bord", url: "/dashboard", icon: LayoutGrid, active: true },
	{ title: "Configuration", url: "/configuration", icon: Settings, active: true },
	{ title: "Profil", url: "/profile", icon: User, active: isDatabaseMode },
	{ title: "Prompts", url: "#", icon: MessageSquare, active: false, badge: "Bientot disponible" },
	{ title: "Sources", url: "#", icon: Globe, active: false, badge: "Bientot disponible" },
	{ title: "Concurrents", url: "#", icon: Users, active: false, badge: "Bientot disponible" },
	{ title: "Tendances", url: "#", icon: TrendingUp, active: false, badge: "Bientot disponible" },
]

export function AppSidebar() {
	const location = useLocation()
	const pathname = location.pathname
	const navigate = useNavigate()
	const { user, signOut, profile } = useAuth()
	const [projectName, setProjectName] = useState<string | null>(null)
	const [projectDomain, setProjectDomain] = useState<string | null>(null)

	useEffect(() => {
		if (!isDatabaseMode) return
		let cancelled = false
		const loadProject = async () => {
			try {
				const project = await dataService.getProject()
				if (!cancelled) {
					setProjectName(project.name)
					setProjectDomain(project.domain)
				}
			} catch {
				if (!cancelled) {
					setProjectName(null)
					setProjectDomain(null)
				}
			}
		}
		loadProject()
		const onProjectChange = () => {
			if (!cancelled) loadProject()
		}
		window.addEventListener("playvod:active-project-changed", onProjectChange)
		return () => {
			cancelled = true
			window.removeEventListener("playvod:active-project-changed", onProjectChange)
		}
	}, [pathname])

	const handleSignOut = async () => {
		await signOut()
		navigate("/login")
	}

	return (
		<Sidebar className="flex h-full min-h-full flex-col self-stretch bg-white dark:bg-neutral-950">
			<SidebarHeader className="p-3">
				<SidebarMenu>
					<SidebarMenuItem>
						<div className="px-4 py-2.5">
							<AppLogo size="h-6 w-6" />
						</div>
					</SidebarMenuItem>
				</SidebarMenu>
				{projectName && (
					<div className="mt-1 flex items-center gap-2 rounded-[var(--app-radius)] border border-gray-100 bg-stone-50 px-3 py-2 dark:border-gray-800 dark:bg-neutral-900">
						{projectDomain && (
							<Favicon domain={projectDomain} name={projectName} size="h-4 w-4" />
						)}
						<div className="min-w-0">
							<p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
								Site analyse
							</p>
							<p className="truncate text-[13px] font-semibold text-gray-700 dark:text-gray-300">
								{projectName}
							</p>
						</div>
					</div>
				)}
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
				{isDatabaseMode && user && (
					<div className="mt-auto border-t border-gray-100 p-3 dark:border-gray-800">
						<div className="flex items-center justify-between gap-2 rounded-[var(--app-radius)] px-3 py-2">
							<div className="min-w-0">
								<p className="truncate text-[12px] font-medium text-gray-700 dark:text-gray-300">
									{profile?.display_name || user.email}
								</p>
								{profile?.display_name && (
									<p className="truncate text-[10px] text-gray-400">{user.email}</p>
								)}
							</div>
							<button
								type="button"
								onClick={() => void handleSignOut()}
								className="shrink-0 rounded-[var(--app-radius)] p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
							>
								<LogOut className="size-4" />
							</button>
						</div>
					</div>
				)}
			</SidebarContent>
		</Sidebar>
	)
}
