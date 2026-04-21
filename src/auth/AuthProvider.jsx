import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasSupabase } from '../lib/supabase.js'

const AuthCtx = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  hasSupabase: false,
  signIn: async () => {},
  signOut: async () => {},
  signInDemo: () => {},
})

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoUser, setDemoUser] = useState(null) // fallback sin Supabase

  useEffect(() => {
    if (!hasSupabase) {
      // Modo demo · intenta restaurar sesión simulada desde localStorage
      const raw = localStorage.getItem('everhealth_demo_user')
      if (raw) {
        try { setDemoUser(JSON.parse(raw)) } catch {}
      }
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .maybeSingle()
        if (active) setProfile(p || metadataProfile(data.session.user))
      }
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', s.user.id)
          .maybeSingle()
        setProfile(p || metadataProfile(s.user))
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signIn({ email, password }) {
    if (!hasSupabase) throw new Error('Supabase no configurado')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (hasSupabase) await supabase.auth.signOut()
    localStorage.removeItem('everhealth_demo_user')
    setDemoUser(null)
    setSession(null)
    setProfile(null)
  }

  function signInDemo({ role = 'director', sub_role, full_name, email }) {
    const user = { role, sub_role, full_name, email, demo: true }
    localStorage.setItem('everhealth_demo_user', JSON.stringify(user))
    setDemoUser(user)
  }

  const user = session?.user || demoUser || null
  const effectiveProfile = profile || demoUser || null

  return (
    <AuthCtx.Provider value={{
      session,
      user,
      profile: effectiveProfile,
      loading,
      hasSupabase,
      signIn,
      signOut,
      signInDemo,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }

function metadataProfile(user) {
  const m = user.user_metadata || {}
  return {
    id: user.id,
    email: user.email,
    full_name: m.full_name || user.email,
    role: m.role || 'paciente',
    sub_role: m.sub_role || null,
  }
}
