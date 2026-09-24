-- ═══════════════════════════════════════════════════════════════════════════
--  ORION — Complete Database Schema Migration
--  Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enable UUID extension ────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Enum Types ───────────────────────────────────────────────────────────────
do $$ begin
  create type project_status as enum ('draft','active','analyzing','review','complete','archived');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type source_type as enum ('srs_document','meeting_transcript','business_notes','client_email','manual_text','other');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type source_status as enum ('pending','processing','processed','failed');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type requirement_type as enum ('functional','non_functional');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type requirement_priority as enum ('critical','high','medium','low');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type requirement_status as enum ('draft','confirmed','rejected','deferred');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type analysis_status as enum ('queued','running','completed','failed');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type insight_severity as enum ('info','warning','critical','opportunity');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type risk_level as enum ('low','medium','high','critical');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type sprint_status as enum ('planned','active','completed','cancelled');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('todo','in_progress','done','blocked');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_priority as enum ('critical','high','medium','low');
  exception when duplicate_object then null;
end $$;

do $$ begin
  create type member_role as enum ('owner','admin','member','viewer');
  exception when duplicate_object then null;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: profiles
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  avatar_url      text,
  organization_id uuid,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- Auto-create profile and organization/workspace on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_id uuid;
  org_name text;
  org_slug text;
  name_part text;
  join_org_id uuid;
  join_role text;
begin
  -- 1. Create the profile first (so organizations FK check passes)
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  -- 2. Check if user is joining an existing organization
  begin
    join_org_id := nullif(new.raw_user_meta_data->>'join_organization_id', '')::uuid;
  exception when others then
    join_org_id := null;
  end;
  join_role := coalesce(nullif(new.raw_user_meta_data->>'join_role', ''), 'member');

  if join_org_id is not null then
    -- ── Path A: Join existing organization ──────────────────────────────────

    -- Validate the organization exists
    if not exists (select 1 from organizations where id = join_org_id) then
      raise exception 'Organization % does not exist', join_org_id;
    end if;

    -- Link profile to the organization
    update profiles
    set organization_id = join_org_id
    where id = new.id;

    -- Add membership with chosen role (ignore if already a member)
    insert into organization_members (organization_id, user_id, role)
    values (join_org_id, new.id, join_role::member_role)
    on conflict (organization_id, user_id) do nothing;

  else
    -- ── Path B: Create a new organization ───────────────────────────────────

    -- Determine organization name
    org_name := coalesce(
      nullif(new.raw_user_meta_data->>'organization', ''),
      coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || ' Workspace'
    );

    -- Create a unique slug
    org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    org_slug := trim(both '-' from org_slug);
    if org_slug = '' then
      org_slug := 'workspace';
    end if;
    org_slug := org_slug || '-' || substring(md5(random()::text) from 1 for 6);

    -- Create the organization
    insert into organizations (name, slug, owner_id)
    values (org_name, org_slug, new.id)
    returning id into org_id;

    -- Link profile to the new organization
    update profiles
    set organization_id = org_id
    where id = new.id;

    -- Add membership as owner
    insert into organization_members (organization_id, user_id, role)
    values (org_id, new.id, 'owner');

  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: organizations
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  logo_url   text,
  plan       text not null default 'free' check (plan in ('free','pro','enterprise')),
  owner_id   uuid not null references profiles(id) on delete restrict,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- FK from profiles -> organizations (added after both tables exist)
-- Postgres has no "ADD CONSTRAINT IF NOT EXISTS", so we guard it with a DO block instead.
do $$ begin
  alter table profiles
    add constraint fk_profiles_organization
    foreign key (organization_id) references organizations(id) on delete set null;
  exception when duplicate_object then null;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: organization_members
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists organization_members (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references profiles(id) on delete cascade,
  role            member_role not null default 'member',
  joined_at       timestamptz default now() not null,
  primary key (organization_id, user_id)
);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: projects
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by      uuid not null references profiles(id) on delete restrict,
  name            text not null,
  description     text,
  status          project_status not null default 'draft',
  domain          text,
  tech_stack      text[],
  team_size       int,
  color           text,
  metadata        jsonb,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);
create index if not exists idx_projects_org    on projects(organization_id);
create index if not exists idx_projects_status on projects(status);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: requirement_sources
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists requirement_sources (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  uploaded_by       uuid not null references profiles(id) on delete restrict,
  source_type       source_type not null,
  title             text not null,
  description       text,
  file_path         text,
  file_name         text,
  file_size_bytes   bigint,
  mime_type         text,
  raw_text          text,
  extracted_text    text,
  status            source_status not null default 'pending',
  word_count        int,
  page_count        int,
  processing_error  text,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);
