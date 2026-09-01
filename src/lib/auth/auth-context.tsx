import { createClient, type Session, type User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
})

interface OrgInfo {
	id: string
	name: string
	role: string
}

interface AuthContextValue {
	session: Session | null
	user: User | null
	profile: { display_name: string | null } | null
	org: OrgInfo | null
	loading: boolean
	signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>
	signIn: (email: string, password: string) => Promise<{ error: string | null }>
	signOut: () => Promise<void>
	updateDisplayName: (name: string) => Promise<{ error: string | null }>
	updateOrganizationName: (name: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null)
	const [user, setUser] = useState<User | null>(null)
	const [profile, setProfile] = useState<{ display_name: string | null } | null>(null)
	const [org, setOrg] = useState<OrgInfo | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false

		const loadProfileAndOrg = async (uid: string) => {
			try {
				const { data: profileData } = await supabase
					.from("user_profiles")
					.select("display_name")
					.eq("id", uid)
					.maybeSingle()
				if (cancelled) return
				setProfile(profileData as { display_name: string | null } | null)

				const { data: memberData } = await supabase
					.from("organization_members")
					.select("id, organization_id, role, organization_id")
					.eq("user_id", uid)
					.maybeSingle()
				if (cancelled) return

				if (memberData) {
					const { data: orgData } = await supabase
						.from("organizations")
						.select("id, name")
						.eq("id", (memberData as { organization_id: string }).organization_id)
						.maybeSingle()
					if (cancelled) return
					setOrg({
						id: (orgData as { id: string }).id,
						name: (orgData as { name: string }).name,
						role: (memberData as { role: string }).role,
					})
				}
			} catch {
				// Profile/org might not exist yet — that's OK
			}
		}

		supabase.auth.getSession().then(({ data }) => {
			if (cancelled) return
			setSession(data.session)
			setUser(data.session?.user ?? null)
			if (data.session?.user) {
				loadProfileAndOrg(data.session.user.id).finally(() => {
					if (!cancelled) setLoading(false)
				})
			} else {
				setLoading(false)
			}
		})

		const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
			;(async () => {
				if (cancelled) return
				setSession(newSession)
				setUser(newSession?.user ?? null)
				setProfile(null)
				setOrg(null)
				if (newSession?.user) {
					await loadProfileAndOrg(newSession.user.id)
				}
				setLoading(false)
			})()
		})

		return () => {
			cancelled = true
			authListener.subscription.unsubscribe()
		}
	}, [])

	const signUp: AuthContextValue["signUp"] = async (email, password, displayName) => {
		const { data, error } = await supabase.auth.signUp({ email, password })
		if (error) return { error: error.message }
		if (!data.user) return { error: "Erreur lors de la creation du compte." }

		const { data: rpcData, error: rpcError } = await supabase.rpc("create_user_account", {
			display_name: displayName || null,
		})
		if (rpcError) {
			return { error: "Compte cree mais l'organisation n'a pas pu etre initialisee. Reessayez en vous reconnectant." }
		}
		const result = rpcData as { organization_id: string; organization_name: string }[]
		if (result && result.length > 0) {
			setOrg({ id: result[0].organization_id, name: result[0].organization_name, role: "owner" })
		}
		setProfile({ display_name: displayName || null })
		return { error: null }
	}

	const signIn: AuthContextValue["signIn"] = async (email, password) => {
		const { error } = await supabase.auth.signInWithPassword({ email, password })
		if (error) return { error: error.message }
		return { error: null }
	}

	const signOut: AuthContextValue["signOut"] = async () => {
		await supabase.auth.signOut()
		setProfile(null)
		setOrg(null)
	}

	const updateDisplayName: AuthContextValue["updateDisplayName"] = async (name) => {
		if (!user) return { error: "Non connecte." }
		const { error } = await supabase
			.from("user_profiles")
			.update({ display_name: name })
			.eq("id", user.id)
		if (error) return { error: error.message }
		setProfile({ display_name: name })
		return { error: null }
	}

	const updateOrganizationName: AuthContextValue["updateOrganizationName"] = async (name) => {
		if (!org) return { error: "Aucune organisation." }
		const { error } = await supabase
			.from("organizations")
			.update({ name })
			.eq("id", org.id)
		if (error) return { error: error.message }
		setOrg({ ...org, name })
		return { error: null }
	}

	return (
		<AuthContext.Provider
			value={{ session, user, profile, org, loading, signUp, signIn, signOut, updateDisplayName, updateOrganizationName }}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used within AuthProvider")
	return ctx
}

export const isDatabaseMode = import.meta.env.VITE_DATA_SOURCE === "database"
