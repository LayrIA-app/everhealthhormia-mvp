-- ============================================================================
-- EverHealthHormIA · Schema Fase 3
-- Ecosistema IA Adaptativa de Telemedicina Hormonal
-- ----------------------------------------------------------------------------
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL) sobre un proyecto limpio.
-- Tras ejecutarlo, crear los usuarios en Authentication → Users con el rol
-- correspondiente en user_metadata.role: director | medico | coordinador |
-- paciente | laboratorio | inversor
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM: roles, estados, canales, tipos de protocolo
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('director','medico','coordinador','paciente','laboratorio','inversor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type patient_status as enum ('verde','amber','rojo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type protocol_type as enum ('TRT','THS','Tiroides','Fertilidad');
exception when duplicate_object then null; end $$;

do $$ begin
  create type protocol_status as enum ('activo','pausado','finalizado','propuesto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type channel as enum ('voz','whatsapp','email','chat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_severity as enum ('red','amber','blue','green');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kit_status as enum ('pendiente','enviado','entregado','incidencia');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- profiles · extensión de auth.users con rol y metadatos
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role user_role not null,
  sub_role text,
  avatar_initials text,
  avatar_bg text default '#0A0A0F',
  clinic_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger: auto-crear profile cuando se crea un auth.user
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name, role, sub_role, avatar_initials)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'paciente'::user_role),
    new.raw_user_meta_data->>'sub_role',
    upper(substring(coalesce(new.raw_user_meta_data->>'full_name', new.email) from 1 for 2))
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- clinics · red de clínicas del holding
-- ----------------------------------------------------------------------------
create table if not exists clinics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text,
  status text default 'activa',
  patients_count int default 0,
  revenue_monthly numeric(12,2) default 0,
  created_at timestamptz default now()
);

alter table profiles
  add constraint profiles_clinic_fk foreign key (clinic_id) references clinics(id) on delete set null;

-- ----------------------------------------------------------------------------
-- patients · pacientes del ecosistema hormonal
-- ----------------------------------------------------------------------------
create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  assigned_doctor_id uuid references profiles(id) on delete set null,
  full_name text not null,
  age int,
  sex text check (sex in ('M','F','X')),
  protocol_type protocol_type,
  status patient_status default 'verde',
  score_hormonal int check (score_hormonal between 0 and 100),
  avatar_initials text,
  avatar_bg text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists patients_doctor_idx on patients(assigned_doctor_id);
create index if not exists patients_status_idx on patients(status);

-- ----------------------------------------------------------------------------
-- analytics_samples · analíticas hormonales
-- ----------------------------------------------------------------------------
create table if not exists analytics_samples (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  sample_date date not null default current_date,
  testosterone_free numeric(6,2),
  estradiol numeric(6,2),
  tsh numeric(6,2),
  hematocrit numeric(5,2),
  fsh numeric(6,2),
  lh numeric(6,2),
  shbg numeric(6,2),
  raw_data jsonb,
  received_at timestamptz default now()
);

create index if not exists samples_patient_idx on analytics_samples(patient_id, sample_date desc);

-- ----------------------------------------------------------------------------
-- protocols · protocolos activos por paciente (TRT, THS, Tiroides, Fertilidad)
-- ----------------------------------------------------------------------------
create table if not exists protocols (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  protocol_type protocol_type not null,
  dose_mg numeric(6,2),
  frequency text,
  status protocol_status default 'propuesto',
  proposed_by_ia boolean default false,
  proposed_at timestamptz default now(),
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejected_by uuid references profiles(id),
  rejected_at timestamptz,
  notes text
);

create index if not exists protocols_patient_idx on protocols(patient_id, status);

-- ----------------------------------------------------------------------------
-- appointments · agenda médico↔paciente
-- ----------------------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  doctor_id uuid references profiles(id) on delete set null,
  scheduled_at timestamptz not null,
  type text default 'seguimiento',
  status text default 'programada',
  notes text,
  created_at timestamptz default now()
);

create index if not exists appointments_doctor_idx on appointments(doctor_id, scheduled_at);

