import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import { Check, Loader2, LogOut } from "lucide-react"
import { useState } from "react"
import { Navigate } from "react-router-dom"

export function ProfilePage() {
	const { user, profile, org, signOut, updateDisplayName, updateOrganizationName } = useAuth()
	const [displayName, setDisplayName] = useState(profile?.display_name ?? "")
	const [orgName, setOrgName] = useState(org?.name ?? "")
	const [savingName, setSavingName] = useState(false)
	const [savingOrg, setSavingOrg] = useState(false)
	const [nameSaved, setNameSaved] = useState(false)
	const [orgSaved, setOrgSaved] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!isDatabaseMode) return <Navigate to="/dashboard" replace />
	if (!user) return <Navigate to="/login" replace />

	const handleSaveName = async () => {
		setSavingName(true)
		setError(null)
		setNameSaved(false)
		const { error } = await updateDisplayName(displayName)
		setSavingName(false)
		if (error) setError(error)
		else {
			setNameSaved(true)
			setTimeout(() => setNameSaved(false), 2500)
		}
	}

	const handleSaveOrg = async () => {
		setSavingOrg(true)
		setError(null)
		setOrgSaved(false)
		const { error } = await updateOrganizationName(orgName)
		setSavingOrg(false)
		if (error) setError(error)
		else {
			setOrgSaved(true)
			setTimeout(() => setOrgSaved(false), 2500)
		}
	}

	const isOwner = org?.role === "owner"

	return (
		<div className="web-app-shell">
			<AppSidebar />
			<main className="web-app-main">
				<header className="web-app-header">
					<SidebarTrigger className="size-8 shrink-0 rounded-none border-transparent bg-transparent p-0 shadow-none hover:bg-transparent dark:hover:bg-transparent" />
					<h1 className="truncate text-[0.95rem] font-medium tracking-[-0.01em] text-gray-950 dark:text-gray-50">
						Profil
					</h1>
				</header>

				<div className="web-app-scroll">
					<div className="web-page-wide">
						<div className="web-page-wide-inner">
							<div className="max-w-lg space-y-6">
								<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
									<h2 className="mb-4 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">
										Compte
									</h2>
									<div className="space-y-3">
										<div className="space-y-1">
											<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Email</span>
											<p className="text-sm text-gray-700 dark:text-gray-300">{user.email}</p>
										</div>
										<div className="space-y-1.5">
											<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Nom affiche</span>
											<div className="flex gap-2">
												<input
													type="text"
													value={displayName}
													onChange={(e) => setDisplayName(e.target.value)}
													className="flex-1 rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
												/>
												<Button onClick={handleSaveName} disabled={savingName}>
													{savingName ? <Loader2 className="size-4 animate-spin" /> : nameSaved ? <Check className="size-4 text-green-500" /> : null}
													{nameSaved ? "OK" : "Enregistrer"}
												</Button>
											</div>
										</div>
									</div>
								</section>

								<section className="rounded-[var(--app-radius)] border border-transparent bg-white p-5 shadow-[0_12px_34px_-24px_rgba(0,0,0,0.22)] dark:bg-neutral-950 dark:shadow-[0_14px_36px_-24px_rgba(0,0,0,0.52)] sm:p-6">
									<h2 className="mb-4 text-[0.95rem] font-semibold text-gray-950 dark:text-gray-50">
										Organisation
									</h2>
									<div className="space-y-3">
										<div className="space-y-1">
											<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Role</span>
											<p className="text-sm text-gray-700 dark:text-gray-300">
												{isOwner ? "Proprietaire" : "Membre"}
											</p>
										</div>
										{isOwner && (
											<div className="space-y-1.5">
												<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Nom de l'organisation</span>
												<div className="flex gap-2">
													<input
														type="text"
														value={orgName}
														onChange={(e) => setOrgName(e.target.value)}
														className="flex-1 rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
													/>
													<Button onClick={handleSaveOrg} disabled={savingOrg}>
														{savingOrg ? <Loader2 className="size-4 animate-spin" /> : orgSaved ? <Check className="size-4 text-green-500" /> : null}
														{orgSaved ? "OK" : "Enregistrer"}
													</Button>
												</div>
											</div>
										)}
										{!isOwner && org && (
											<div className="space-y-1">
												<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Nom</span>
												<p className="text-sm text-gray-700 dark:text-gray-300">{org.name}</p>
											</div>
										)}
									</div>
								</section>

								{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

								<Button
									variant="outline"
									onClick={() => {
						void signOut()
					}}
								>
									<LogOut className="size-4" />
									Se deconnecter
								</Button>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