create index if not exists idx_sources_project on requirement_sources(project_id);
create index if not exists idx_sources_status  on requirement_sources(status);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: analysis_runs
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists analysis_runs (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects(id) on delete cascade,
  triggered_by   uuid not null references profiles(id) on delete restrict,
  status         analysis_status not null default 'queued',
  source_ids     uuid[] not null default '{}',
  model_used     text,
  tokens_used    int,
  duration_ms    int,
  error_message  text,
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);
create index if not exists idx_runs_project on analysis_runs(project_id);
create index if not exists idx_runs_status  on analysis_runs(status);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: project_intelligence
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists project_intelligence (
  id                         uuid primary key default gen_random_uuid(),
  project_id                 uuid not null references projects(id) on delete cascade,
  analysis_run_id            uuid not null references analysis_runs(id) on delete cascade,
  project_overview           jsonb,
  business_objectives        jsonb,
  assumptions                text[],
  constraints                text[],
  dependencies               jsonb,
  technology_recommendations jsonb,
  out_of_scope               text[],
  glossary                   jsonb,
  confidence_score           numeric(4,3),
  ambiguity_flags            jsonb,
  raw_agent_output           jsonb,
  created_at                 timestamptz default now() not null,
  updated_at                 timestamptz default now() not null,
  unique (project_id, analysis_run_id)
);
create index if not exists idx_intelligence_project on project_intelligence(project_id);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: requirements
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists requirements (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references projects(id) on delete cascade,
  analysis_run_id         uuid not null references analysis_runs(id) on delete cascade,
  source_ids              uuid[] not null default '{}',
  req_type                requirement_type not null,
  category                text,
  module                  text,
  title                   text not null,
  description             text not null,
  acceptance_criteria     text[],
  priority                requirement_priority not null default 'medium',
  status                  requirement_status not null default 'draft',
  complexity              text check (complexity in ('simple','medium','complex')),
  estimated_effort_hours  numeric(6,1),
  tags                    text[],
  original_text           text,
  source_line_ref         text,
  linked_requirement_ids  uuid[],
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);
create index if not exists idx_req_project  on requirements(project_id);
create index if not exists idx_req_type     on requirements(req_type);
create index if not exists idx_req_priority on requirements(priority);
create index if not exists idx_req_status   on requirements(status);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: stakeholders
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists stakeholders (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  analysis_run_id uuid not null references analysis_runs(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('internal','external','system')),
  description     text,
  goals           text[],
  interactions    text[],
  created_at      timestamptz default now() not null
);
create index if not exists idx_stakeholders_project on stakeholders(project_id);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: system_modules
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists system_modules (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  analysis_run_id uuid not null references analysis_runs(id) on delete cascade,
  name            text not null,
  description     text,
  sub_modules     text[],
  key_features    text[],
  dependencies    text[],
  created_at      timestamptz default now() not null
);
create index if not exists idx_modules_project on system_modules(project_id);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: ai_insights
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists ai_insights (
  id                        uuid primary key default gen_random_uuid(),
  project_id                uuid not null references projects(id) on delete cascade,
  analysis_run_id           uuid references analysis_runs(id) on delete set null,
  severity                  insight_severity not null,
  category                  text not null check (category in ('scope','risk','ambiguity','opportunity','dependency','effort')),
  title                     text not null,
  description               text not null,
  affected_requirement_ids  uuid[],
  metric_label              text,
  action_label              text,
  is_dismissed              boolean not null default false,
  created_at                timestamptz default now() not null
);
create index if not exists idx_insights_project  on ai_insights(project_id);
create index if not exists idx_insights_severity on ai_insights(severity);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: risks
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists risks (
  id                        uuid primary key default gen_random_uuid(),
  project_id                uuid not null references projects(id) on delete cascade,
  analysis_run_id           uuid references analysis_runs(id) on delete set null,
  title                     text not null,
  description               text not null,
  category                  text not null check (category in ('technical','resource','scope','timeline','external','security')),
  level                     risk_level not null,
  probability               numeric(4,3) check (probability between 0 and 1),
  impact                    numeric(4,3) check (impact between 0 and 1),
  mitigation_strategy       text,
  affected_requirement_ids  uuid[],
  is_resolved               boolean not null default false,
  created_at                timestamptz default now() not null,
  updated_at                timestamptz default now() not null
);
create index if not exists idx_risks_project on risks(project_id);
create index if not exists idx_risks_level   on risks(level);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: sprints
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists sprints (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  name             text not null,
  goal             text,
  sprint_number    int not null,
  status           sprint_status not null default 'planned',
  start_date       date,
  end_date         date,
  velocity_points  int,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,
  unique (project_id, sprint_number)
);
create index if not exists idx_sprints_project on sprints(project_id);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: tasks
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists tasks (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  sprint_id         uuid references sprints(id) on delete set null,
  requirement_id    uuid references requirements(id) on delete set null,
  created_by        uuid not null references profiles(id) on delete restrict,
  assigned_to       uuid references profiles(id) on delete set null,
  title             text not null,
  description       text,
  status            task_status not null default 'todo',
  priority          task_priority not null default 'medium',
  story_points      int,
  estimated_hours   numeric(6,1),
  actual_hours      numeric(6,1),
  tags              text[],
  due_date          date,
  completed_at      timestamptz,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);
