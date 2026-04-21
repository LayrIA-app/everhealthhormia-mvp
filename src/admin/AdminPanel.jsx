import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider.jsx'
import { supabase, hasSupabase } from '../lib/supabase.js'
import { askClaude } from '../lib/claude.js'
import { sendEmail } from '../lib/resend.js'
import { buildClinicalReport } from '../lib/pdf.js'

/**
 * Admin /admin · Primera pantalla React real Fase 3.
 *
 * Sirve como:
 *  1. Smoke test · 4 botones verifican Supabase / Claude / Resend / PDF.
 *  2. Audit log · lista de ia_actions si Supabase configurado.
 *  3. Referencia visual para las próximas pantallas Fase 3.x que extraigamos
 *     del iframe a componentes React puros.
 */
export default function AdminPanel() {
  const { user, profile, signOut, hasSupabase: authed } = useAuth()
  const [tests, setTests] = useState({
    supabase: { status: 'idle', msg: null, detail: null },
    claude:   { status: 'idle', msg: null, detail: null },
    resend:   { status: 'idle', msg: null, detail: null },
    pdf:      { status: 'idle', msg: null, detail: null },
  })
  const [actions, setActions] = useState([])
  const [loadingActions, setLoadingActions] = useState(false)

  useEffect(() => { document.title = 'EverHealthHormIA — Admin' }, [])
  useEffect(() => { if (hasSupabase && user) reloadActions() }, [user])

  function setTest(key, patch) {
    setTests(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  async function reloadActions() {
    if (!hasSupabase) return
    setLoadingActions(true)
    try {
      const { data, error } = await supabase
        .from('ia_actions')
        .select('id, action_type, target_type, model, tokens_in, tokens_out, cost_usd, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      setActions(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingActions(false)
    }
  }

  async function testSupabase() {
    setTest('supabase', { status: 'loading' })
    if (!hasSupabase) {
      setTest('supabase', { status: 'skip', msg: 'Sin env vars · modo demo' })
      return
    }
    try {
      const { data, error } = await supabase.from('profiles').select('id, email, role').limit(1)
      if (error) throw error
      setTest('supabase', { status: 'ok', msg: `${data?.length || 0} profile(s) accesibles`, detail: data?.[0]?.email })
    } catch (err) {
      setTest('supabase', { status: 'err', msg: err?.message || 'Error Supabase', detail: err?.details })
    }
  }

  async function testClaude() {
    setTest('claude', { status: 'loading' })
    try {
      const res = await askClaude({
        system: 'Eres una IA clinica de COAXIONIA. Responde en una linea, sin adornos.',
        messages: [{ role: 'user', content: 'Resume en 10 palabras la utilidad de un Gemelo Hormonal en TRT.' }],
        max_tokens: 120,
      })
      setTest('claude', {
        status: 'ok',
        msg: `${res.model} · ${res.usage?.input_tokens}/${res.usage?.output_tokens} tokens`,
        detail: res.content,
      })
    } catch (err) {
      setTest('claude', { status: 'err', msg: err?.message || 'Error Claude', detail: JSON.stringify(err?.body) })
    }
  }

  async function testResend() {
    const to = profile?.email || user?.email || ''
    if (!to) { setTest('resend', { status: 'err', msg: 'Sin email destino' }); return }
    setTest('resend', { status: 'loading' })
    try {
      const res = await sendEmail({
        to,
        subject: 'EverHealthHormIA · Smoke test',
        html: '<p>Este email confirma que Resend esta correctamente cableado en Fase 3.</p><p style="color:#9CA3AF;font-size:12px">Enviado desde /admin smoke test</p>',
      })
      setTest('resend', { status: 'ok', msg: `Enviado a ${to}`, detail: `id: ${res.id}` })
    } catch (err) {
      setTest('resend', { status: 'err', msg: err?.message || 'Error Resend', detail: JSON.stringify(err?.body) })
    }
  }

  function testPdf() {
    setTest('pdf', { status: 'loading' })
    try {
      const doc = buildClinicalReport({
        title: 'Informe de prueba · EverHealthHormIA',
        patient: { name: 'Carlos M. (demo)', age: 52, protocol: 'TRT' },
        sections: [
          { heading: 'Analitica reciente',  body: 'Testosterona libre 9.8 pg/mL, Hematocrito 52%, TSH 1.2.' },
          { heading: 'Ajuste propuesto IA', body: 'Subir dosis TRT de 50mg a 75mg. Proyeccion 6 semanas.' },
          { heading: 'Notas del clinico',   body: 'Paciente estable, sin sintomas adversos.' },
        ],
        meta: { Medico: profile?.full_name || 'Dra. Martinez', Generado: new Date().toLocaleString('es-ES') },
      })
      doc.save('everhealth-smoke-test.pdf')
      setTest('pdf', { status: 'ok', msg: 'PDF descargado', detail: 'everhealth-smoke-test.pdf' })
    } catch (err) {
      setTest('pdf', { status: 'err', msg: err?.message || 'Error PDF' })
    }
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.logo}>EverHealth<span style={S.logoDim}>HormIA</span> <span style={S.badge}>Admin</span></div>
          <div style={S.headerSub}>
            Smoke tests del backend Fase 3 · {profile?.full_name || user?.email || 'sin sesion'} · rol <strong>{profile?.role || 'demo'}</strong>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="/" style={S.navBtn}>← Volver al producto</a>
          <button onClick={signOut} style={S.logoutBtn}>Cerrar sesion</button>
        </div>
      </header>

      <section style={S.grid}>
        <TestCard title="Supabase"
          subtitle={hasSupabase ? 'Conectado · consulta a profiles' : 'No configurado · modo demo'}
          result={tests.supabase}
          onRun={testSupabase} />

        <TestCard title="Claude API"
          subtitle="POST /api/claude · Sonnet 4.6 · prompt caching"
          result={tests.claude}
          onRun={testClaude} />

        <TestCard title="Resend email"
          subtitle={`POST /api/resend · envia a ${profile?.email || user?.email || '(sin email)'}`}
          result={tests.resend}
          onRun={testResend}
          disabled={!(profile?.email || user?.email)} />

        <TestCard title="jsPDF informe"
          subtitle="buildClinicalReport · descarga directa"
          result={tests.pdf}
          onRun={testPdf} />
      </section>

      <section style={S.logSection}>
        <div style={S.logHeader}>
          <div>
            <div style={S.logTitle}>Ultimas acciones IA</div>
            <div style={S.logSub}>Tabla <code>ia_actions</code> · {hasSupabase ? 'datos reales Supabase' : 'sin Supabase — vacio'}</div>
          </div>
          {hasSupabase && (
            <button onClick={reloadActions} disabled={loadingActions} style={S.navBtn}>
              {loadingActions ? 'Cargando...' : 'Refrescar'}
            </button>
          )}
        </div>
        {hasSupabase ? (
          actions.length > 0 ? (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Cuando</th>
                  <th style={S.th}>Tipo</th>
                  <th style={S.th}>Target</th>
                  <th style={S.th}>Modelo</th>
                  <th style={S.th}>Tokens</th>
                  <th style={S.th}>Coste</th>
                </tr>
              </thead>
              <tbody>
                {actions.map(a => (
                  <tr key={a.id}>
                    <td style={S.td}>{new Date(a.created_at).toLocaleString('es-ES')}</td>
                    <td style={S.td}>{a.action_type}</td>
                    <td style={S.td}>{a.target_type || '—'}</td>
                    <td style={S.td}>{a.model || '—'}</td>
                    <td style={S.td}>{(a.tokens_in || 0) + ' / ' + (a.tokens_out || 0)}</td>
                    <td style={S.td}>{a.cost_usd != null ? '$' + Number(a.cost_usd).toFixed(4) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={S.empty}>Sin acciones registradas todavia. Ejecuta seed.sql o lanza smoke tests.</div>
          )
        ) : (
          <div style={S.empty}>Configura <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en Vercel para ver el log.</div>
        )}
      </section>

      <footer style={S.footer}>
        COAXIONIA · Ecosistemas IA adaptativa · 4ª Generación · Fase 3
      </footer>
    </div>
  )
}

function TestCard({ title, subtitle, result, onRun, disabled }) {
  const { status, msg, detail } = result
  const stateColor = {
    idle:    '#9CA3AF',
    loading: '#2563EB',
    ok:      '#10B981',
    err:     '#E04668',
    skip:    '#D4A574',
  }[status]
  const stateLabel = {
    idle:    'Sin probar',
    loading: 'Ejecutando...',
    ok:      'OK',
    err:     'Error',
    skip:    'Omitido',
  }[status]
  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <div>
          <div style={S.cardTitle}>{title}</div>
          <div style={S.cardSub}>{subtitle}</div>
        </div>
        <span style={{ ...S.pill, background: stateColor + '1a', color: stateColor, borderColor: stateColor + '66' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background: stateColor }} />
          {stateLabel}
        </span>
      </div>
      <div style={S.cardBody}>
        {msg && <div style={S.cardMsg}>{msg}</div>}
        {detail && <div style={S.cardDetail}>{detail}</div>}
      </div>
      <button
        onClick={onRun}
        disabled={disabled || status === 'loading'}
        style={{ ...S.cardBtn, opacity: (disabled || status === 'loading') ? .6 : 1 }}
      >
        {status === 'loading' ? 'Ejecutando...' : status === 'ok' ? 'Ejecutar de nuevo' : 'Ejecutar prueba'}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// estilos inline (auto-contenidos · no dependen del CSS de la demo)
// ---------------------------------------------------------------------------
const S = {
  page: {
    minHeight:'100vh',width:'100%',boxSizing:'border-box',
    background:'linear-gradient(180deg,#F4F8FB 0%,#EEF4F9 100%)',
    fontFamily:"'DM Sans',sans-serif",color:'#0D1B2A',
    padding:'28px clamp(16px,3vw,40px) 40px',overflowY:'auto',
  },
  header: {
    display:'flex',justifyContent:'space-between',alignItems:'flex-start',
    gap:16,marginBottom:24,flexWrap:'wrap',
  },
  logo: {
    fontFamily:"'Montserrat',sans-serif",fontSize:22,fontWeight:900,
    color:'#0A0A0F',letterSpacing:'.02em',display:'flex',alignItems:'center',gap:8,
  },
  logoDim: { color:'#0F2E52',fontWeight:400 },
  badge: {
    fontSize:10,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',
    padding:'3px 9px',borderRadius:20,background:'#0A0A0F',color:'#fff',
  },
  headerSub: { fontSize:12,color:'#4B5563',marginTop:4,lineHeight:1.5 },
  navBtn: {
    padding:'8px 14px',borderRadius:8,border:'1px solid rgba(10,10,15,.15)',
    background:'#fff',color:'#0A0A0F',cursor:'pointer',textDecoration:'none',
    fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif",
  },
  logoutBtn: {
    padding:'8px 14px',borderRadius:8,border:'none',
    background:'#0A0A0F',color:'#fff',cursor:'pointer',
    fontSize:12,fontWeight:700,fontFamily:"'Montserrat',sans-serif",
    letterSpacing:'.08em',textTransform:'uppercase',
  },
  grid: {
    display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
    gap:14,marginBottom:28,
  },
  card: {
    background:'#fff',border:'1px solid rgba(10,10,15,.08)',
    borderRadius:14,padding:18,
    display:'flex',flexDirection:'column',gap:12,
    boxShadow:'0 4px 20px rgba(10,10,15,.05)',
  },
  cardHead: { display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10 },
  cardTitle: {
    fontFamily:"'Montserrat',sans-serif",fontSize:15,fontWeight:900,
    color:'#0A0A0F',letterSpacing:'.02em',
  },
  cardSub: { fontSize:11,color:'#6B7280',marginTop:3,lineHeight:1.4 },
  pill: {
    display:'inline-flex',alignItems:'center',gap:6,
    fontSize:10,fontWeight:800,letterSpacing:'.08em',textTransform:'uppercase',
    padding:'3px 9px',borderRadius:20,border:'1px solid',
    whiteSpace:'nowrap',flexShrink:0,
  },
  cardBody: { minHeight:30,display:'flex',flexDirection:'column',gap:6 },
  cardMsg: { fontSize:12,fontWeight:600,color:'#0D1B2A' },
  cardDetail: {
    fontSize:11,color:'#6B7280',lineHeight:1.5,
    background:'#F9FAFB',borderRadius:8,padding:'8px 10px',
    fontFamily:'ui-monospace,"SF Mono",monospace',
    wordBreak:'break-word',maxHeight:100,overflow:'auto',
  },
  cardBtn: {
    marginTop:'auto',padding:'10px 14px',border:'none',borderRadius:8,
    background:'#0A0A0F',color:'#fff',cursor:'pointer',
    fontSize:11,fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',
    fontFamily:"'Montserrat',sans-serif",
  },
  logSection: {
    background:'#fff',border:'1px solid rgba(10,10,15,.08)',
    borderRadius:14,padding:18,boxShadow:'0 4px 20px rgba(10,10,15,.04)',
  },
  logHeader: {
    display:'flex',justifyContent:'space-between',alignItems:'flex-start',
    marginBottom:14,gap:10,flexWrap:'wrap',
  },
  logTitle: {
    fontFamily:"'Montserrat',sans-serif",fontSize:14,fontWeight:900,
    color:'#0A0A0F',letterSpacing:'.02em',
  },
  logSub: { fontSize:11,color:'#6B7280',marginTop:2 },
  table: { width:'100%',borderCollapse:'collapse',fontSize:12 },
  th: {
    textAlign:'left',padding:'8px 10px',
    fontSize:10,fontWeight:800,color:'#6B7280',
    letterSpacing:'.1em',textTransform:'uppercase',
    borderBottom:'1.5px solid rgba(10,10,15,.1)',
  },
  td: {
    padding:'9px 10px',color:'#374151',
    borderBottom:'1px solid rgba(10,10,15,.05)',
    fontSize:12,
  },
  empty: {
    padding:'20px 16px',textAlign:'center',
    fontSize:12,color:'#6B7280',
    background:'#F9FAFB',borderRadius:10,
  },
  footer: {
    marginTop:24,fontSize:10,color:'#9CA3AF',
    letterSpacing:'.14em',textTransform:'uppercase',
    textAlign:'center',
  },
}
