import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"

interface AuthProfile {
  id: string
  name: string
  role: "worker" | "admin"
  clinic_id: string | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  signOut: () => Promise<void>
  loginDemoUser: () => void
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  loginDemoUser: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Demo bypass flag
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (isDemo) return

    let mounted = true

    async function fetchProfile(userId: string) {
      try {
        const { data, error } = await supabase
          .from("staff")
          .select("id, name, role, clinic_id")
          .eq("auth_user_id", userId)
          .single()

        if (error) {
          console.error("Error fetching staff profile:", error)
          if (mounted) setProfile(null)
        } else if (data && mounted) {
          setProfile(data as AuthProfile)
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err)
      }
    }

    // Initialize session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id).finally(() => {
            if (mounted) setLoading(false)
          })
        } else {
          setLoading(false)
        }
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted || isDemo) return
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isDemo])

  const loginDemoUser = () => {
    setIsDemo(true)
    setSession({} as Session)
    setUser({ id: "demo-user-id" } as User)
    setProfile({
      id: "demo-staff-id",
      name: "Test Worker (Demo)",
      role: "worker",
      clinic_id: "11111111-1111-1111-1111-111111111111",
    })
    setLoading(false)

    // Writes (e.g. visits.staff_id) need a real staff.id; hydrate from the seeded demo row if present.
    supabase
      .from("staff")
      .select("id, name, role, clinic_id")
      .eq("email", "worker@clinic.org")
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return
        setProfile({ ...(data as AuthProfile), name: `${data.name} (Demo)` })
      })
  }

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false)
      setSession(null)
      setUser(null)
      setProfile(null)
    } else {
      await supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signOut, loginDemoUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
