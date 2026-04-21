-- ============================================================================
-- EverHealthHormIA · Seed de desarrollo
-- ----------------------------------------------------------------------------
-- Pobla las tablas con los personajes y datos que aparecen en la demo HTML.
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema.sql.
--
-- Precondición: crear los usuarios en Authentication → Users con estos emails
-- y user_metadata.role antes de ejecutar (el trigger handle_new_user crea el
-- profile automáticamente). Si no existen, los INSERTs de patients/protocols
-- no conectarán con un auth.user pero las demás tablas funcionan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- clinics · red Otsu Group
-- ----------------------------------------------------------------------------
insert into clinics (id, name, city, status, patients_count, revenue_monthly) values
  ('c1111111-0000-0000-0000-000000000001', 'Hospital Universitario La Paz',  'Madrid',    'activa',  2340, 485000),
  ('c1111111-0000-0000-0000-000000000002', 'Clinica Teknon',                 'Barcelona', 'activa',  1870, 392000),
  ('c1111111-0000-0000-0000-000000000003', 'Hospital Quironsalud',           'Valencia',  'alerta',  1450, 310000),
  ('c1111111-0000-0000-0000-000000000004', 'Centro Medico Navarra',          'Pamplona',  'activa',   980, 205000),
  ('c1111111-0000-0000-0000-000000000005', 'Clinica Ruber Internacional',    'Madrid',    'critica', 2100, 440000),
  ('c1111111-0000-0000-0000-000000000006', 'Hospital Viamed',                'Zaragoza',  'activa',   650, 138000),
  ('c1111111-0000-0000-0000-000000000007', 'Clinica Teknon Sur',             'Sevilla',   'activa',   720, 152000),
  ('c1111111-0000-0000-0000-000000000008', 'Centro Salud Hormonal BCN',      'Barcelona', 'activa',  1100, 231000)
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- patients · 10 pacientes del Gemelo Hormonal + bandeja
-- ----------------------------------------------------------------------------
insert into patients (id, clinic_id, full_name, age, sex, protocol_type, status, score_hormonal, avatar_initials, avatar_bg) values
  ('b2222222-0000-0000-0000-000000000001', 'c1111111-0000-0000-0000-000000000002', 'Carlos Martinez',  52, 'M', 'TRT',       'rojo',  62, 'CM', '#A32D2D'),
  ('b2222222-0000-0000-0000-000000000002', 'c1111111-0000-0000-0000-000000000005', 'Ana Ruiz Lopez',    48, 'F', 'THS',       'rojo',  58, 'AR', '#A32D2D'),
  ('b2222222-0000-0000-0000-000000000003', 'c1111111-0000-0000-0000-000000000001', 'Luis Fernandez',    45, 'M', 'TRT',       'amber', 74, 'LF', '#854F0B'),
  ('b2222222-0000-0000-0000-000000000004', 'c1111111-0000-0000-0000-000000000003', 'Marta Garcia',      51, 'F', 'THS',       'amber', 71, 'MG', '#854F0B'),
  ('b2222222-0000-0000-0000-000000000005', 'c1111111-0000-0000-0000-000000000004', 'Roberto Sanchez',   38, 'M', 'TRT',       'verde', 91, 'RS', '#3B6D11'),
  ('b2222222-0000-0000-0000-000000000006', 'c1111111-0000-0000-0000-000000000007', 'Elena Torres',      44, 'F', 'Tiroides',  'verde', 88, 'ET', '#3B6D11'),
  ('b2222222-0000-0000-0000-000000000007', 'c1111111-0000-0000-0000-000000000002', 'Jorge Blanco',      55, 'M', 'TRT',       'verde', 85, 'JB', '#0A0A0F'),
  ('b2222222-0000-0000-0000-000000000008', 'c1111111-0000-0000-0000-000000000006', 'Carmen Lopez',      49, 'F', 'THS',       'verde', 87, 'CL', '#3B6D11'),
  ('b2222222-0000-0000-0000-000000000009', 'c1111111-0000-0000-0000-000000000008', 'Silvia Martinez',   42, 'F', 'Tiroides',  'amber', 76, 'SM', '#854F0B'),
  ('b2222222-0000-0000-0000-000000000010', 'c1111111-0000-0000-0000-000000000001', 'Pedro Sanchez',     47, 'M', 'TRT',       'verde', 83, 'PS', '#185FA5')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- analytics_samples · última analítica por paciente
