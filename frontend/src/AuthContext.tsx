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
  profileResolved: boolean
  signOut: () => Promise<void>
  loginDemoUser: () => Promise<void>
  loginDemoAdmin: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileResolved: false,
  signOut: async () => {},
  loginDemoUser: async () => {},
  loginDemoAdmin: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  // True once a staff-profile lookup has finished (found or confirmed absent).
  const [profileResolved, setProfileResolved] = useState(false)

  // Demo bypass flag
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (isDemo) return

    let mounted = true

    async function fetchProfile(userId: string) {
      if (mounted) setProfileResolved(false)
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
        if (mounted) setProfile(null)
      } finally {
        if (mounted) setProfileResolved(true)
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
          setProfileResolved(true)
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
        setProfileResolved(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isDemo])

  const loginDemoAdmin = async () => {
    // Instant client-side demo bypass (dev/exhibition only). Kept network-free so
    // it is deterministic and works offline; real staff use signInWithPassword.
    setIsDemo(true)
    setSession({} as Session)
    setUser({ id: "admin-bypass-id" } as User)
    setProfile({
      id: "admin-bypass-staff-id",
      name: "System Admin",
      role: "admin",
      clinic_id: null, // null = access to all clinics (system-level admin)
    })
    setProfileResolved(true)
    setLoading(false)

    // Attempt to hydrate from DB if the seeded admin staff row exists
    supabase
      .from("staff")
      .select("id, name, role, clinic_id")
      .eq("email", "admin@healstats.org")
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data as AuthProfile)
      })
  }

  const loginDemoUser = async () => {
    // Instant client-side demo bypass (dev/exhibition only). Kept network-free so
    // it is deterministic and works offline; real staff use signInWithPassword.
    setIsDemo(true)
    setSession({} as Session)
    setUser({ id: "demo-user-id" } as User)
    setProfile({
      id: "demo-staff-id",
      name: "Test Worker (Demo)",
      role: "worker",
      clinic_id: "11111111-1111-1111-1111-111111111111",
    })
    setProfileResolved(true)
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
      setProfileResolved(true)
    } else {
      await supabase.auth.signOut()
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, profileResolved, signOut, loginDemoUser, loginDemoAdmin }}
    >
      {children}
    </AuthContext.Provider>
  )
}
