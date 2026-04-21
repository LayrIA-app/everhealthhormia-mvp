# EverHealthHormIA · MVP (Fase 2 → Fase 3)

Ecosistema IA Adaptativa de Telemedicina Hormonal · publicado en Vercel.

## Estado actual

**Fase 3 activada · backend conectable.**

Login real (Supabase), IA proactiva (Claude API vía proxy serverless), emails reales (Resend vía proxy), PDFs client-side (jsPDF). La demo completa de Fase 1 sigue siendo la fuente única de verdad visual en `public/demo.html`; el shell React autentica y auto-navega al rol correcto en el iframe.

Sin variables de entorno configuradas, la demo arranca en **modo demo local** (perfiles simulados, sin auth real, sin Claude, sin Resend). Configurando las env vars (abajo) se activa el backend real.

## Stack

- **Vite 5** + **React 18** (shell)
- **Supabase** · auth + Postgres + RLS (`@supabase/supabase-js`)
- **Anthropic SDK** (Claude Sonnet 4.6 por defecto) · `@anthropic-ai/sdk`
- **Resend** · email transaccional · `resend`
- **jsPDF** · informes clínicos, derivaciones, facturas
- **Vercel** · hosting + serverless functions `/api/*` (Node 22)

## Estructura

```
everhealthhormia-mvp/
├── api/                      # Vercel Serverless Functions (Node 22)
│   ├── claude.js             # Proxy Anthropic API (cache prompt habilitado)
│   └── resend.js             # Proxy Resend (send email)
├── public/
│   └── demo.html             # Demo completa Fase 1 (fuente única visual)
├── src/
│   ├── main.jsx              # Entry React
│   ├── App.jsx               # Gate auth → router → ShellFrame / AdminPanel
│   ├── index.css             # Loader + frame CSS
│   ├── auth/
│   │   ├── AuthProvider.jsx  # Contexto auth (Supabase + fallback demo)
│   │   └── Login.jsx         # Login real o demo según hasSupabase
│   ├── admin/
│   │   └── AdminPanel.jsx    # /admin · smoke tests + log ia_actions (lazy)
│   └── lib/
│       ├── supabase.js       # createClient() singleton + getCurrentProfile()
│       ├── claude.js         # askClaude({ system, messages, model, cache })
│       ├── resend.js         # sendEmail({ to, subject, html })
│       └── pdf.js            # buildClinicalReport({...})
├── supabase/
│   ├── schema.sql            # Schema completo + RLS + trigger profile
│   └── seed.sql              # Datos dummy matching personajes de la demo
├── .env.example
├── vercel.json
└── package.json
```

## Configuración Fase 3 · paso a paso

### 1. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com) (Plan Free vale para MVP).
2. Dashboard → **SQL Editor** → pega el contenido de `supabase/schema.sql` → **Run**.
3. (Opcional) Mismo SQL Editor → pega `supabase/seed.sql` → **Run** para poblar con los personajes de la demo (8 clínicas, 10 pacientes, protocolos activos + propuestos por IA, analíticas, kits, alertas, citas, log IA).
4. Verificar que las tablas aparecen en **Table Editor** (profiles, patients, protocols, …).
5. **Authentication → Providers**: activar **Email** (ya viene por defecto).
6. **Authentication → Users → Add user** para cada perfil real. En `User metadata`:
   ```json
   { "full_name": "Jose Manuel Fernandez", "role": "director" }
   ```
   Roles válidos: `director`, `medico`, `coordinador`, `paciente`, `laboratorio`, `inversor`.
7. **Settings → API** → copia `URL` y `anon public key`.

### 2. Claude / Anthropic

