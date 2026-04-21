import { useEffect, useRef, useState } from 'react'

/**
 * EverHealthHormIA · Fase 2 MVP shell
 *
 * La demo de Fase 1 vive en public/demo.html como fuente única.
 * Este shell React la embebe a pantalla completa y expone el punto
 * de entrada para añadir rutas/auth/Supabase en Fase 3.
 *
 * Cuando se extraigan pantallas a componentes React individuales,
 * se irán reemplazando aquí sin romper lo que ya funciona.
 */
export default function App() {
  const frameRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    document.title = 'EverHealthHormIA — MVP'
  }, [])

  return (
    <>
      <div className={`app-loader${loaded ? ' fade' : ''}`} aria-hidden={loaded}>
        <div className="app-loader-logo">EverHealth<span>HormIA</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="app-loader-dot" />
          <div className="app-loader-sub">Cargando ecosistema IA</div>
        </div>
      </div>
      <iframe
        ref={frameRef}
        className="app-frame"
        src="/demo.html"
        title="EverHealthHormIA — Telemedicina Hormonal"
        allow="fullscreen"
        onLoad={() => setLoaded(true)}
      />
    </>
  )
}
