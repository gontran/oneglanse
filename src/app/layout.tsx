import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import type { Metadata } from "next"
import { ThemeProvider } from "next-themes"
import { Geist } from "next/font/google"

export const metadata: Metadata = {
	title: "PlayVOD - Visibilite IA",
	description: "Dashboard d'audit de visibilite IA pour PlayVOD",
	robots: { index: false, follow: false },
}

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
})

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
	return (
		<html lang="fr" className={geist.variable} suppressHydrationWarning>
			<body>
				<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
					<SidebarProvider defaultOpen>{children}</SidebarProvider>
				</ThemeProvider>
			</body>
		</html>
	)
}
