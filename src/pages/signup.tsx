import { AppLogo } from "@/components/ui/app-logo"
import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import { Loader as Loader2 } from "lucide-react"
import { useState } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"

export function SignupPage() {
	const { signUp } = useAuth()
	const navigate = useNavigate()
	const [displayName, setDisplayName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [busy, setBusy] = useState(false)

	if (!isDatabaseMode) return <Navigate to="/dashboard" replace />

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (password !== confirm) {
			setError("Les mots de passe ne correspondent pas.")
			return
		}
		if (password.length < 6) {
			setError("Le mot de passe doit contenir au moins 6 caracteres.")
			return
		}
		setBusy(true)
		setError(null)
		const { error } = await signUp(email, password, displayName)
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
					<AppLogo size="h-10 w-10" showText={false} />
					<span className="text-lg font-bold tracking-tight text-gray-950 dark:text-gray-50">
						Audit Visibilite IA
					</span>
				</div>

				<div className="rounded-[var(--app-radius)] border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-neutral-900">
					<h1 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
						Creer un compte
					</h1>
					<form onSubmit={handleSubmit} className="space-y-3">
						<div className="space-y-1.5">
							<label
								htmlFor="display-name"
								className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
							>
								Nom affiche (facultatif)
							</label>
							<input
								id="display-name"
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Ex. Jean Dupont"
								className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
							/>
						</div>
						<div className="space-y-1.5">
							<label
								htmlFor="signup-email"
								className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
							>
								Email
							</label>
							<input
								id="signup-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
							/>
						</div>
						<div className="space-y-1.5">
							<label
								htmlFor="signup-password"
								className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
							>
								Mot de passe
							</label>
							<input
								id="signup-password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={6}
								className="w-full rounded-[var(--app-radius)] border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-neutral-900 dark:text-gray-200"
							/>
						</div>
						<div className="space-y-1.5">
							<label
								htmlFor="confirm-password"
								className="text-[13px] font-medium text-gray-700 dark:text-gray-300"
							>
								Confirmer le mot de passe
							</label>
							<input
								id="confirm-password"
								type="password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
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
							Creer mon compte
						</button>
					</form>
				</div>

				<p className="text-center text-sm text-gray-500 dark:text-gray-400">
					Deja un compte ?{" "}
					<Link to="/login" className="font-medium text-gray-700 underline dark:text-gray-300">
						Se connecter
					</Link>
				</p>
			</div>
		</div>
	)
}
