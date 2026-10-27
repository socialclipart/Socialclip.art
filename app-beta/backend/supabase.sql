-- SocialClip community backend (Supabase Postgres)
-- Run once in the Supabase SQL Editor. No secret keys go into the browser.
-- Public results, public APPROVED comments only. All writes via limited RPCs.
create table if not exists public.sc_votes (
 device_id uuid primary key,
 choice text not null check (choice in ('map','live','both')),
 updated_at timestamptz not null default now()
);
create table if not exists public.sc_comments (
 id bigint generated always as identity primary key,
 device_id uuid not null,
 display_name varchar(40),
 body varchar(700) not null check (length(trim(body)) between 6 and 700),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);
create index if not exists sc_comments_status_time on public.sc_comments(status, created_at desc);
create index if not exists sc_comments_device_time on public.sc_comments(device_id, created_at desc);
alter table public.sc_votes enable row level security;
alter table public.sc_comments enable row level security;
revoke all on public.sc_votes from anon, authenticated;
revoke all on public.sc_comments from anon, authenticated;
grant select(choice) on public.sc_votes to anon, authenticated;
grant select(display_name,body,created_at,status) on public.sc_comments to anon, authenticated;
drop policy if exists "read vote totals" on public.sc_votes;
create policy "read vote totals" on public.sc_votes for select to anon, authenticated using (true);
drop policy if exists "only published comments" on public.sc_comments;
create policy "only published comments" on public.sc_comments for select to anon, authenticated using (status='approved');
-- Upserts one vote for each browser-generated anonymous UUID. Not identity proof.
create or replace function public.sc_cast_vote(p_device_id uuid, p_choice text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if p_choice not in ('map','live','both') or p_device_id is null then raise exception 'Invalid choice'; end if;
 insert into public.sc_votes(device_id,choice) values(p_device_id,p_choice)
 on conflict (device_id) do update set choice=excluded.choice,updated_at=now();
end; $$;
-- Only pending comments may be submitted. Staff approves in Supabase table editor.
create or replace function public.sc_submit_comment(p_device_id uuid, p_name text, p_body text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
 if p_device_id is null or length(trim(coalesce(p_body,''))) not between 6 and 700
    or length(coalesce(p_name,''))>40 then raise exception 'Invalid comment'; end if;
 if exists(select 1 from public.sc_comments where device_id=p_device_id and created_at>now()-interval '15 minutes') then
   raise exception 'Please wait before submitting another comment';
 end if;
 insert into public.sc_comments(device_id,display_name,body,status)
 values(p_device_id, nullif(left(trim(p_name),40),''), trim(p_body),'pending');
end; $$;
revoke all on function public.sc_cast_vote(uuid,text) from public;
revoke all on function public.sc_submit_comment(uuid,text,text) from public;
grant execute on function public.sc_cast_vote(uuid,text) to anon, authenticated;
grant execute on function public.sc_submit_comment(uuid,text,text) to anon, authenticated;
-- Moderator instructions:
-- update public.sc_comments set status='approved' where id=...;
-- update public.sc_comments set status='rejected' where id=...;
-- For public launch: add CAPTCHA / server-side IP rate limiting and privacy review.
