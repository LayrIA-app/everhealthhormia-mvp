import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx'
import Login from './auth/Login.jsx'

// AdminPanel lazy · separa jsPDF + html2canvas del bundle principal
const AdminPanel = lazy(() => import('./admin/AdminPanel.jsx'))

// Routing mínimo sin react-router. Suficiente mientras el iframe sea el shell.
function getRoute() {
  if (typeof window === 'undefined') return 'shell'
  const p = window.location.pathname
  if (p.startsWith('/admin')) return 'admin'
  return 'shell'
}

/**
 * EverHealthHormIA · Fase 3 shell
 *
 * Flujo:
 *  1. AuthProvider arranca y comprueba sesion Supabase (o modo demo localStorage).
 *  2. Sin sesion → <Login /> React (real o demo segun hasSupabase).
 *  3. Con sesion → <ShellFrame /> que embebe demo.html y auto-navega al rol correcto
 *     via iframe.contentWindow.selectRole / doLogin.
 *  4. Boton logout fijo en esquina para volver al login.
 *
 * La demo HTML sigue siendo fuente de verdad visual. Los hooks Supabase/Claude/Resend
 * se exponen para que, a medida que extraigamos pantallas a componentes React,
 * puedan conectarse a datos reales.
 */
export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate() {
  const { user, loading } = useAuth()
  const [route, setRoute] = useState(getRoute())

  useEffect(() => {
    document.title = 'EverHealthHormIA — MVP'
    const onPop = () => setRoute(getRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (loading) return <LoadingScreen />
  if (!user) return <Login />
  if (route === 'admin') return (
    <Suspense fallback={<LoadingScreen />}>
      <AdminPanel />
    </Suspense>
  )
  return <ShellFrame />
}

function LoadingScreen() {
  return (
    <div className="app-loader">
      <div className="app-loader-logo">EverHealth<span>HormIA</span></div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div className="app-loader-dot" />
        <div className="app-loader-sub">Cargando ecosistema IA</div>
      </div>
    </div>
  )
}

const ROLE_TO_CARD = { director:0, inversor:0, medico:1, coordinador:1, paciente:2, laboratorio:3 }
const SUB_ROLE_INDEX = {
  director:0, inversor:1,
  medico:0, coordinador:1,
  paciente:0,
  laboratorio:0, partner:1,
}

function ShellFrame() {
  const { profile, user, signOut } = useAuth()
  const frameRef = useRef(null)
  const [ready, setReady] = useState(false)

  const role = (profile?.role || 'paciente').toLowerCase()
  const sub = (profile?.sub_role || role).toLowerCase()

  function autoLogin() {
    const win = frameRef.current?.contentWindow
    if (!win) return
    // La demo HTML expone selectRole / renderLoginPanel / doLogin globales.
    try {
      const cardIdx = ROLE_TO_CARD[role] ?? 0
      const subIdx = SUB_ROLE_INDEX[sub] ?? 0
      if (typeof win.selectRole === 'function') win.selectRole(cardIdx)
      if (typeof win.renderLoginPanel === 'function') win.renderLoginPanel(subIdx)
      if (typeof win.doLogin === 'function') win.doLogin()
    } catch (err) {
      // Si la demo no se inicializa a tiempo, reintenta en 400ms
      setTimeout(autoLogin, 400)
    }
  }

  return (
    <>
      <div className={`app-loader${ready ? ' fade' : ''}`} aria-hidden={ready}>
        <div className="app-loader-logo">EverHealth<span>HormIA</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div className="app-loader-dot" />
          <div className="app-loader-sub">Iniciando sesion · {profile?.full_name || user?.email || role}</div>
        </div>
      </div>

      <iframe
        ref={frameRef}
        className="app-frame"
        src="/demo.html"
        title="EverHealthHormIA — Telemedicina Hormonal"
        allow="fullscreen"
        onLoad={() => {
          // Dar un tick para que los scripts inline de la demo terminen de registrar globales
          setTimeout(() => {
            autoLogin()
            setReady(true)
          }, 80)
        }}
      />

      <div style={{ position:'fixed', bottom:14, right:14, zIndex:10000, display:'flex', gap:6 }}>
        <a href="/admin" title="Panel admin" style={adminBtn}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span>Admin</span>
        </a>
        <button type="button" onClick={signOut} title="Cerrar sesion" style={logoutBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </>
  )
}

const logoutBtn = {
  display:'flex', alignItems:'center', gap:6,
  padding:'8px 14px', borderRadius:20,
  background:'rgba(10,10,15,.85)', color:'#fff',
  border:'1px solid rgba(255,255,255,.15)',
  fontFamily:"'Montserrat',sans-serif",
  fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
  cursor:'pointer', backdropFilter:'blur(8px)',
  boxShadow:'0 6px 18px rgba(0,0,0,.25)',
}
const adminBtn = {
  ...Object.fromEntries(Object.entries({
    display:'flex', alignItems:'center', gap:6,
    padding:'8px 12px', borderRadius:20,
    background:'rgba(255,255,255,.92)', color:'#0A0A0F',
    border:'1px solid rgba(10,10,15,.15)',
    fontFamily:"'Montserrat',sans-serif",
    fontSize:11, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
    cursor:'pointer', textDecoration:'none', backdropFilter:'blur(8px)',
    boxShadow:'0 6px 18px rgba(0,0,0,.15)',
  })),
}