-- ----------------------------------------------------------------------------
insert into analytics_samples (patient_id, sample_date, testosterone_free, hematocrit, tsh, estradiol) values
  ('b2222222-0000-0000-0000-000000000001', current_date - interval '8 days',  9.80, 52.0, 1.2, null),
  ('b2222222-0000-0000-0000-000000000002', current_date - interval '5 days',  1.20, 38.0, 8.2, 42.3),
  ('b2222222-0000-0000-0000-000000000003', current_date - interval '95 days', 11.20, 44.0, 1.8, null),
  ('b2222222-0000-0000-0000-000000000004', current_date - interval '3 days',  1.40, 36.0, 3.1, 38.1),
  ('b2222222-0000-0000-0000-000000000005', current_date - interval '12 days', 13.20, 46.0, 1.6, null),
  ('b2222222-0000-0000-0000-000000000006', current_date - interval '20 days', 1.80,  39.0, 1.9, 56.2),
  ('b2222222-0000-0000-0000-000000000007', current_date - interval '18 days', 12.10, 47.0, 1.4, null),
  ('b2222222-0000-0000-0000-000000000008', current_date - interval '7 days',  1.60, 37.0, 1.7, 61.8),
  ('b2222222-0000-0000-0000-000000000009', current_date - interval '10 days', 1.50, 38.0, 4.2, 49.0),
  ('b2222222-0000-0000-0000-000000000010', current_date - interval '15 days', 10.80, 43.0, 1.5, null);

-- ----------------------------------------------------------------------------
-- protocols · protocolos activos
-- ----------------------------------------------------------------------------
insert into protocols (patient_id, protocol_type, dose_mg, frequency, status, proposed_by_ia, notes) values
  ('b2222222-0000-0000-0000-000000000001', 'TRT',      50.00, 'semanal', 'activo',    false, 'Dosis base TRT. IA propone subir a 75mg.'),
  ('b2222222-0000-0000-0000-000000000002', 'THS',      75.00, 'diaria',  'activo',    false, 'Levotiroxina 75mcg. IA propone 100mcg.'),
  ('b2222222-0000-0000-0000-000000000003', 'TRT',      50.00, 'semanal', 'activo',    false, 'Protocolo TRT estable.'),
  ('b2222222-0000-0000-0000-000000000004', 'THS',      75.00, 'diaria',  'activo',    false, 'Interaccion warfarina + estradiol oral.'),
  ('b2222222-0000-0000-0000-000000000005', 'TRT',      75.00, 'semanal', 'activo',    false, 'TRT optimo.'),
  ('b2222222-0000-0000-0000-000000000006', 'Tiroides', 50.00, 'diaria',  'activo',    false, 'Protocolo tiroideo estable.'),
  ('b2222222-0000-0000-0000-000000000007', 'TRT',      75.00, 'semanal', 'activo',    false, 'TRT maduro 18 meses.'),
  ('b2222222-0000-0000-0000-000000000008', 'THS',     100.00, 'diaria',  'activo',    false, 'THS optimo. NPS 5.0.'),
  ('b2222222-0000-0000-0000-000000000009', 'Tiroides', 75.00, 'diaria',  'activo',    false, 'TSH 4.2 ligeramente elevada.'),
  ('b2222222-0000-0000-0000-000000000010', 'TRT',      50.00, 'semanal', 'activo',    false, 'TRT en rango optimo.');

-- Ajustes propuestos por IA (pendientes de aprobación médica)
insert into protocols (patient_id, protocol_type, dose_mg, frequency, status, proposed_by_ia, notes) values
  ('b2222222-0000-0000-0000-000000000001', 'TRT', 75.00,  'semanal', 'propuesto', true, 'Hematocrito 52%. IA propone subir a 75mg. Proyeccion: T=11.6 pg/mL, Hem=49%.'),
  ('b2222222-0000-0000-0000-000000000002', 'THS', 100.00, 'diaria',  'propuesto', true, 'TSH 8.2 critica. IA propone Levotiroxina 75 -> 100mcg. Normalizacion en 6 semanas.'),
  ('b2222222-0000-0000-0000-000000000004', 'THS', 75.00,  'diaria',  'propuesto', true, 'Cambio a estradiol transdermico. Elimina riesgo trombotico con warfarina.');

