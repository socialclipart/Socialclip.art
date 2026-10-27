-- DEVELOPMENT ONLY. Apply once to an isolated Supabase test project after approval.
-- sc_live is NOT an exposed PostgREST schema. No real data, seeds or delivery service.
-- A future trusted API must verify the user's JWT before executing in their role.
begin;
create schema sc_live;
revoke all on schema sc_live from public, anon;
grant usage on schema sc_live to authenticated;

create table sc_live.settings (
 singleton boolean primary key default true check (singleton),
 accepting_requests boolean not null default false,
 consent_version text not null default 'pilot-v1'
);
insert into sc_live.settings default values;
create table sc_live.members (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('customer','business','operator')),
 active boolean not null default false,
 joined_at timestamptz not null default now()
);
create table sc_live.businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique references sc_live.members(user_id) on delete cascade,
 display_name text not null check (length(trim(display_name)) between 2 and 120),
 category text not null check (category in ('auto','handwerk')),
 city text not null default 'Erlangen' check (city='Erlangen'),
 active boolean not null default false,
 verified_at timestamptz,
 pilot_agreed_at timestamptz,
 response_minutes integer not null check (response_minutes between 15 and 2880),
 check (not active or (verified_at is not null and pilot_agreed_at is not null))
);
create table sc_live.requests (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references sc_live.members(user_id) on delete cascade,
 client_key uuid not null,
 category text not null check (category in ('auto','handwerk')),
 city text not null check (city='Erlangen'),
 description text not null check (length(trim(description)) between 12 and 900),
 timeframe text not null check (timeframe in ('soon','today','tomorrow','this_week','flexible')),
 consent_version text not null,
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '48 hours',
 status text not null default 'open' check (status in ('open','confirmed','cancelled','closed')),
 confirmed_response_id uuid,
 confirmed_at timestamptz,
 closed_at timestamptz,
 unique (customer_id,client_key),
 check (expires_at>created_at),
 check ((confirmed_response_id is null)=(confirmed_at is null)),
 check (status<>'confirmed' or confirmed_response_id is not null),
 check ((status in ('cancelled','closed'))=(closed_at is not null))
);
create index requests_customer_time on sc_live.requests(customer_id,created_at);
create table sc_live.assignments (
 request_id uuid not null references sc_live.requests(id) on delete cascade,
 business_id uuid not null references sc_live.businesses(id) on delete cascade,
 assigned_at timestamptz not null default now(),
 primary key(request_id,business_id)
);
create index assignments_business on sc_live.assignments(business_id);
create table sc_live.responses (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null,
 business_id uuid not null,
 kind text not null check (kind in ('can_help','proposed','unavailable')),
 version integer not null default 1 check (version>0),
 starts_at timestamptz,
 ends_at timestamptz,
 price_cents integer check (price_cents>=0),
 price_kind text not null default 'unknown' check (price_kind in ('unknown','estimate','fixed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(request_id,business_id),
 unique(id,request_id),
 foreign key(request_id,business_id) references sc_live.assignments(request_id,business_id) on delete cascade,
 check ((kind='proposed')=(starts_at is not null and ends_at is not null)),
 check (kind='proposed' or (starts_at is null and ends_at is null)),
 check (ends_at>starts_at),
 check ((price_kind='unknown')=(price_cents is null)),
 check (kind='proposed' or price_kind='unknown')
);
alter table sc_live.requests add constraint confirmed_response_belongs_to_request
 foreign key(confirmed_response_id,id) references sc_live.responses(id,request_id) deferrable initially deferred;
create table sc_live.outbox (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references sc_live.requests(id) on delete cascade,
 recipient_id uuid not null references sc_live.members(user_id) on delete cascade,
 event_key text not null unique,
 kind text not null check (kind in ('assigned','response','confirmed','cancelled')),
 created_at timestamptz not null default now(),
 status text not null default 'pending' check (status in ('pending','sent','failed')),
 attempts integer not null default 0 check (attempts>=0),
 sent_at timestamptz,
 provider_receipt text,
 check ((status='sent')=(sent_at is not null and provider_receipt is not null)),
 check (status='sent' or (sent_at is null and provider_receipt is null))
);
-- No contact details or request text in notifications. Worker resolves the recipient privately.
create table sc_live.outcomes (
 request_id uuid not null references sc_live.requests(id) on delete cascade,
 actor_id uuid not null references sc_live.members(user_id) on delete cascade,
 outcome text not null check (outcome in ('completed','not_completed','unknown')),
 reported_at timestamptz not null default now(),
 primary key(request_id,actor_id)
);

-- Definer functions are confined to a non-exposed schema. No user-provided SQL,
-- role names, ownership fields, URLs, recipients or arbitrary status changes.
create function sc_live.is_operator() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from sc_live.members where user_id=auth.uid() and active and role='operator');
$$;
create function sc_live.require_role(p_role text) returns uuid
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from sc_live.members where user_id=auth.uid() and active and role=p_role) then
  raise exception 'not_authorized' using errcode='42501';
 end if;
 return auth.uid();
