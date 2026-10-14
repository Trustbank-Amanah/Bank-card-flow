-- ============================================================
-- Bank Card Collection Workflow - Initial Schema
-- ============================================================
-- Dit bestand bevat:
--   1. Extensions
--   2. Tabellen: profiles, customers, audit_log
--   3. Indexes
--   4. Row Level Security (RLS) policies
--   5. Helper functions
--   6. Triggers (updated_at, handle_new_user)
--   7. RPC's (create_customer, mark_collected, mark_email_alert_added, import_customers)
--   8. Seed: eerste ADMIN
-- ============================================================

-- ------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ------------------------------------------------------------
-- 2. TABELLEN
-- ------------------------------------------------------------

-- 2.1 profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'FRONT_OFFICER'
    check (role in ('FRONT_OFFICER','IT','ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Interne medewerkers. Gekoppeld aan auth.users via Azure AD login.';

-- 2.2 customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),

  -- Verplichte velden
  naam text not null,
  id_nummer text not null,
  additional_reference text not null,

  -- Optionele velden
  voornaam text,
  tel text,
  email_adres text,                            -- nullable: niet elke klant heeft e-mail
  status text,
  opmerking_2 text,
  pinpas_aangeleverd boolean not null default false,
  contact_gemaakt_klant boolean not null default false,
  afgehaald boolean not null default false,

  -- Workflow
  workflow_status text not null default 'PENDING'
    check (workflow_status in ('PENDING','EMAIL_ALERT_PENDING','EMAIL_ALERT_ADDED')),

  -- Tracking
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),

  -- Kaart afgehaald
  collected_at timestamptz,
  collected_by uuid references public.profiles(id),

  -- Email Alert
  email_alert_added boolean not null default false,
  email_alert_added_at timestamptz,
  email_alert_added_by uuid references public.profiles(id),

  -- Duplicate preventie
  constraint customers_unique_id_ref unique (id_nummer, additional_reference)
);

comment on table public.customers is
  'Klanten met pinpas. Bron van waarheid voor Card Collection → Email Alert workflow.';
comment on column public.customers.workflow_status is
  'PENDING = niet afgehaald; EMAIL_ALERT_PENDING = afgehaald, wacht op IT; EMAIL_ALERT_ADDED = volledig verwerkt.';

-- 2.3 audit_log
create table public.audit_log (
  id bigserial primary key,
  customer_id uuid references public.customers(id) on delete cascade,
  action text not null
    check (action in ('CREATED','UPDATED','COLLECTED','EMAIL_ALERT_ADDED','IMPORTED')),
  performed_by uuid references public.profiles(id),
  performed_at timestamptz not null default now(),
  changes jsonb,
  notes text
);

comment on table public.audit_log is
  'Onveranderlijke audit trail. Alleen insert via RPC, alleen lezen via RLS.';


-- ------------------------------------------------------------
-- 3. INDEXES
-- ------------------------------------------------------------
create index customers_workflow_status_idx on public.customers(workflow_status);
create index customers_afgehaald_idx on public.customers(afgehaald);
create index customers_email_alert_added_idx on public.customers(email_alert_added);
create index customers_naam_idx on public.customers(naam);
create index customers_voornaam_idx on public.customers(voornaam);
create index customers_id_nummer_idx on public.customers(id_nummer);
create index customers_tel_idx on public.customers(tel);
create index audit_log_customer_idx on public.audit_log(customer_id);
create index audit_log_performed_at_idx on public.audit_log(performed_at desc);


-- ------------------------------------------------------------
-- 4. HELPER FUNCTIONS
-- ------------------------------------------------------------

-- 4.1 Huidige rol van ingelogde gebruiker
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 4.2 Is gebruiker actief?
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_active from public.profiles where id = auth.uid()),
    false
  )
$$;


-- ------------------------------------------------------------
-- 5. TRIGGERS
-- ------------------------------------------------------------

-- 5.1 updated_at automatiseren
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- 5.2 Nieuwe auth.users → profiles rij aanmaken
--     Default rol: FRONT_OFFICER. ADMIN past rol aan in Supabase dashboard.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             new.email,
             'Onbekend'),
    'FRONT_OFFICER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ------------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.customers  enable row level security;
alter table public.audit_log  enable row level security;

-- 6.1 profiles
-- Eigen profiel lezen; ADMIN ziet alles.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'ADMIN');

-- Alleen ADMIN mag profielen wijzigen (via dashboard of SQL).
create policy "profiles_admin_update"
  on public.profiles for update
  using (public.current_role() = 'ADMIN');

create policy "profiles_admin_insert"
  on public.profiles for insert
  with check (public.current_role() = 'ADMIN');

-- 6.2 customers
-- Alle actieve medewerkers mogen lezen.
create policy "customers_select_active"
  on public.customers for select
  using (public.is_active_user());

-- INSERT: FRONT_OFFICER en ADMIN.
create policy "customers_insert_fo_admin"
  on public.customers for insert
  with check (
    public.is_active_user()
    and public.current_role() in ('FRONT_OFFICER','ADMIN')
  );

