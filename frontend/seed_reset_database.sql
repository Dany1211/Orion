-- ═══════════════════════════════════════════════════════════════════════════
--  ORION — COMPLETE DATABASE TRUNCATE & FRESH SEED SCRIPT
--  Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── STEP 1: SAFELY CLEAN PREVIOUS PROJECT & CLIENT DATA ────────────────────
-- (Leaves auth.users and profiles intact so your login session remains valid!)
DO $$
BEGIN
  -- Truncate child and relational tables in dependency order
  TRUNCATE TABLE
    public.client_approvals,
    public.client_meetings,
    public.client_pm_messages,
    public.client_portal_configs,
    public.project_clients,
    public.clients,
    public.project_github_integrations,
    public.project_reports,
    public.tasks,
    public.sprints,
    public.risks,
    public.ai_insights,
    public.system_modules,
    public.stakeholders,
    public.requirements,
    public.project_intelligence,
    public.analysis_runs,
    public.requirement_sources,
    public.projects
  CASCADE;
END $$;

-- ── STEP 2: INSERT SEED DATA LINKED TO YOUR EXISTING PROFILE & ORG ──────────
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_project_id uuid := gen_random_uuid();
  v_source_id uuid := gen_random_uuid();
  v_run_id uuid := gen_random_uuid();
  v_sprint_1_id uuid := gen_random_uuid();
  v_sprint_2_id uuid := gen_random_uuid();
  v_sprint_3_id uuid := gen_random_uuid();
  v_req_1_id uuid := gen_random_uuid();
  v_req_2_id uuid := gen_random_uuid();
  v_req_3_id uuid := gen_random_uuid();
  v_req_4_id uuid := gen_random_uuid();
  v_client_1_id uuid := gen_random_uuid();
  v_client_2_id uuid := gen_random_uuid();