1. [console.anthropic.com](https://console.anthropic.com) → **API Keys** → crear clave nueva.
2. Añadir tarjeta en **Billing** (cobro por consumo).
3. La clave NUNCA va al cliente: vive solo en Vercel Server env vars.

Modelo por defecto: `claude-sonnet-4-6`. Sobrescribir pasando `model` a `askClaude()`.
Prompt caching activado automáticamente para system prompts > 1KB.

### 3. Resend

1. [resend.com](https://resend.com) → **API Keys** → crear clave.
2. **Domains → Add domain** · verificar tu dominio (SPF + DKIM + opcionalmente DMARC).
3. Mientras tanto, envíos en sandbox con `noreply@resend.dev` (hasta 3000 emails/mes).

### 4. Vercel env vars

Dashboard → Project `everhealthhormia-mvp` → **Settings → Environment Variables**. Añade:

| Nombre | Valor | Scope |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Production + Preview + Development |
| `VITE_SUPABASE_ANON_KEY` | anon public key Supabase | Production + Preview + Development |
| `ANTHROPIC_API_KEY` | sk-ant-... | Production + Preview + Development |
| `RESEND_API_KEY` | re_... | Production + Preview + Development |
| `EVERHEALTH_FROM` | `EverHealthHormIA <noreply@tudominio.es>` | Production |

Tras añadir variables, **Deployments → último deploy → Redeploy** (las env vars solo se leen en builds nuevos).

### 5. Desarrollo local

```bash
cp .env.example .env.local
# Rellena .env.local con los valores reales (no se sube a git)

npm install
npm run dev          # http://localhost:5173
```

## API serverless

### `POST /api/claude`

```js
import { askClaude } from './lib/claude.js'

const res = await askClaude({
  system: 'Eres una IA clinica que redacta drafts para médicos.',
  messages: [{ role: 'user', content: 'Redacta draft de derivación para Luis F. con TSH 8.2' }],
  model: 'claude-sonnet-4-6', // opcional
})
console.log(res.content)
```

### `POST /api/resend`

```js
import { sendEmail } from './lib/resend.js'

await sendEmail({
  to: 'paciente@ejemplo.com',
  subject: 'Tu analítica está lista',
  html: '<p>Resultados disponibles en tu panel.</p>',
})
```

### jsPDF (client-side)

```js
import { buildClinicalReport } from './lib/pdf.js'

const pdf = buildClinicalReport({
  title: 'Informe clínico · Dra. Martínez',
  patient: { name: 'Carlos M.', age: 52, protocol: 'TRT' },
  sections: [
    { heading: 'Analítica 21 abril', body: 'Testosterona libre 9.8 pg/mL...' },
    { heading: 'Ajuste propuesto', body: 'Subir dosis 50mg → 75mg.' },
  ],
})
pdf.save('informe-carlos-m.pdf')
```

## Flujo de auth

1. `AuthProvider` comprueba sesión Supabase al montar.
2. Sin sesión → `<Login />` (formulario real) o selector de perfil demo si `VITE_SUPABASE_URL` falta.
3. Con sesión → `<ShellFrame />` carga `public/demo.html` en iframe.
4. Al cargar, `ShellFrame` llama a `iframe.contentWindow.selectRole/renderLoginPanel/doLogin` con el rol del perfil, saltándose la pantalla de login del HTML.
5. Botón **Salir** fijo abajo a la derecha · cierra sesión y vuelve al login.

Mapping rol → card demo:

| `profiles.role` | Card | `sub_role` posible |
|---|---|---|
| `director` | Director/Inversor | `director` / `inversor` |
| `medico` | Médico/Coordinador | `medico` / `coordinador` |
| `coordinador` | Médico/Coordinador | `coordinador` |
| `paciente` | Paciente | — |
| `laboratorio` | Lab/Partner | `laboratorio` / `partner` |
| `inversor` | Director/Inversor | `inversor` |

## Panel `/admin`

Primera pantalla 100% React (lazy-loaded). Accesible con cualquier usuario autenticado en:

- Local: `http://localhost:5173/admin`
- Prod: `https://everhealthhormia-mvp.vercel.app/admin`
- Acceso rápido: icono ⚙ Admin fijo bottom-right en el shell principal.

Contenido:

- **4 smoke tests** (uno por backend) que verifican cableado end-to-end:
  - **Supabase** · consulta `profiles` · muestra email resultado
  - **Claude API** · pregunta corta a Sonnet 4.6 · devuelve modelo usado + tokens
  - **Resend** · envía email de prueba al email del usuario autenticado
  - **jsPDF** · descarga `everhealth-smoke-test.pdf` con informe dummy
- **Log últimas 10 `ia_actions`** (tabla del schema) con modelo, tokens in/out y coste USD. Útil para auditar consumo de Claude API y ver qué acciones autónomas ha ejecutado la IA.

Sin env vars configurados, los smoke tests devuelven estado `Omitido` (Supabase) o `Error` (Claude/Resend) con el mensaje exacto de qué falta — útil para diagnosticar rápido.

## Roadmap · extracción incremental a React (Fase 3.x)

La demo HTML seguirá como iframe hasta que vayan refactorizándose pantallas a componentes React que consuman Supabase/Claude directamente. Orden recomendado:

1. **Alertas IA** (bell del topbar) · tabla `alerts` + polling realtime
2. **Protocolos adaptativos** (Médico) · `protocols` + `askClaude()` para proposer ajustes
3. **Comunicación bandeja** · `conversations` + `messages` + drafts IA
4. **Analítica hormonal (Gemelo)** · `analytics_samples` + `askClaude()` para explicar evolución
5. **PDFs de informes** · `buildClinicalReport()` conectado a datos reales

Cada pantalla extraída reemplaza su sección del iframe sin romper el resto.

## Deploy

- Auto-deploy activo: cada push a `main` → Vercel redeploy en ~1 min.
- Framework: Vite (detectado). Output: `dist`.
- Funciones serverless: `api/*.js` corren en Node 22.

URL producción: **https://everhealthhormia-mvp.vercel.app**

## Referencias internas

- `SISTEMA_FRANQUICIA.md` — manual maestro COAXIONIA
- `COAXIONIA_Instrucciones_Responsive_Demos.docx` — responsive demo
- Fase 1 sectorial: `LayrIA-app/demos-coaxionia` (`everhealthhormia-demo.html`)

---

COAXIONIA · Ecosistemas IA adaptativa · 4ª Generación
