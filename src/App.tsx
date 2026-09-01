import { ProtectedRoute } from "@/components/auth/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ConfigurationPage } from "@/pages/configuration"
import { DashboardPage } from "@/pages/dashboard"
import { LoginPage } from "@/pages/login"
import { ProfilePage } from "@/pages/profile"
import { ResultDetailPage } from "@/pages/result-detail"
import { SignupPage } from "@/pages/signup"
import { Navigate, Route, Routes } from "react-router-dom"

export function App() {
	return (
		<SidebarProvider defaultOpen>
			<Routes>
				<Route path="/" element={<Navigate to="/dashboard" replace />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<SignupPage />} />
				<Route
					path="/dashboard"
					element={
						<ProtectedRoute>
							<DashboardPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/configuration"
					element={
						<ProtectedRoute>
							<ConfigurationPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/profile"
					element={
						<ProtectedRoute>
							<ProfilePage />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/results/:resultId"
					element={
						<ProtectedRoute>
							<ResultDetailPage />
						</ProtectedRoute>
					}
				/>
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		</SidebarProvider>
	)
}
