import { isDatabaseMode, useAuth } from "@/lib/auth/auth-context"
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

export function ProtectedRoute({ children }: { children: ReactNode }) {
	const { user, loading } = useAuth()

	if (!isDatabaseMode) return <>{children}</>

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-sm text-gray-400">Chargement...</p>
			</div>
		)
	}

	if (!user) return <Navigate to="/login" replace />

	return <>{children}</>
}