BEGIN
  -- 1. Identify primary profile from profiles table
  SELECT id INTO v_user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  
  -- Fallback if no profile exists yet
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
      VALUES (v_user_id, 'manager@orion.dev', 'Lead Project Director', now(), now())
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;

  -- 2. Identify or create organization
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
  IF v_org_id IS NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO public.organizations (name, slug, plan, owner_id)
    VALUES ('Orion Enterprise Engineering', 'orion-enterprise-' || substr(md5(random()::text), 1, 6), 'enterprise', v_user_id)
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'owner')
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles SET organization_id = v_org_id WHERE id = v_user_id;
  END IF;

  -- If still no organization, abort gracefully
  IF v_org_id IS NULL OR v_user_id IS NULL THEN
    RAISE NOTICE 'Please sign in or create at least one user before running this seed script.';
    RETURN;
  END IF;

  -- ── 3. INSERT PRIMARY FLAGSHIP PROJECT ───────────────────────────────────
  INSERT INTO public.projects (
    id, organization_id, created_by, name, description, status, domain, tech_stack, team_size, color, metadata
  ) VALUES (
    v_project_id,
    v_org_id,
    v_user_id,
    'NexusPay — Cross-Border Treasury & WebRTC Clearing Hub',
    'Next-generation multi-currency settlement platform featuring automated liquidity balancing, peer-to-peer WebRTC executive syncs, client milestone approvals, and sub-second clearing protocols.',
    'active',
    'FinTech & Infrastructure',
    ARRAY['Next.js 15', 'TypeScript', 'Supabase', 'WebRTC', 'TailwindCSS', 'PostgreSQL'],
    8,
    '#6366F1',
    jsonb_build_object(
      'budget', '$240,000',
      'target_launch', (now() + interval '90 days')::date,
      'client_name', 'Apex Global Treasury'
    )
  );

  -- ── 4. INSERT REQUIREMENT SOURCE ─────────────────────────────────────────
  INSERT INTO public.requirement_sources (
    id, project_id, uploaded_by, source_type, title, file_name, file_size_bytes, status
  ) VALUES (
    v_source_id,
    v_project_id,
    v_user_id,
    'srs_document',
    'NexusPay System Architecture & Treasury Requirements Specification (v2.4)',
    'NexusPay_SRS_v2.4_Final.pdf',
    2457600,
    'processed'
  );

  -- ── 5. INSERT ANALYSIS RUN ───────────────────────────────────────────────
  INSERT INTO public.analysis_runs (
    id, project_id, triggered_by, status, source_ids, model_used, tokens_used, duration_ms, started_at, completed_at
  ) VALUES (
    v_run_id,
    v_project_id,
    v_user_id,
    'completed',
    ARRAY[v_source_id],
    'gemini-2.0-flash',
    42800,
    3420,
    now() - interval '2 days',
    now() - interval '2 days' + interval '4 seconds'
  );

  -- ── 6. INSERT PROJECT INTELLIGENCE ───────────────────────────────────────
  INSERT INTO public.project_intelligence (
    project_id, analysis_run_id, project_overview, business_objectives, assumptions, constraints, confidence_score
  ) VALUES (
    v_project_id,
    v_run_id,
    jsonb_build_object(
      'summary', 'NexusPay provides bank-grade ISO 20022 compliant clearing rails combined with Orion WebRTC interactive client portals.',
      'architectural_readiness', 'Production Ready',
      'core_stack', 'Distributed Next.js Edge + Supabase Realtime Signaling'
    ),
    jsonb_build_object(
      'primary_goal', 'Enable sub-second FX transactions with 99.999% ledger consistency',
      'secondary_goal', 'Deliver seamless transparent client governance and live executive video milestone review'
    ),
    ARRAY['Supabase Realtime handles WebRTC ICE candidate signaling', 'Client participants authenticate via deterministic passcodes'],
    ARRAY['Latency must remain strictly under 150ms for live media streams', 'All client transactions must record tamper-evident audit trails'],
    0.985
  );

  -- ── 7. INSERT REQUIREMENTS ───────────────────────────────────────────────
  INSERT INTO public.requirements (
    id, project_id, analysis_run_id, req_type, category, module, title, description, priority, status, complexity, estimated_effort_hours, acceptance_criteria
  ) VALUES
  (
    v_req_1_id,
    v_project_id,
    v_run_id,
    'functional',
    'Collaboration',
    'Realtime Video Hub',
    'Peer-to-Peer Encrypted WebRTC Video Meeting Suite',
    'Bi-directional audio/video communication channel between Project Managers and Client Stakeholders with polite negotiation glare handling, screen share, and instant meeting notes.',
    'critical',
    'confirmed',
    'complex',
    36.0,
    ARRAY['Two-way camera feeds render simultaneously for PM and Client', 'Invite link includes role routing (?role=client)', 'Live notes sync in real-time']
  ),
  (
    v_req_2_id,
    v_project_id,
    v_run_id,
    'functional',
    'Security & Access',
    'Client Portal Governance',
    'Multi-Client Passcode Authentication & Visibility Controls',
    'Role-gated executive portal allowing PMs to assign specific clients, generate instant passcodes, and toggle visibility over Sprints, GitHub commits, and Financials.',
    'critical',
    'confirmed',
    'medium',
    24.0,
    ARRAY['Clients authenticate using email and unique 6-part passcode', 'Unauthenticated visitors cannot access internal modules', 'Visibility toggles update instantaneously']
  ),
  (
    v_req_3_id,
    v_project_id,
    v_run_id,
    'functional',
    'Core Financials',
    'Treasury Settlement Engine',
    'Multi-Currency Liquidity Pool & Real-Time FX Converter',
    'Automated treasury rebalancing module executing ISO 20022 message formatting across 14 fiat currency pairs.',
    'high',
    'confirmed',
    'complex',
    48.0,
    ARRAY['Rebalancing triggers automatically on liquidity drop below 20%', 'Audit records persist to Supabase ledger']
  ),
  (
    v_req_4_id,
    v_project_id,
    v_run_id,
    'non_functional',
    'Reliability',
    'Infrastructure',
    'Sub-200ms Signaling & Zero-Glitch WebRTC Negotiation',
    'Signaling server resilience ensuring polite-peer state machine cleanly resolves collisions when both peers join concurrently.',
    'high',
    'confirmed',
    'simple',
    12.0,
    ARRAY['ICE candidate buffering prevents premature setRemoteDescription crashes', 'Auto-recovery on temporary packet drop']
  );

  -- ── 8. INSERT SYSTEM MODULES ─────────────────────────────────────────────
  INSERT INTO public.system_modules (
    project_id, analysis_run_id, name, description, sub_modules, key_features
  ) VALUES
  (
    v_project_id,
    v_run_id,
    'WebRTC Video & Realtime Hub',
    'Low-latency peer-to-peer media streaming, ICE signaling exchange, screen sharing, and dynamic meeting minutes recording.',
    ARRAY['Media Stream Controller', 'Supabase Realtime Signaling Channel', 'AI Note Summarizer'],
    ARRAY['Deterministic Glare Prevention', 'Full Camera & Mic Controls', 'One-Click Room Sharing']
  ),
  (
    v_project_id,
    v_run_id,
    'Client Executive Portal & Approvals',
    'Branded delivery portal for client partners with sprint tracking, direct communication chat, and milestone sign-off workflows.',
    ARRAY['Passcode Auth Wall', 'Milestone Review Hub', 'Direct Messenger'],
    ARRAY['Granular Visibility Governance', 'Live Status Tracking', 'Audit Logging']
  ),
  (
    v_project_id,
    v_run_id,
    'Treasury Settlement Engine',
    'High-throughput distributed ledger clearing hub supporting real-time liquidity balancing and FX market depth analysis.',
    ARRAY['Liquidity Balancer', 'FX Routing Matrix', 'ISO 20022 Validator'],
    ARRAY['Sub-second Execution', 'Real-Time Rate Feeds', 'Tamper-Evident History']
  );

  -- ── 9. INSERT SPRINTS ────────────────────────────────────────────────────
  INSERT INTO public.sprints (
    id, project_id, sprint_number, name, goal, status, start_date, end_date, velocity_points
  ) VALUES
  (
    v_sprint_1_id,
    v_project_id,
    1,
    'Sprint 1 — Core Infrastructure & Architecture',
    'Deploy Supabase database schema, authenticate core user roles, and establish baseline treasury data contracts.',
    'completed',
    (CURRENT_DATE - interval '21 days')::date,
    (CURRENT_DATE - interval '7 days')::date,
    42
  ),
  (
    v_sprint_2_id,
    v_project_id,
    2,
    'Sprint 2 — WebRTC Video Suite & Client Governance',
    'Implement bi-directional camera streaming, resolve WebRTC offer glares, build dedicated client portal tabs, and enable live milestone approvals.',
    'active',
    (CURRENT_DATE - interval '6 days')::date,
    (CURRENT_DATE + interval '8 days')::date,
    48
  ),
  (
    v_sprint_3_id,
    v_project_id,
    3,
    'Sprint 3 — Production Hardening & Audit Verification',
    'Execute load tests on FX routing matrix, conduct security vulnerability assessments, and finalize ISO 20022 compliance verification.',
    'planned',
    (CURRENT_DATE + interval '9 days')::date,
    (CURRENT_DATE + interval '23 days')::date,
    38
  );

  -- ── 10. INSERT TASKS ─────────────────────────────────────────────────────
  INSERT INTO public.tasks (
    project_id, sprint_id, requirement_id, created_by, title, description, status, priority, story_points, estimated_hours
  ) VALUES
  (
    v_project_id,
    v_sprint_2_id,
    v_req_1_id,
    v_user_id,
    'Resolve WebRTC Offer Glare with Deterministic Politeness',
    'Implement polite/impolite state machine using random peer identifiers to prevent race conditions during simultaneous camera startup.',
    'done',
    'critical',
    5,
    12.0
  ),
  (
    v_project_id,
    v_sprint_2_id,
    v_req_1_id,
    v_user_id,
    'Dynamic Participant Room Routing with ?role=client',
    'Ensure all meeting invitation links and dashboard launchers automatically inject the role query parameter for immediate client handshake.',
    'done',
    'high',
    3,
    6.0
  ),
  (
    v_project_id,
    v_sprint_2_id,
    v_req_2_id,
    v_user_id,
    'Multi-Tab Project Manager Interface Refactor',
    'Separate cluttered UI into distinct Live Now, Scheduled & Upcoming, and Past History & Minutes viewports with full delete capabilities.',
    'done',
    'high',
    5,
    10.0
  ),
  (
    v_project_id,
    v_sprint_2_id,
    v_req_2_id,
    v_user_id,
    'Interactive Client Portal Passcode Login Flow',
    'Build client session authentication reading assigned project credentials from Supabase project_clients table.',
    'in_progress',
    'high',
    5,
    14.0
  ),
  (
    v_project_id,
    v_sprint_3_id,
    v_req_3_id,
    v_user_id,
    'ISO 20022 Financial Clearing Compliance Test Suite',
    'Develop automated unit testing verifying multi-currency XML envelopes match international settlement standards.',
    'todo',
    'medium',
    8,
    20.0
  );

  -- ── 11. INSERT RISKS & AI INSIGHTS ───────────────────────────────────────
  INSERT INTO public.risks (
    project_id, analysis_run_id, title, description, category, level, probability, impact, mitigation_strategy, is_resolved
  ) VALUES
  (
    v_project_id,
    v_run_id,
    'STUN/TURN Symmetric NAT Traversal Blockage',
    'Strict corporate firewalls might block direct P2P UDP media traffic without a configured TURN relay server.',
    'technical',
    'medium',
    0.35,
    0.75,
    'Standard STUN fallback configured; recommended provisioning dedicated Coturn TURN relay for production enterprise clients.',
    false
  ),
  (
    v_project_id,
    v_run_id,
    'Regulatory Audit Frequency on Multi-Currency Transactions',
    'Real-time FX conversions across European and US banking rails require immutable transaction receipts.',
    'security',
    'low',
    0.20,
    0.60,
    'Persist encrypted hash of every settlement to Supabase audit log table with automatic timestamptz verification.',
    true
  );

  INSERT INTO public.ai_insights (
    project_id, analysis_run_id, severity, category, title, description, metric_label, action_label
  ) VALUES
  (
    v_project_id,
    v_run_id,
    'opportunity',
    'scope',
    'Seamless Executive Client Experience Detected',
    'By integrating the WebRTC video stream directly inside Orion alongside live meeting minutes, client feedback turnaround accelerates by 45%.',
    '45% Faster Sign-off',
    'Launch Video Room'
  ),
  (
    v_project_id,
    v_run_id,
    'info',
    'dependency',
    'High Velocity on Sprint 2 Governance Deliverables',
    'Client portal visibility governance and client assignment modules are tracking 2 days ahead of schedule.',
    '+2 Days Ahead',
    'Review Sprints'
  );

  -- ── 12. INSERT CLIENT DIRECTORY & PROJECT ASSIGNMENTS ────────────────────
  INSERT INTO public.clients (
    id, name, email, company, phone, passcode
  ) VALUES
  (
    v_client_1_id,
    'Sarah Jenkins',
    'sarah@apexglobal.com',
    'Apex Global Treasury Partners',
    '+1 (415) 890-2134',
    'ORION-PASS-2026'
  ),
  (
    v_client_2_id,
    'Michael Chen',
    'michael@horizontreasury.io',
    'Horizon Financial Holdings',
    '+1 (650) 412-9850',
    'HORIZON-2026'
  );

  INSERT INTO public.project_clients (
    project_id, client_id, client_name, client_email, client_company, passcode, is_active
  ) VALUES
  (
    v_project_id,
    v_client_1_id,
    'Sarah Jenkins',
    'sarah@apexglobal.com',
    'Apex Global Treasury Partners',
    'ORION-PASS-2026',
    true
  ),
  (
    v_project_id,
    v_client_2_id,
    'Michael Chen',
    'michael@horizontreasury.io',
    'Horizon Financial Holdings',
    'HORIZON-2026',
    true
  );

  -- ── 13. INSERT CLIENT PORTAL CONFIG ──────────────────────────────────────
  INSERT INTO public.client_portal_configs (
    project_id,
    client_name,
    client_company,
    client_email,
    access_passcode,
    is_portal_active,
    welcome_heading,
    welcome_message,
    show_overview,
    show_requirements,
    show_sprints,
    show_github,
    show_risks,
    show_reports,
    show_budget,
    show_meetings,
    allow_approvals,
    allow_direct_chat,
    live_preview_url
  ) VALUES (
    v_project_id,
    'Sarah Jenkins',
    'Apex Global Treasury Partners',
    'sarah@apexglobal.com',
    'ORION-PASS-2026',
    true,
    'NexusPay Executive Delivery & Governance Portal',
    'Welcome Sarah. Inspect active sprint milestones, test real-time WebRTC meetings, review confirmed technical specifications, and sign off on project deliverables.',
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    'https://orion-two-woad.vercel.app/client'
  );

  -- ── 14. INSERT CLIENT MEETINGS (1 LIVE / UPCOMING & 1 COMPLETED) ─────────
  INSERT INTO public.client_meetings (
    project_id, title, room_id, scheduled_at, duration_minutes, status, host_name, client_attendee, agenda, live_notes, ai_summary, action_items
  ) VALUES
  (
    v_project_id,
    'Sprint 2 Milestone & Two-Way WebRTC Video Verification',
    'nexus-milestone-review',
    now() + interval '10 minutes',
    45,
    'scheduled',
    'Project Lead',
    'Sarah Jenkins (Apex Global)',
    'Review Sprint 2 deliverables, demonstrate live two-way camera WebRTC streaming, and sign off on client visibility controls.',
    'Meeting Agenda confirmed: 1. Live video connectivity test. 2. Sprint 2 demo. 3. Sign-off protocol.',
    NULL,
    '[]'::jsonb
  ),
  (
    v_project_id,
    'NexusPay Kickoff & Architectural Baseline Sync',
    'nexus-kickoff-sync',
    now() - interval '5 days',
    60,
    'completed',
    'Project Lead',
    'Sarah Jenkins (Apex Global)',
    'Establish project scope, finalize tech stack selection, and confirm key delivery deadlines.',
    'Agreed on Next.js 15 App Router architecture with Supabase Realtime signaling. Sarah approved budget allocation for the WebRTC integration module.',
    'The project kickoff concluded with unanimous alignment on the delivery timeline. All stakeholders approved the core technical stack and initial risk mitigations.',
    jsonb_build_array(
      'Deploy initial database migrations to Supabase',
      'Finalize WebRTC glare resolution state machine',
      'Issue client credentials to Sarah Jenkins'
    )
  );

  -- ── 15. INSERT REALTIME CLIENT CHAT MESSAGES ─────────────────────────────
  INSERT INTO public.client_pm_messages (
    project_id, sender_role, sender_name, sender_email, content, topic, is_pinned, created_at
  ) VALUES
  (
    v_project_id,
    'pm',
    'Project Manager',
    'manager@orion.dev',
    'Welcome to your dedicated Orion Executive Portal! We have activated your real-time video room and milestone tracking for Sprint 2.',
    'General',
    true,
    now() - interval '3 hours'
  ),
  (
    v_project_id,
    'client',
    'Sarah Jenkins',
    'sarah@apexglobal.com',
    'Thanks! The new portal looks incredible. I reviewed the Sprint 2 deliverables and will join the live video review shortly.',
    'General',
    false,
    now() - interval '2 hours'
  ),
  (
    v_project_id,
    'pm',
    'Project Manager',
    'manager@orion.dev',
    'Great! You can enter the live video room directly with your camera enabled from the Meetings tab.',
    'Meetings',
    false,
    now() - interval '1 hour'
  );

  -- ── 16. INSERT CLIENT APPROVAL WORKFLOWS ──────────────────────────────────
  INSERT INTO public.client_approvals (
    project_id, title, category, description, item_type, status, requested_by, client_reviewer, client_feedback, decided_at, created_at
  ) VALUES
  (
    v_project_id,
    'Sprint 1 Architecture & Database Blueprint Sign-off',
    'Milestone Sign-off',
    'Formal architectural approval for the Supabase schema, table constraints, and foreign key relationships.',
    'milestone',
    'approved',
    'Project Lead',
    'Sarah Jenkins',
    'Architectural design approved without reservations. Great work on the data integrity constraints.',
    now() - interval '4 days',
    now() - interval '6 days'
  ),
  (
    v_project_id,
    'Sprint 2 Deliverable: Real-Time WebRTC Media Protocol',
    'Deliverable Review',
    'Approval for the peer-to-peer WebRTC video meeting engine with deterministic offer glare negotiation.',
    'deliverable',
    'pending',
    'Project Lead',
    'Sarah Jenkins',
    NULL,
    NULL,
    now() - interval '1 day'
  );

  RAISE NOTICE 'SUCCESS: Database truncated and freshly seeded with project: %', v_project_id;
END $$;

-- Verify inserted data summary
SELECT 
  (SELECT count(*) FROM public.projects) AS projects_count,
  (SELECT count(*) FROM public.requirements) AS requirements_count,
  (SELECT count(*) FROM public.sprints) AS sprints_count,
  (SELECT count(*) FROM public.tasks) AS tasks_count,
  (SELECT count(*) FROM public.clients) AS clients_count,
  (SELECT count(*) FROM public.client_meetings) AS meetings_count,
  (SELECT count(*) FROM public.client_pm_messages) AS messages_count,
  (SELECT count(*) FROM public.client_approvals) AS approvals_count;
