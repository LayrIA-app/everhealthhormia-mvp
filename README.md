# EverHealthHormIA · MVP Fase 2

Ecosistema IA Adaptativa de Telemedicina Hormonal · versión MVP publicada en Vercel.

## Estado actual

**Fase 2 · MVP React en producción · sin backend activado.**

- Demo completa de Fase 1 como fuente de verdad en `public/demo.html`.
- Shell React (Vite) embebe la demo a pantalla completa en `src/App.jsx`.
- Estructura preparada para extraer pantallas a componentes React e ir conectando Supabase / Claude API / Resend en Fase 3.

## Qué NO va en Fase 2 (según SISTEMA_FRANQUICIA.md)

- Supabase ni ninguna BBDD
- Claude API ni IA real conectada
- Resend ni emails reales
- Stripe ni pagos

## Estructura

```
everhealthhormia-mvp/
├── index.html              # Vite root entry (monta React)
├── public/
│   └── demo.html           # Demo completa Fase 1 (fuente única)
├── src/
│   ├── main.jsx            # React entry
│   ├── App.jsx             # Shell que embebe la demo
│   └── index.css           # Loader + frame CSS
├── vite.config.js
├── vercel.json             # Config Vercel (framework vite)
└── package.json
```

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ en local
```

## Deploy

Vercel auto-detecta Vite. Con el repo conectado a Vercel, cada push a `main` genera un deploy automático.

Primer linking manual:

1. Entrar a [vercel.com/new](https://vercel.com/new)
2. Import del repo `LayrIA-app/everhealthhormia-mvp`
3. Plan **Hobby** es suficiente para MVP
4. Framework detectado: **Vite**
5. Deploy

A partir de ahí, cualquier `git push` dispara redeploy en ~1 min.

## Roadmap hacia Fase 3

Cuando entre un cliente real pagando:

- Sustituir iframe `demo.html` por componentes React por pantalla
- Añadir router (React Router) con URLs por perfil/sección
- Conectar Supabase (auth + DB) vía `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- Conectar Claude API vía `ANTHROPIC_API_KEY` para insights IA reales
- Activar Resend vía `RESEND_API_KEY` para emails reales
- Activar pagos con Stripe / Redsys si el cliente lo pide

## Referencias internas

- `SISTEMA_FRANQUICIA.md` — manual maestro COAXIONIA (local)
- `COAXIONIA_Instrucciones_Responsive_Demos.docx` — responsive demo
- Fase 1 sectorial: `LayrIA-app/demos-coaxionia` (`everhealthhormia-demo.html`)

---

COAXIONIA · Ecosistemas IA adaptativa · 4ª Generación