-- ----------------------------------------------------------------------------
-- kits · kits de analítica enviados al paciente
-- ----------------------------------------------------------------------------
create table if not exists kits (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references patients(id) on delete cascade,
  kit_type text,
  status kit_status default 'pendiente',
  tracking_code text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- conversations · hilos de Comunicación (bandeja)
-- ----------------------------------------------------------------------------
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  title text,
  channel channel default 'email',
  participant_ids uuid[] default array[]::uuid[],
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- messages · mensajes en bandeja
-- ----------------------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  channel channel default 'email',
  content text not null,
  ia_generated boolean default false,
  ia_draft boolean default false,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists messages_conv_idx on messages(conversation_id, created_at desc);

-- ----------------------------------------------------------------------------
-- alerts · alertas IA proactivas (campana del topbar)
-- ----------------------------------------------------------------------------
create table if not exists alerts (
  id uuid primary key default uuid_generate_v4(),
  target_role user_role,
  target_user_id uuid references profiles(id) on delete cascade,
  severity alert_severity default 'blue',
  category text,
  title text not null,
  body text,
  data jsonb,
  read_by uuid[] default array[]::uuid[],
  created_at timestamptz default now()
);

create index if not exists alerts_target_idx on alerts(target_role, created_at desc);

-- ----------------------------------------------------------------------------
-- ia_actions · log de acciones que hizo la IA (auditoría)
-- ----------------------------------------------------------------------------
create table if not exists ia_actions (
  id uuid primary key default uuid_generate_v4(),
  actor_user_id uuid references profiles(id),
  action_type text not null,
  target_type text,
  target_id uuid,
  input jsonb,
  output jsonb,
  model text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric(10,6),
  created_at timestamptz default now()
);

create index if not exists ia_actions_type_idx on ia_actions(action_type, created_at desc);

-- ============================================================================
-- RLS · Row-Level Security (MVP permissive · afinar según tenancy cliente)
-- ============================================================================

alter table profiles enable row level security;
alter table clinics enable row level security;
alter table patients enable row level security;
alter table analytics_samples enable row level security;
alter table protocols enable row level security;
alter table appointments enable row level security;
alter table kits enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table alerts enable row level security;
alter table ia_actions enable row level security;

-- Helper: obtener rol del usuario autenticado
create or replace function auth_role() returns user_role
language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

-- profiles
create policy "profiles self read" on profiles for select using (auth.uid() = id);
create policy "profiles director read all" on profiles for select using (auth_role() = 'director');
create policy "profiles self update" on profiles for update using (auth.uid() = id);

-- patients: paciente ve solo su propia ficha; médico ve sus asignados; director todo
create policy "patients paciente own" on patients for select using (user_id = auth.uid());
create policy "patients medico asignados" on patients for select using (assigned_doctor_id = auth.uid());
create policy "patients director read all" on patients for select using (auth_role() = 'director');
create policy "patients coord read all" on patients for select using (auth_role() = 'coordinador');

-- analytics_samples: paciente ve las suyas; médico las de sus pacientes; lab inserta
create policy "samples paciente own" on analytics_samples for select
  using (patient_id in (select id from patients where user_id = auth.uid()));
create policy "samples medico asignados" on analytics_samples for select
  using (patient_id in (select id from patients where assigned_doctor_id = auth.uid()));
create policy "samples director all" on analytics_samples for select using (auth_role() = 'director');
create policy "samples lab insert" on analytics_samples for insert with check (auth_role() = 'laboratorio');

-- protocols, appointments, kits, conversations, messages, alerts: MVP permissive
-- (afinar cuando entre cliente real según su modelo de tenancy)
create policy "protocols authenticated" on protocols for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "appointments authenticated" on appointments for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "kits authenticated" on kits for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "conversations participant" on conversations for all
  using (auth.uid() = any(participant_ids) or auth_role() = 'director')
  with check (auth.uid() = any(participant_ids) or auth_role() = 'director');
create policy "messages authenticated" on messages for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "alerts target" on alerts for select using (
  target_role = auth_role() or target_user_id = auth.uid() or auth_role() = 'director'
);
create policy "ia_actions self" on ia_actions for select using (actor_user_id = auth.uid() or auth_role() = 'director');
create policy "ia_actions insert" on ia_actions for insert with check (auth.uid() is not null);

-- clinics: director lee todas; resto solo la suya
create policy "clinics director all" on clinics for select using (auth_role() = 'director');
create policy "clinics own" on clinics for select using (id in (select clinic_id from profiles where id = auth.uid()));

-- ============================================================================
-- Seed opcional · ejecutar después de crear las cuentas auth para pruebas
-- ============================================================================
-- insert into clinics (name, city) values
--   ('Hospital Universitario La Paz','Madrid'),
--   ('Clinica Teknon','Barcelona');

-- ============================================================================
-- Notas operativas
-- ============================================================================
-- 1. Crear las cuentas en Authentication → Users con user_metadata.role correcto.
--    Ejemplo user_metadata para director:
--      { "full_name": "Jose Manuel Fernandez", "role": "director" }
-- 2. El trigger handle_new_user crea automáticamente su profile con esos datos.
-- 3. Para escalar RLS, revisar políticas según tenant del cliente.
-- 4. Añadir foreign keys de clinic_id a profiles una vez creadas las clínicas.
