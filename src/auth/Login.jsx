import { useState } from 'react'
import { useAuth } from './AuthProvider.jsx'

const DEMO_PROFILES = [
  { label: 'Director / Inversor', role: 'director', full_name: 'Jose Manuel Fernandez', email: 'director@otsugroup.es' },
  { label: 'Medico / Coordinador', role: 'medico', full_name: 'Dra. Laura Martinez', email: 'medico@clinica.es' },
  { label: 'Paciente', role: 'paciente', full_name: 'Maria Garcia Lopez', email: 'paciente@email.es' },
  { label: 'Laboratorio / Partner', role: 'laboratorio', full_name: 'Carlos Ruiz — LabCorp', email: 'lab@labcorp.es' },
]

export default function Login() {
  const { signIn, signInDemo, hasSupabase } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr(null); setLoading(true)
    try {
      await signIn({ email, password })
    } catch (ex) {
      setErr(ex?.message || 'Credenciales invalidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <div style={styles.logo}>EverHealth<span style={styles.logoDim}>HormIA</span></div>
        <div style={styles.eyebrow}>Acceso seguro · Fase 3</div>
        <div style={styles.title}>Telemedicina hormonal IA</div>

        {hasSupabase ? (
          <form onSubmit={onSubmit} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="tu@clinica.es" style={styles.input} autoComplete="email" />

            <label style={styles.label}>Contraseña</label>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" style={styles.input} autoComplete="current-password" />

            {err && <div style={styles.err}>{err}</div>}

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? 'Comprobando...' : 'Acceder'}
            </button>
            <div style={styles.hint}>Autenticación Supabase · tus credenciales nunca salen del navegador.</div>
          </form>
        ) : (
          <div style={styles.form}>
            <div style={styles.notice}>
              <strong>Modo demo</strong> · Supabase no configurado. Entra con un perfil simulado para recorrer la demo.
              Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en Vercel para activar login real.
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:6}}>
              {DEMO_PROFILES.map(p => (
                <button key={p.role} onClick={()=>signInDemo(p)} style={styles.demoBtn}>
                  <span style={{fontWeight:800}}>{p.label}</span>
                  <span style={{fontSize:11,color:'#9CA3AF'}}>{p.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div style={styles.foot}>COAXIONIA · Ecosistemas IA adaptativa · 4ª Generación</div>
    </div>
  )
}

const styles = {
  wrap: {
    position:'fixed', inset:0,
    background:'linear-gradient(160deg,#F4F8FB 0%,#EEF4F9 50%,#071E3D 100%)',
    display:'flex', alignItems:'center', justifyContent:'center',
    padding:24, fontFamily:"'DM Sans',sans-serif",
  },
  panel: {
    width:'min(420px, 100%)', background:'#fff', borderRadius:18,
    padding:'36px 32px', boxShadow:'0 24px 64px rgba(7,30,61,.2)',
    position:'relative',
  },
  logo: {
    fontFamily:"'Montserrat',sans-serif", fontSize:26, fontWeight:900,
    color:'#0A0A0F', letterSpacing:'.02em', marginBottom:6,
  },
  logoDim: { color:'#0F2E52', fontWeight:400 },
  eyebrow: {
    fontSize:10, fontWeight:700, color:'#8FA3B4',
    letterSpacing:'.18em', textTransform:'uppercase', marginBottom:6,
  },
  title: {
    fontFamily:"'Montserrat',sans-serif", fontSize:20, fontWeight:900,
    color:'#0D1B2A', marginBottom:22, letterSpacing:'.02em',
  },
  form: { display:'flex', flexDirection:'column', gap:8 },
  label: {
    fontSize:10, fontWeight:700, color:'#8FA3B4',
    letterSpacing:'.16em', textTransform:'uppercase', marginTop:8,
  },
  input: {
    padding:'12px 14px', borderRadius:10,
    border:'1.5px solid rgba(10,10,20,.18)',
    background:'#F7FBFD', color:'#0D1B2A',
    fontSize:14, outline:'none', fontFamily:"'DM Sans',sans-serif",
  },
  btn: {
    marginTop:14, padding:'13px', border:'none', borderRadius:11,
    background:'#0A0A0F', color:'#fff',
    fontFamily:"'Montserrat',sans-serif",
    fontSize:13, fontWeight:900, letterSpacing:'.14em', textTransform:'uppercase',
    cursor:'pointer', boxShadow:'0 4px 16px rgba(10,10,20,.25)',
  },
  demoBtn: {
    padding:'12px 14px', border:'1px solid #E5E7EB', borderRadius:10,
    background:'#FAFBFC', cursor:'pointer',
    display:'flex', justifyContent:'space-between', alignItems:'center', gap:12,
    fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'#0A0A0F',
    textAlign:'left',
  },
  hint: { fontSize:11, color:'#8FA3B4', marginTop:10, lineHeight:1.5 },
  notice: {
    fontSize:12, color:'#4B5563', lineHeight:1.55,
    background:'#F9FAFB', border:'1px solid #E5E7EB',
    borderRadius:10, padding:'12px 14px',
  },
  err: {
    fontSize:12, color:'#E04668', background:'rgba(224,70,104,.06)',
    border:'1px solid rgba(224,70,104,.2)', borderRadius:8,
    padding:'8px 12px', marginTop:4,
  },
  foot: {
    position:'absolute', bottom:20, width:'100%', textAlign:'center',
    fontSize:10, color:'rgba(255,255,255,.5)',
    letterSpacing:'.18em', textTransform:'uppercase',
  },
}