end; $$;
create function sc_live.owns_business(p_business uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from sc_live.businesses b join sc_live.members m on m.user_id=b.owner_id
  where b.id=p_business and b.owner_id=auth.uid() and b.active and m.active and m.role='business');
$$;
create function sc_live.owns_request(p_request uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from sc_live.requests r join sc_live.members m on m.user_id=r.customer_id
  where r.id=p_request and r.customer_id=auth.uid() and m.active and m.role='customer');
$$;
create function sc_live.can_read_request(p_request uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select sc_live.is_operator() or sc_live.owns_request(p_request) or exists(
  select 1 from sc_live.assignments a where a.request_id=p_request and sc_live.owns_business(a.business_id));
$$;

create function sc_live.submit_request(p_key uuid,p_category text,p_city text,p_description text,p_timeframe text,p_consent text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid; existing sc_live.requests; result uuid;
begin
 actor:=sc_live.require_role('customer');
 -- Serialize customer writes so the daily cap also holds for simultaneous retries.
 perform 1 from sc_live.members where user_id=actor for update;
 if not (select accepting_requests from sc_live.settings) then raise exception 'pilot_paused'; end if;
 if p_key is null or p_consent is distinct from (select consent_version from sc_live.settings)
  or p_category is null or p_category not in ('auto','handwerk') or p_city is distinct from 'Erlangen'
  or length(trim(coalesce(p_description,''))) not between 12 and 900
  or p_timeframe is null or p_timeframe not in ('soon','today','tomorrow','this_week','flexible') then
  raise exception 'invalid_request';
 end if;
 select * into existing from sc_live.requests where customer_id=actor and client_key=p_key;
 if found then
  if (existing.category,existing.city,existing.description,existing.timeframe,existing.consent_version)
   is distinct from (p_category,p_city,trim(p_description),p_timeframe,p_consent) then raise exception 'idempotency_conflict'; end if;
  return existing.id;
 end if;
 if (select count(*) from sc_live.requests where customer_id=actor and created_at>now()-interval '1 day')>=3 then
  raise exception 'rate_limited';
 end if;
 insert into sc_live.requests(customer_id,client_key,category,city,description,timeframe,consent_version)
 values(actor,p_key,p_category,p_city,trim(p_description),p_timeframe,p_consent) returning id into result;
 return result;
end; $$;

create function sc_live.assign_request(p_request uuid,p_business uuid) returns void
language plpgsql security definer set search_path='' as $$
declare req sc_live.requests; biz sc_live.businesses;
begin
 perform sc_live.require_role('operator');
 select * into req from sc_live.requests where id=p_request for update;
 if not found or req.status<>'open' or req.expires_at<=now() then raise exception 'request_not_open'; end if;
 select * into biz from sc_live.businesses where id=p_business and active and verified_at is not null and pilot_agreed_at is not null;
 if not found or not exists(select 1 from sc_live.members where user_id=biz.owner_id and role='business' and active)
  or biz.category<>req.category or biz.city<>req.city then raise exception 'business_not_eligible'; end if;
 if exists(select 1 from sc_live.assignments where request_id=p_request and business_id=p_business) then return; end if;
 if (select count(*) from sc_live.assignments where request_id=p_request)>=3 then raise exception 'assignment_limit'; end if;
 insert into sc_live.assignments(request_id,business_id) values(p_request,p_business);
 insert into sc_live.outbox(request_id,recipient_id,event_key,kind)
 values(p_request,biz.owner_id,'assigned:'||p_request||':'||p_business,'assigned');
end; $$;

create function sc_live.respond(p_request uuid,p_business uuid,p_kind text,p_start timestamptz default null,
 p_end timestamptz default null,p_price integer default null,p_price_kind text default 'unknown')
returns jsonb language plpgsql security definer set search_path='' as $$
declare req sc_live.requests; previous sc_live.responses; result sc_live.responses;
begin
 perform sc_live.require_role('business');
 if not sc_live.owns_business(p_business) then raise exception 'not_authorized' using errcode='42501'; end if;
 select * into req from sc_live.requests where id=p_request for update;
 if not found or req.status<>'open' or req.expires_at<=now() then raise exception 'request_not_open'; end if;
 if not exists(select 1 from sc_live.assignments where request_id=p_request and business_id=p_business) then
  raise exception 'not_authorized' using errcode='42501'; end if;
 if p_kind is null or p_kind not in ('can_help','proposed','unavailable')
  or p_price_kind is null or p_price_kind not in ('unknown','estimate','fixed')
  or ((p_price_kind='unknown') is distinct from (p_price is null)) or p_price<0 then raise exception 'invalid_response'; end if;
 if p_kind='proposed' then
  if p_start is null or p_end is null or p_start<=now() or p_end<=p_start or p_start>now()+interval '30 days'
   or p_end>p_start+interval '8 hours' then raise exception 'invalid_proposal'; end if;
 elsif p_start is not null or p_end is not null or p_price_kind<>'unknown' then raise exception 'invalid_response'; end if;
 select * into previous from sc_live.responses where request_id=p_request and business_id=p_business;
 if found and (previous.kind,previous.starts_at,previous.ends_at,previous.price_cents,previous.price_kind)
  is not distinct from (p_kind,p_start,p_end,p_price,p_price_kind) then
  return jsonb_build_object('id',previous.id,'version',previous.version);
 end if;
 insert into sc_live.responses(request_id,business_id,kind,starts_at,ends_at,price_cents,price_kind)
 values(p_request,p_business,p_kind,p_start,p_end,p_price,p_price_kind)
 on conflict(request_id,business_id) do update set kind=excluded.kind,starts_at=excluded.starts_at,
  ends_at=excluded.ends_at,price_cents=excluded.price_cents,price_kind=excluded.price_kind,
  version=sc_live.responses.version+1,updated_at=now()
 returning * into result;
 insert into sc_live.outbox(request_id,recipient_id,event_key,kind)
 values(p_request,req.customer_id,'response:'||result.id||':'||result.version,'response');
 return jsonb_build_object('id',result.id,'version',result.version);
end; $$;

create function sc_live.confirm_response(p_request uuid,p_response uuid,p_version integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid; req sc_live.requests; proposal sc_live.responses; biz sc_live.businesses;
begin
 actor:=sc_live.require_role('customer');
 select * into req from sc_live.requests where id=p_request and customer_id=actor for update;
 if not found then raise exception 'not_authorized' using errcode='42501'; end if;
 select * into proposal from sc_live.responses where id=p_response and request_id=p_request;
 if not found or p_version is distinct from proposal.version then raise exception 'stale_proposal'; end if;
 if req.status='confirmed' and req.confirmed_response_id=p_response then return req.id; end if;
 if req.status<>'open' or req.expires_at<=now() then raise exception 'request_not_open'; end if;
 if proposal.kind<>'proposed' or proposal.starts_at<=now() then raise exception 'proposal_not_bookable'; end if;
 -- Lock the business across different requests; overlapping ONE confirmations cannot win together.
 select * into biz from sc_live.businesses where id=proposal.business_id for update;
 if not biz.active or not exists(select 1 from sc_live.members where user_id=biz.owner_id and role='business' and active) then
  raise exception 'business_not_eligible'; end if;
 if exists(select 1 from sc_live.requests r join sc_live.responses o on o.id=r.confirmed_response_id
  where r.status='confirmed' and o.business_id=proposal.business_id
   and o.starts_at<proposal.ends_at and o.ends_at>proposal.starts_at) then raise exception 'slot_conflict'; end if;
 update sc_live.requests set status='confirmed',confirmed_response_id=p_response,confirmed_at=now() where id=p_request;
 insert into sc_live.outbox(request_id,recipient_id,event_key,kind) values
  (p_request,actor,'confirmed:'||p_request||':customer','confirmed'),
  (p_request,biz.owner_id,'confirmed:'||p_request||':business','confirmed');
 return req.id;
end; $$;

create function sc_live.cancel_request(p_request uuid) returns void
language plpgsql security definer set search_path='' as $$
declare req sc_live.requests; recipient record; actor uuid:=auth.uid();
begin
 select * into req from sc_live.requests where id=p_request for update;
 if not found or not (sc_live.is_operator() or sc_live.owns_request(p_request) or exists(
  select 1 from sc_live.responses where id=req.confirmed_response_id and sc_live.owns_business(business_id))) then
  raise exception 'not_authorized' using errcode='42501'; end if;
 if req.status='cancelled' then return; end if;
 if req.status not in ('open','confirmed') then raise exception 'request_not_open'; end if;
 update sc_live.requests set status='cancelled',closed_at=now() where id=p_request;
 for recipient in (select req.customer_id as id union select b.owner_id from sc_live.assignments a
  join sc_live.businesses b on b.id=a.business_id where a.request_id=p_request) loop
  insert into sc_live.outbox(request_id,recipient_id,event_key,kind)
   values(p_request,recipient.id,'cancelled:'||p_request||':'||recipient.id,'cancelled');
 end loop;
end; $$;

create function sc_live.report_outcome(p_request uuid,p_outcome text) returns void
language plpgsql security definer set search_path='' as $$
declare req sc_live.requests; proposal sc_live.responses;
begin
 select * into req from sc_live.requests where id=p_request for update;
 select * into proposal from sc_live.responses where id=req.confirmed_response_id;
 if req.id is null or proposal.id is null or not (sc_live.owns_request(p_request) or sc_live.owns_business(proposal.business_id)) then
  raise exception 'not_authorized' using errcode='42501'; end if;
 if req.status not in ('confirmed','closed') or proposal.ends_at>now() then raise exception 'too_early_or_cancelled'; end if;
 if p_outcome is null or p_outcome not in ('completed','not_completed','unknown') then raise exception 'invalid_outcome'; end if;
 insert into sc_live.outcomes(request_id,actor_id,outcome) values(p_request,auth.uid(),p_outcome)
 on conflict(request_id,actor_id) do update set outcome=excluded.outcome,reported_at=now();
end; $$;

-- Maintenance is intentionally NOT granted to browser roles, including operators.
-- A future approved scheduler/owner runs it; no unattended deletion is enabled.
create function sc_live.maintenance() returns integer
language plpgsql security definer set search_path='' as $$
declare removed integer;
begin
 update sc_live.requests set status='closed',closed_at=now() where status='open' and expires_at<=now();
 update sc_live.requests r set status='closed',closed_at=now() from sc_live.responses o
  where r.confirmed_response_id=o.id and r.status='confirmed' and o.ends_at<now()-interval '7 days';
 -- Clear the circular reference before removing its cascade-owned response rows.
 update sc_live.requests set confirmed_response_id=null,confirmed_at=null
  where status in ('cancelled','closed') and closed_at<now()-interval '30 days';
 delete from sc_live.requests where status in ('cancelled','closed') and closed_at<now()-interval '30 days';
 get diagnostics removed=row_count;
 return removed;
end; $$;

alter table sc_live.settings enable row level security;
alter table sc_live.members enable row level security;
alter table sc_live.businesses enable row level security;
alter table sc_live.requests enable row level security;
alter table sc_live.assignments enable row level security;
alter table sc_live.responses enable row level security;
alter table sc_live.outbox enable row level security;
alter table sc_live.outcomes enable row level security;
revoke all on all tables in schema sc_live from public,anon,authenticated;
grant select on sc_live.members,sc_live.businesses,sc_live.requests,sc_live.assignments,sc_live.responses,sc_live.outcomes to authenticated;
create policy member_read on sc_live.members for select to authenticated using (user_id=auth.uid() or sc_live.is_operator());
create policy business_read on sc_live.businesses for select to authenticated using (sc_live.owns_business(id) or sc_live.is_operator());
create policy request_read on sc_live.requests for select to authenticated using (sc_live.can_read_request(id));
create policy assignment_read on sc_live.assignments for select to authenticated
 using (sc_live.is_operator() or sc_live.owns_request(request_id) or sc_live.owns_business(business_id));
create policy response_read on sc_live.responses for select to authenticated
 using (sc_live.is_operator() or sc_live.owns_request(request_id) or sc_live.owns_business(business_id));
create policy outcome_read on sc_live.outcomes for select to authenticated
 using (sc_live.is_operator() or sc_live.owns_request(request_id) or exists(
  select 1 from sc_live.responses o join sc_live.requests r on r.confirmed_response_id=o.id
   where r.id=sc_live.outcomes.request_id and sc_live.owns_business(o.business_id)));
-- Default function EXECUTE is public in PostgreSQL. Remove it for every helper/RPC.
revoke all on all functions in schema sc_live from public,anon,authenticated;
grant execute on function sc_live.is_operator(),sc_live.owns_business(uuid),sc_live.owns_request(uuid),sc_live.can_read_request(uuid),
 sc_live.submit_request(uuid,text,text,text,text,text),sc_live.assign_request(uuid,uuid),
 sc_live.respond(uuid,uuid,text,timestamptz,timestamptz,integer,text),sc_live.confirm_response(uuid,uuid,integer),
 sc_live.cancel_request(uuid),sc_live.report_outcome(uuid,text) to authenticated;
commit;