-- ----------------------------------------------------------------------------
-- kits · kits de analítica
-- ----------------------------------------------------------------------------
insert into kits (patient_id, kit_type, status, tracking_code, shipped_at) values
  ('b2222222-0000-0000-0000-000000000001', 'Hormonal completo',  'entregado',         'ENV-9001', now() - interval '3 days'),
  ('b2222222-0000-0000-0000-000000000002', 'Perfil tiroideo',    'entregado',         'ENV-9002', now() - interval '2 days'),
  ('b2222222-0000-0000-0000-000000000003', 'Hormonal completo',  'pendiente',         null,       null),
  ('b2222222-0000-0000-0000-000000000004', 'Panel metabolico',   'enviado',           'ENV-9018', now() - interval '1 day'),
  ('b2222222-0000-0000-0000-000000000010', 'Testosterona+SHBG',  'enviado',           'ENV-9017', now() - interval '4 hours');

-- ----------------------------------------------------------------------------
-- alerts · alertas IA priorizadas (campana topbar)
-- ----------------------------------------------------------------------------
insert into alerts (target_role, severity, category, title, body) values
  ('medico', 'red',   'Urgente',   'Carlos M. — Hematocrito 52%',        'Riesgo TRT. IA preparo ajuste de dosis 50 -> 75mg.'),
  ('medico', 'red',   'Urgente',   'Ana R. — TSH 8.2 mU/L',              'Fuera de rango critico. Requiere revision inmediata.'),
  ('medico', 'amber', 'Atencion',  'Luis F. — Sin analitica >90 dias',   'Kit enviado, muestra pendiente de envio.'),
  ('medico', 'blue',  'Atencion',  'Marta G. — Interaccion medicamentosa','Anticoagulante + estradiol. IA propone cambio a transdermico.'),
  ('director', 'red', 'Red',        'Clinica Ruber — desvio protocolo TRT 23%', 'IA activo correccion automatica en 3 clinicas.'),
  ('director', 'blue','Competencia','Principal competidor reporta perdidas Q3','Oportunidad de posicionamiento premium.'),
  ('paciente', 'green','Kit',      'Tu proximo kit llega en 3 dias',     'Adherencia esta semana: 100%.'),
  ('laboratorio','amber','SLA',    'Tipo analitica cortisol en riesgo',  'Tiempo medio 25h sobre objetivo 24h.');

-- ----------------------------------------------------------------------------
-- appointments · citas próximas
-- ----------------------------------------------------------------------------
insert into appointments (patient_id, scheduled_at, type, status) values
  ('b2222222-0000-0000-0000-000000000001', date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes', 'seguimiento', 'programada'),
  ('b2222222-0000-0000-0000-000000000002', date_trunc('day', now()) + interval '1 day' + interval '11 hours',             'revision',    'programada'),
  ('b2222222-0000-0000-0000-000000000003', date_trunc('day', now()) + interval '2 days' + interval '17 hours',            'seguimiento', 'programada'),
  ('b2222222-0000-0000-0000-000000000004', date_trunc('day', now()) + interval '3 days' + interval '09 hours 30 minutes', 'revision',    'programada');

-- ----------------------------------------------------------------------------
-- ia_actions · log de ejemplo
-- ----------------------------------------------------------------------------
insert into ia_actions (action_type, target_type, target_id, input, output, model, tokens_in, tokens_out, cost_usd) values
  ('protocol_proposal', 'patient', 'b2222222-0000-0000-0000-000000000001',
   jsonb_build_object('trigger','hematocrit_high','patient','Carlos M.'),
   jsonb_build_object('proposal','subir TRT 50 -> 75mg','confidence',0.91),
   'claude-sonnet-4-6', 820, 240, 0.0042),
  ('daily_briefing', 'user', null,
   jsonb_build_object('role','director'),
   jsonb_build_object('summary','1 clinica critica, 23 pacientes en revision, adherencia 94%'),
   'claude-sonnet-4-6', 1200, 380, 0.0065),
  ('email_draft', 'appointment', null,
   jsonb_build_object('patient','Ana R.','purpose','recordatorio cita'),
   jsonb_build_object('subject','Recordatorio: consulta Dra. Martinez 21 abril','body','Buenos dias Ana...'),
   'claude-sonnet-4-6', 520, 180, 0.0028);

-- ============================================================================
-- Reset / limpieza (descomentar si quieres reiniciar el seed)
-- ============================================================================
-- truncate table ia_actions, alerts, appointments, kits, protocols,
--   analytics_samples, messages, conversations, patients, clinics cascade;