-- UPDATE: FRONT_OFFICER, IT en ADMIN (kolomrestricties via RPC's).
create policy "customers_update_roles"
  on public.customers for update
  using (
    public.is_active_user()
    and public.current_role() in ('FRONT_OFFICER','IT','ADMIN')
  );

-- DELETE: alleen ADMIN.
create policy "customers_delete_admin"
  on public.customers for delete
  using (public.current_role() = 'ADMIN');

-- 6.3 audit_log
-- Lezen: IT en ADMIN.
create policy "audit_select_it_admin"
  on public.audit_log for select
  using (
    public.is_active_user()
    and public.current_role() in ('IT','ADMIN')
  );

-- Insert alleen via RPC (security definer). Geen directe insert policy.


-- ------------------------------------------------------------
-- 7. RPC'S
-- ------------------------------------------------------------

-- 7.1 create_customer
create or replace function public.create_customer(
  p_naam text,
  p_id_nummer text,
  p_additional_reference text,
  p_voornaam text default null,
  p_tel text default null,
  p_email_adres text default null,
  p_status text default null,
  p_opmerking_2 text default null,
  p_pinpas_aangeleverd boolean default false,
  p_contact_gemaakt_klant boolean default false
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role();
  v_customer public.customers;
begin
  if not public.is_active_user() then
    raise exception 'Gebruiker is niet actief';
  end if;

  if v_role not in ('FRONT_OFFICER','ADMIN') then
    raise exception 'Niet geautoriseerd om klanten aan te maken';
  end if;

  -- Verplichte velden
  if p_naam is null or btrim(p_naam) = '' then
    raise exception 'Naam is verplicht';
  end if;
  if p_id_nummer is null or btrim(p_id_nummer) = '' then
    raise exception 'ID nummer is verplicht';
  end if;
  if p_additional_reference is null or btrim(p_additional_reference) = '' then
    raise exception 'Additional reference is verplicht';
  end if;

  -- Duplicate check
  if exists (
    select 1 from public.customers
    where id_nummer = btrim(p_id_nummer)
      and additional_reference = btrim(p_additional_reference)
  ) then
    raise exception 'Er bestaat al een klant met dit ID nummer en deze additional reference';
  end if;

  insert into public.customers (
    naam, id_nummer, additional_reference,
    voornaam, tel, email_adres, status, opmerking_2,
    pinpas_aangeleverd, contact_gemaakt_klant,
    workflow_status, created_by, updated_by
  ) values (
    btrim(p_naam),
    btrim(p_id_nummer),
    btrim(p_additional_reference),
    nullif(btrim(coalesce(p_voornaam,'')), ''),
    nullif(btrim(coalesce(p_tel,'')), ''),
    nullif(btrim(coalesce(p_email_adres,'')), ''),
    nullif(btrim(coalesce(p_status,'')), ''),
    nullif(btrim(coalesce(p_opmerking_2,'')), ''),
    coalesce(p_pinpas_aangeleverd, false),
    coalesce(p_contact_gemaakt_klant, false),
    'PENDING',
    auth.uid(),
    auth.uid()
  )
  returning * into v_customer;

  insert into public.audit_log(customer_id, action, performed_by, notes)
  values (v_customer.id, 'CREATED', auth.uid(), 'Klant aangemaakt');

  return v_customer;
end;
$$;

-- 7.2 mark_collected
create or replace function public.mark_collected(p_customer_id uuid)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role();
  v_customer public.customers;
begin
  if not public.is_active_user() then
    raise exception 'Gebruiker is niet actief';
  end if;

  if v_role not in ('FRONT_OFFICER','ADMIN') then
    raise exception 'Niet geautoriseerd om kaart als afgehaald te markeren';
  end if;

  update public.customers
     set afgehaald = true,
         collected_at = now(),
         collected_by = auth.uid(),
         workflow_status = 'EMAIL_ALERT_PENDING',
         updated_by = auth.uid()
   where id = p_customer_id
     and workflow_status = 'PENDING'
  returning * into v_customer;

  if not found then
    raise exception 'Klant niet gevonden of al afgehaald';
  end if;

  insert into public.audit_log(customer_id, action, performed_by, notes)
  values (p_customer_id, 'COLLECTED', auth.uid(), 'Kaart afgehaald');

  return v_customer;
end;
$$;

-- 7.3 mark_email_alert_added
create or replace function public.mark_email_alert_added(p_customer_id uuid)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role();
  v_customer public.customers;
begin
  if not public.is_active_user() then
    raise exception 'Gebruiker is niet actief';
  end if;

  if v_role not in ('IT','ADMIN') then
    raise exception 'Niet geautoriseerd om Email Alert toe te voegen';
  end if;

  update public.customers
     set email_alert_added = true,
         email_alert_added_at = now(),
         email_alert_added_by = auth.uid(),
         workflow_status = 'EMAIL_ALERT_ADDED',
         updated_by = auth.uid()
   where id = p_customer_id
     and workflow_status = 'EMAIL_ALERT_PENDING'
  returning * into v_customer;

  if not found then
    raise exception 'Klant niet gevonden of niet in EMAIL_ALERT_PENDING status';
  end if;

  insert into public.audit_log(customer_id, action, performed_by, notes)
  values (p_customer_id, 'EMAIL_ALERT_ADDED', auth.uid(), 'Email Alert toegevoegd in iMAL');

  return v_customer;
end;
$$;

-- 7.4 import_customers
create or replace function public.import_customers(p_rows jsonb)
returns table (imported int, skipped int, errors jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role();
  r record;
  v_imported int := 0;
  v_skipped int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_new_id uuid;
begin
  if not public.is_active_user() then
    raise exception 'Gebruiker is niet actief';
  end if;

  if v_role <> 'ADMIN' then
    raise exception 'Alleen ADMIN mag importeren';
  end if;

  for r in
    select * from jsonb_to_recordset(p_rows) as x(
      naam text,
      voornaam text,
      id_nummer text,
      additional_reference text,
      tel text,
      email_adres text,
      status text,
      opmerking_2 text,
      pinpas_aangeleverd boolean,
      contact_gemaakt_klant boolean,
      afgehaald boolean,
      email_alert_added boolean
    )
  loop
    -- Validatie verplichte velden
    if r.naam is null or btrim(r.naam) = ''
       or r.id_nummer is null or btrim(r.id_nummer) = ''
       or r.additional_reference is null or btrim(r.additional_reference) = '' then
      v_skipped := v_skipped + 1;
      v_errors := v_errors || jsonb_build_object(
        'id_nummer', r.id_nummer,
        'additional_reference', r.additional_reference,
        'reason', 'Verplichte velden ontbreken'
      );
      continue;
    end if;

    -- Duplicate check
    if exists (
      select 1 from public.customers
      where id_nummer = btrim(r.id_nummer)
        and additional_reference = btrim(r.additional_reference)
    ) then
      v_skipped := v_skipped + 1;
      v_errors := v_errors || jsonb_build_object(
        'id_nummer', r.id_nummer,
        'additional_reference', r.additional_reference,
        'reason', 'Bestaat al'
      );
      continue;
    end if;

    insert into public.customers (
      naam, voornaam, id_nummer, additional_reference,
      tel, email_adres, status, opmerking_2,
      pinpas_aangeleverd, contact_gemaakt_klant,
      afgehaald, email_alert_added,
      workflow_status,
      collected_at, collected_by,
      email_alert_added_at, email_alert_added_by,
      created_by, updated_by
    ) values (
      btrim(r.naam),
      nullif(btrim(coalesce(r.voornaam,'')), ''),
      btrim(r.id_nummer),
      btrim(r.additional_reference),
      nullif(btrim(coalesce(r.tel,'')), ''),
      nullif(btrim(coalesce(r.email_adres,'')), ''),
      nullif(btrim(coalesce(r.status,'')), ''),
      nullif(btrim(coalesce(r.opmerking_2,'')), ''),
      coalesce(r.pinpas_aangeleverd, false),
      coalesce(r.contact_gemaakt_klant, false),
      coalesce(r.afgehaald, false),
      coalesce(r.email_alert_added, false),
      case
        when coalesce(r.email_alert_added, false) then 'EMAIL_ALERT_ADDED'
        when coalesce(r.afgehaald, false) then 'EMAIL_ALERT_PENDING'
        else 'PENDING'
      end,
      case when coalesce(r.afgehaald, false) then now() else null end,
      case when coalesce(r.afgehaald, false) then auth.uid() else null end,
      case when coalesce(r.email_alert_added, false) then now() else null end,
      case when coalesce(r.email_alert_added, false) then auth.uid() else null end,
      auth.uid(),
      auth.uid()
    )
    returning id into v_new_id;

    insert into public.audit_log(customer_id, action, performed_by, notes)
    values (v_new_id, 'IMPORTED', auth.uid(), 'Geïmporteerd uit Excel/CSV');

    v_imported := v_imported + 1;
  end loop;

  return query select v_imported, v_skipped, v_errors;
end;
$$;


-- ------------------------------------------------------------
-- 8. GRANTS
-- ------------------------------------------------------------
-- RPC's uitvoerbaar door ingelogde gebruikers; autorisatie in functie zelf.
grant execute on function public.create_customer(
  text, text, text, text, text, text, text, text, boolean, boolean
) to authenticated;

grant execute on function public.mark_collected(uuid) to authenticated;
grant execute on function public.mark_email_alert_added(uuid) to authenticated;
grant execute on function public.import_customers(jsonb) to authenticated;


-- ------------------------------------------------------------
-- 9. SEED: eerste ADMIN
-- ------------------------------------------------------------
-- BELANGRIJK:
--   1. Laat de persoon eerst één keer inloggen via Azure AD.
--   2. Vervang daarna het e-mailadres hieronder.
--   3. Voer dit statement uit.

-- update public.profiles
--    set role = 'ADMIN'
--  where email = 'jouw.email@bank.nl';

-- Voorbeeld IT-rol toekennen:
-- update public.profiles
--    set role = 'IT'
--  where email = 'it.medewerker@bank.nl';