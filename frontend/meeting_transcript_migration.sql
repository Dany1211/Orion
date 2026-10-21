-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Meeting Transcript Continuous Capture System
-- Run this in your Supabase SQL editor
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Table: meeting_transcript_segments
--    Stores live rolling transcript chunks during a meeting.
--    Each segment is a short utterance (5-15 seconds) with speaker attribution.
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists meeting_transcript_segments (
  id               uuid primary key default gen_random_uuid(),
  meeting_id       uuid not null references client_meetings(id) on delete cascade,
  project_id       uuid not null references projects(id) on delete cascade,
  room_id          text not null,
  speaker_name     text not null default 'Unknown',
  speaker_role     text not null default 'participant' check (speaker_role in ('pm', 'client', 'system')),
  text             text not null,
  confidence       float default 1.0,        -- Web Speech API confidence score (0–1)
  segment_index    int  not null default 0,  -- ordering within the meeting
  started_at       timestamptz default now() not null,
  word_count       int  generated always as (
                     array_length(string_to_array(trim(text), ' '), 1)
                   ) stored,
  created_at       timestamptz default now() not null
);

-- Indexes for fast retrieval
create index if not exists idx_transcript_meeting   on meeting_transcript_segments(meeting_id);
create index if not exists idx_transcript_project   on meeting_transcript_segments(project_id);
create index if not exists idx_transcript_room      on meeting_transcript_segments(room_id);
create index if not exists idx_transcript_created   on meeting_transcript_segments(created_at);
create index if not exists idx_transcript_segment   on meeting_transcript_segments(meeting_id, segment_index);

-- RLS
alter table meeting_transcript_segments enable row level security;

drop policy if exists "Transcript segments access" on meeting_transcript_segments;
create policy "Transcript segments access" on meeting_transcript_segments
  using (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  )
  with check (
    project_id in (
      select p.id from projects p
      join organization_members om on om.organization_id = p.organization_id
      where om.user_id = auth.uid()
    )
  );

-- Allow anonymous inserts (for client portal users who are not Supabase-auth'd)
drop policy if exists "Transcript insert anon" on meeting_transcript_segments;
create policy "Transcript insert anon" on meeting_transcript_segments
  for insert with check (true);

-- Allow anonymous reads
drop policy if exists "Transcript read anon" on meeting_transcript_segments;
create policy "Transcript read anon" on meeting_transcript_segments
  for select using (true);

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Add columns to client_meetings for transcript metadata
-- ════════════════════════════════════════════════════════════════════════════
alter table client_meetings
  add column if not exists transcript_enabled     boolean default true,
  add column if not exists transcript_source_id   uuid references requirement_sources(id) on delete set null,
  add column if not exists total_words_spoken      int     default 0,
  add column if not exists speakers_detected       jsonb   default '[]'::jsonb;

-- Allow requirement_sources.uploaded_by to be null for automated machine/meeting sources
alter table requirement_sources alter column uploaded_by drop not null;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Realtime: enable meeting_transcript_segments for live broadcast
--    (so both PM and client tabs see transcript appear in real time)
-- ════════════════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and tablename = 'meeting_transcript_segments'
  ) then
    alter publication supabase_realtime add table meeting_transcript_segments;
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Helper function: consolidate_meeting_transcript
--    Called when a meeting ends — concatenates all segments into a single
--    requirement_source record so the AI analysis pipeline can use it.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function consolidate_meeting_transcript(p_meeting_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_meeting         record;
  v_full_text       text := '';
  v_word_count      int  := 0;
  v_source_id       uuid;
  v_segment         record;
  v_speakers        text[];
begin
  -- Fetch meeting
  select * into v_meeting from client_meetings where id = p_meeting_id;
  if not found then
    raise exception 'Meeting % not found', p_meeting_id;
  end if;

  -- Build full transcript text from segments, ordered chronologically
  for v_segment in
    select speaker_name, speaker_role, text, started_at, confidence
    from meeting_transcript_segments
    where meeting_id = p_meeting_id
    order by segment_index asc, created_at asc
  loop
    -- Format: [Speaker Name]: utterance text
    v_full_text := v_full_text ||
      '[' || v_segment.speaker_name || ']: ' || v_segment.text || E'\n';
    v_word_count := v_word_count + coalesce(
      array_length(string_to_array(trim(v_segment.text), ' '), 1), 0
    );
  end loop;

  -- Collect unique speakers
  select array_agg(distinct speaker_name) into v_speakers
  from meeting_transcript_segments
  where meeting_id = p_meeting_id;

  if length(trim(v_full_text)) = 0 then
    return null; -- No transcript to save
  end if;

  -- Prepend meeting metadata header
  v_full_text := '=== MEETING TRANSCRIPT ===' || E'\n' ||
    'Meeting: ' || v_meeting.title || E'\n' ||
    'Date: ' || to_char(v_meeting.scheduled_at, 'YYYY-MM-DD HH24:MI TZ') || E'\n' ||
    'Room ID: ' || v_meeting.room_id || E'\n' ||
    'Participants: ' || array_to_string(v_speakers, ', ') || E'\n' ||
    'Total Words: ' || v_word_count || E'\n\n' ||
    v_full_text;

  -- Ensure requirement_sources.uploaded_by can be null for automated sources
  -- (done in table alter statements below)

  -- Upsert into requirement_sources (update if already exists for this meeting)
  if v_meeting.transcript_source_id is not null then
    update requirement_sources
    set
      raw_text        = v_full_text,
      extracted_text  = v_full_text,
      word_count      = v_word_count,
      status          = 'processed',
      updated_at      = now()
    where id = v_meeting.transcript_source_id;

    v_source_id := v_meeting.transcript_source_id;
  else
    insert into requirement_sources (
      project_id, source_type, title, file_name,
      mime_type, raw_text, extracted_text, word_count, status
    ) values (
      v_meeting.project_id,
      'meeting_transcript',
      'Meeting Transcript: ' || v_meeting.title,
      'transcript_' || v_meeting.room_id || '.txt',
      'text/plain',
      v_full_text,
      v_full_text,
      v_word_count,
      'processed'
    )
    returning id into v_source_id;
  end if;

  -- Update the meeting record with totals and source link
  update client_meetings
  set
    transcript_source_id  = v_source_id,
    total_words_spoken    = v_word_count,
    speakers_detected     = to_jsonb(v_speakers),
    updated_at            = now()
  where id = p_meeting_id;

  return v_source_id;
end;
$$;

-- Grant execute to authenticated and anon (client portal clients)
grant execute on function consolidate_meeting_transcript(uuid) to authenticated;
grant execute on function consolidate_meeting_transcript(uuid) to anon;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. Verify the setup
-- ════════════════════════════════════════════════════════════════════════════
-- select * from meeting_transcript_segments limit 5;
-- select consolidate_meeting_transcript('<your-meeting-uuid>');