create index if not exists idx_tasks_project  on tasks(project_id);
create index if not exists idx_tasks_sprint   on tasks(sprint_id);
create index if not exists idx_tasks_status   on tasks(status);
create index if not exists idx_tasks_assigned on tasks(assigned_to);


-- ════════════════════════════════════════════════════════════════════════════
--  TABLE: project_reports
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists project_reports (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  analysis_run_id  uuid references analysis_runs(id) on delete set null,
  generated_by     uuid not null references profiles(id) on delete restrict,
  report_type      text not null check (report_type in ('requirement_summary','sprint_plan','risk_matrix','full_project_plan','estimation')),
  title            text not null,
  file_path        text,
  content          jsonb,
  is_published     boolean not null default false,
  created_at       timestamptz default now() not null
);
create index if not exists idx_reports_project on project_reports(project_id);


-- ════════════════════════════════════════════════════════════════════════════
--  UPDATED_AT TRIGGERS
-- ════════════════════════════════════════════════════════════════════════════
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','organizations','projects','requirement_sources',
    'analysis_runs','project_intelligence','requirements','risks','sprints','tasks'
  ] loop
    execute format(
      'drop trigger if exists trg_updated_at on %I;
       create trigger trg_updated_at before update on %I
       for each row execute procedure touch_updated_at();', t, t
    );
  end loop;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════
alter table profiles              enable row level security;
alter table organizations         enable row level security;
alter table organization_members  enable row level security;
alter table projects              enable row level security;
alter table requirement_sources   enable row level security;
alter table analysis_runs         enable row level security;
alter table project_intelligence  enable row level security;
alter table requirements          enable row level security;
alter table stakeholders          enable row level security;
alter table system_modules        enable row level security;
alter table ai_insights           enable row level security;
alter table risks                 enable row level security;
alter table sprints               enable row level security;
alter table tasks                 enable row level security;
alter table project_reports       enable row level security;

-- Own profile
drop policy if exists "Own profile" on profiles;
create policy "Own profile" on profiles
  for all using (auth.uid() = id);

-- Org members can see their org
drop policy if exists "Org members can view" on organizations;
create policy "Org members can view" on organizations
  for select using (
    id in (select organization_id from organization_members where user_id = auth.uid())
  );

-- Org members can view their own membership rows
drop policy if exists "Membership access" on organization_members;
create policy "Membership access" on organization_members
  for select using (user_id = auth.uid());

-- Project access for org members
-- (fixed: was unfiltered, allowing access to ANY project regardless of org membership)
drop policy if exists "Project access" on projects;
create policy "Project access" on projects
  for all using (
    organization_id in (
      select organization_id from organization_members where user_id = auth.uid()
    )
  );

-- All child tables inherit access through project -> organization membership
-- (fixed: previously used `project_id in (select id from projects)`, which is
--  unfiltered and effectively grants access to every project's child rows to
--  any authenticated user. Now scoped to the caller's org membership.)
drop policy if exists "Source access" on requirement_sources;
create policy "Source access" on requirement_sources
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Run access" on analysis_runs;
create policy "Run access" on analysis_runs
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Intelligence access" on project_intelligence;
create policy "Intelligence access" on project_intelligence
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Requirement access" on requirements;
create policy "Requirement access" on requirements
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Stakeholder access" on stakeholders;
create policy "Stakeholder access" on stakeholders
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Module access" on system_modules;
create policy "Module access" on system_modules
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Insight access" on ai_insights;
create policy "Insight access" on ai_insights
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Risk access" on risks;
create policy "Risk access" on risks
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Sprint access" on sprints;
create policy "Sprint access" on sprints
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Task access" on tasks;
create policy "Task access" on tasks
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

drop policy if exists "Report access" on project_reports;
create policy "Report access" on project_reports
  for all using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════════════════════
--  DONE
--  Tables: 15  |  Enums: 13  |  Triggers: auto-profile + updated_at x10
--  RLS: enabled on all 15 tables, all child-table policies scoped through
--       project -> organization_members (org-membership) rather than
--       unfiltered access to the full `projects` table.
-- ════════════════════════════════════════════════════════════════════════════