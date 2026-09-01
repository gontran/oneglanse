import { SidebarProvider } from "@/components/ui/sidebar"
import { ConfigurationPage } from "@/pages/configuration"
import { DashboardPage } from "@/pages/dashboard"
import { Navigate, Route, Routes } from "react-router-dom"

export function App() {
	return (
		<SidebarProvider defaultOpen>
			<Routes>
				<Route path="/" element={<Navigate to="/dashboard" replace />} />
				<Route path="/dashboard" element={<DashboardPage />} />
				<Route path="/configuration" element={<ConfigurationPage />} />
				<Route path="*" element={<Navigate to="/dashboard" replace />} />
			</Routes>
		</SidebarProvider>
	)
}
