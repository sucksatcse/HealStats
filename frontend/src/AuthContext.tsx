import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"

export type ClinicalDesignation =
  | "community_health_worker"
  | "nurse"
  | "clinical_officer"
  | "administrator"

export interface AuthProfile {
  id: string
  name: string
  role: "worker" | "admin"
  clinic_id: string | null
  designation?: ClinicalDesignation | string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: AuthProfile | null
  loading: boolean
  profileResolved: boolean
  signOut: () => Promise<void>
  setDesignation: (designation: ClinicalDesignation) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileResolved: false,
  signOut: async () => {},
  setDesignation: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthProfile | null>(null)
  const [loading, setLoading] = useState(true)
  // True once a staff-profile lookup has finished (found or confirmed absent).
  const [profileResolved, setProfileResolved] = useState(false)

  useEffect(() => {
    let mounted = true
    let profileRequest = 0

    async function fetchProfile(userId: string, currentUser?: User | null) {
      const request = ++profileRequest
      if (mounted) setProfileResolved(false)
      try {
        let { data, error } = await supabase
          .from("staff")
          .select("id, name, role, clinic_id, designation")
          .eq("auth_user_id", userId)
          .limit(1)
          .maybeSingle()

        const u = currentUser ?? user

        // Fallback 1: If not found by auth_user_id, search by matching email
        if (!data && u?.email) {
          const { data: emailMatch } = await supabase
            .from("staff")
            .select("id, name, role, clinic_id, designation")
            .eq("email", u.email.trim())
            .limit(1)
            .maybeSingle()

          if (emailMatch) {
            data = emailMatch
            // Automatically link auth_user_id for future queries
            void supabase.from("staff").update({ auth_user_id: userId }).eq("id", emailMatch.id)
          }
        }

        // Ignore lookups superseded by sign-out or a newer session.
        if (!mounted || request !== profileRequest) return

        if (error && !data) {
          console.error("Error fetching staff profile:", error)
          if (mounted) setProfile(null)
        } else if (data && mounted) {
          const staffRec = data as { id: string; name: string; role: "worker" | "admin"; clinic_id: string | null; designation?: string }
          const metaDesignation = u?.user_metadata?.designation as ClinicalDesignation | undefined

          // Priority resolution:
          // 1. If staff table has an explicit designation (other than default community_health_worker if metadata is nurse or clinical officer)
          let designation: ClinicalDesignation
          if (staffRec.designation && staffRec.designation !== "community_health_worker") {
            designation = staffRec.designation as ClinicalDesignation
          } else if (metaDesignation && (metaDesignation === "nurse" || metaDesignation === "clinical_officer")) {
            designation = metaDesignation
            // Self-heal the database record in the background
            void supabase.from("staff").update({ designation: metaDesignation }).eq("id", staffRec.id)
          } else {
            designation = (staffRec.designation as ClinicalDesignation) || metaDesignation || (staffRec.role === "admin" ? "administrator" : "community_health_worker")
          }

          setProfile({
            id: staffRec.id,
            name: staffRec.name,
            role: staffRec.role,
            clinic_id: staffRec.clinic_id,
            designation,
          })
        } else if (mounted) {
          setProfile(null)
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err)
        if (mounted && request === profileRequest) setProfile(null)
      } finally {
        if (mounted && request === profileRequest) setProfileResolved(true)
      }
    }

    // Initialize session on mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          fetchProfile(currentSession.user.id, currentSession.user).finally(() => {
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
      if (!mounted) return
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id, currentSession.user)
      } else {
        ++profileRequest
        setProfile(null)
        setProfileResolved(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const setDesignation = async (newDesignation: ClinicalDesignation) => {
    try {
      await supabase.auth.updateUser({
        data: { designation: newDesignation },
      })
      if (profile?.id) {
        void supabase.from("staff").update({ designation: newDesignation }).eq("id", profile.id)
      }
      setProfile((prev) => (prev ? { ...prev, designation: newDesignation } : null))
    } catch (err) {
      console.error("Failed to update user designation:", err)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Error during sign out:", err)
    } finally {
      setSession(null)
      setUser(null)
      setProfile(null)
      setProfileResolved(true)
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, profileResolved, signOut, setDesignation }}
    >
      {children}
    </AuthContext.Provider>
  )
}

