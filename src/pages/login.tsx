import { Favicon } from "@/components/ui/favicon"
import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import { BRAND } from "@/lib/data/brand"
import { Loader as Loader2 } from "lucide-react"
import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

export function LoginPage() {
	const { signIn } = useAuth()
	const navigate = useNavigate()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	if (!isDatabaseMode) return <Navigate to="/dashboard" replace />

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setBusy(true)
		setError(null)
		const { error } = await signIn(email, password)
		setBusy(false)
		if (error) {
			setError(error)
		} else {
			navigate("/dashboard")
		}
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 dark:bg-neutral-950">
			<div className="w-full max-w-sm space-y-6">
				<div className="flex flex-col items-center gap-2">
					<Favicon domain={BRAND.domain} name={BRAND.name} size="h-10 w-10" />
					<span className="text-lg font-bold tracking-tight text-gray-950 dark:text-gray-50">
						PlayVOD
					</span>
				</div>

				<div className="rounded-[var(--app-radius)] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
					<h1 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
						Connexion
					</h1>
					<form onSubmit={handleSubmit} className="space-y-3">
						<div className="space-y-1.5">
							<label
								htmlFor="email"
								className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
							/>
						</div>
						<div className="space-y-1.5">
							<label
								htmlFor="password"
								className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
							>
								Mot de passe
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
							/>
						</div>
						{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
						<button
							type="submit"
							disabled={busy}
							className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-60 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
						>
							{busy && <Loader2 className="size-4 animate-spin" />}
							Se connecter
						</button>
					</form>
				</div>

				<p className="text-center text-sm text-gray-500 dark:text-gray-400">
					Pas encore de compte ?{" "}
					<Link to="/signup" className="font-medium text-gray-700 underline dark:text-gray-300">
						Creer un compte
					</Link>
				</p>
			</div>
		</div>
	)
}
