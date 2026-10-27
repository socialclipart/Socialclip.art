import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

let db;
before(async () => {
  db = new PGlite();
  // Test-only equivalents of Supabase auth. Never migrate these to a real service.
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(readFileSync(new URL('../app-beta/backend/live-pilot.sql', import.meta.url), 'utf8'));
});
after(async () => { await db?.close(); });

async function as(user, sql, params = [], role = 'authenticated') {
  await db.query(`select set_config('request.jwt.claim.sub',$1,false)`, [user || '']);
  await db.exec(`set role ${role}`); // role is an internal test constant, never user input
  try { return (await db.query(sql, params)).rows; }
  finally { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub','',false)`); }
}
async function fixture() {
  const f = Object.fromEntries(['customer','other','operator','a','b','c','d','wrong','paused','outsider'].map(k => [k,randomUUID()]));
  f.business = {};
  for (const [key,id] of Object.entries(f).filter(([,id]) => typeof id === 'string')) {
    await db.query('insert into auth.users(id) values($1)', [id]);
    if (key !== 'outsider') await db.query('insert into sc_live.members(user_id,role,active) values($1,$2,true)',
      [id, ['customer','other'].includes(key) ? 'customer' : key === 'operator' ? 'operator' : 'business']);
  }
  for (const key of ['a','b','c','d','wrong','paused']) {
    const {rows} = await db.query(`insert into sc_live.businesses(owner_id,display_name,category,response_minutes,active,verified_at,pilot_agreed_at)
      values($1,$2,$3,120,$4,now(),now()) returning id`, [f[key],'TEST Betrieb '+key,key==='wrong'?'handwerk':'auto',key!=='paused']);
    f.business[key] = rows[0].id;
  }
  await db.exec('update sc_live.settings set accepting_requests=true');
  return f;
}
const args = key => [key || randomUUID(),'auto','Erlangen','TEST: Diagnose ohne personenbezogene Angaben.','this_week','pilot-v1'];
const submit = async (f,values=args(),user=f.customer) => (await as(user,'select sc_live.submit_request($1,$2,$3,$4,$5,$6) as id',values))[0].id;
const assign = (f,r,b='a') => as(f.operator,'select sc_live.assign_request($1,$2)',[r,f.business[b]]);
async function respond(f,r,b='a',kind='proposed',timeOffset=0) {
  const start = new Date(Date.now()+86400000+timeOffset).toISOString(), end = new Date(Date.now()+90000000+timeOffset).toISOString();
  const times = kind==='proposed'?[start,end]:[null,null];
  return (await as(f[b],'select sc_live.respond($1,$2,$3,$4,$5) as reply',[r,f.business[b],kind,...times]))[0].reply;
}
const confirm = (f,r,p,user=f.customer) => as(user,'select sc_live.confirm_response($1,$2,$3) as id',[r,p.id,p.version]);

test('Migration creates a paused, unexposed pilot; anon cannot read or execute', async () => {
  assert.equal((await db.query('select accepting_requests from sc_live.settings')).rows[0].accepting_requests,false);
  await assert.rejects(as(null,'select * from sc_live.requests',[],'anon'), /permission denied/);
  await assert.rejects(as(null,'select sc_live.submit_request($1,$2,$3,$4,$5,$6)',args(),'anon'), /permission denied/);
});

test('Only active invited customers can submit; global pause is enforced', async () => {
  const f=await fixture();
  for (const user of [null,f.outsider,f.a]) await assert.rejects(submit(f,args(),user), /not_authorized/);
  await db.exec('update sc_live.settings set accepting_requests=false');
  await assert.rejects(submit(f), /pilot_paused/);
  await db.exec('update sc_live.settings set accepting_requests=true');
  await db.query('update sc_live.members set active=false where user_id=$1',[f.customer]);
  await assert.rejects(submit(f), /not_authorized/);
});

test('Server validates city, category, description, timeframe, consent and nulls', async () => {
  const f=await fixture();
  for (const [index,value] of [[0,null],[1,'beauty'],[1,null],[2,'Nürnberg'],[2,null],[3,'   '],[3,'x'.repeat(901)],[4,null],[4,'yesterday'],[5,null],[5,'old']]) {
    const values=args(); values[index]=value;
    await assert.rejects(submit(f,values), /invalid_request/);
  }
  assert.equal((await db.query('select count(*)::int as n from sc_live.requests where customer_id=$1',[f.customer])).rows[0].n,0);
});

test('Retry returns one durable request; conflicting retry rejected; daily cap enforced', async () => {
  const f=await fixture(), values=args(), r=await submit(f,values);
  assert.equal(await submit(f,values),r);
  const changed=[...values]; changed[3]='TEST: Anderes Anliegen mit gleicher Kennung.';
  await assert.rejects(submit(f,changed), /idempotency_conflict/);
  await submit(f); await submit(f);
  await assert.rejects(submit(f), /rate_limited/);
  assert.equal(await submit(f,values),r);
});

test('Only operator assigns; only eligible participants; max three and one outbox event each', async () => {
  const f=await fixture(), r=await submit(f);
  await assert.rejects(as(f.customer,'select sc_live.assign_request($1,$2)',[r,f.business.a]), /not_authorized/);
  for (const b of ['wrong','paused']) await assert.rejects(assign(f,r,b), /business_not_eligible/);
  await assign(f,r); await assign(f,r); await assign(f,r,'b'); await assign(f,r,'c');
  await assert.rejects(assign(f,r,'d'), /assignment_limit/);
  assert.equal((await db.query('select count(*)::int as n from sc_live.outbox where request_id=$1',[r])).rows[0].n,3);
  assert.equal((await db.query('select count(*)::int as n from sc_live.outbox where request_id=$1 and status=$2',[r,'pending'])).rows[0].n,3);
});

test('RLS hides foreign requests, other businesses replies, outbox and all direct writes', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r); await assign(f,r,'b');
  await respond(f,r,'a','can_help'); await respond(f,r,'b','unavailable');
  assert.equal((await as(f.other,'select * from sc_live.requests')).length,0);
  assert.equal((await as(f.d,'select * from sc_live.requests')).length,0);
  assert.equal((await as(f.a,'select * from sc_live.requests')).length,1);
  assert.equal((await as(f.a,'select * from sc_live.responses')).length,1);
  assert.equal((await as(f.customer,'select * from sc_live.responses')).length,2);
  for (const [sql,params] of [
    ['select * from sc_live.outbox',[]],
    ['update sc_live.requests set status=$1 where id=$2',['confirmed',r]],
    ['update sc_live.members set role=$1 where user_id=$2',['operator',f.customer]],
    ['delete from sc_live.requests where id=$1',[r]],
    ['select sc_live.maintenance()',[]]
  ]) await assert.rejects(as(f.customer,sql,params), /permission denied/);
  await db.query('update sc_live.members set active=false where user_id=$1',[f.a]);
  assert.equal((await as(f.a,'select * from sc_live.requests')).length,0);
});

test('A business cannot impersonate another business or respond without assignment', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r);
  await assert.rejects(respond(f,r,'b'), /not_authorized/);
  await assert.rejects(as(f.b,'select sc_live.respond($1,$2,$3)',[r,f.business.a,'can_help']), /not_authorized/);
});

test('Invalid proposals and fabricated prices fail; unknown price stays null', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r);
  const start=new Date(Date.now()+86400000).toISOString(),end=new Date(Date.now()+90000000).toISOString();
  const bad=[
    ['proposed',null,null,null,'unknown'], ['proposed',end,start,null,'unknown'],
    ['can_help',start,end,null,'unknown'], ['proposed',start,end,99,'unknown'],
    ['proposed',start,end,null,'fixed'], ['proposed',start,end,-1,'fixed'],
    ['invented',null,null,null,'unknown'], [null,null,null,null,'unknown']
  ];
  for (const values of bad) await assert.rejects(as(f.a,'select sc_live.respond($1,$2,$3,$4,$5,$6,$7)',[r,f.business.a,...values]), /invalid_/);
  const p=await respond(f,r);
  const row=(await as(f.customer,'select * from sc_live.responses where id=$1',[p.id]))[0];
  assert.equal(row.price_cents,null); assert.equal(row.price_kind,'unknown');
});

test('Same response retry is idempotent; edits invalidate a previously seen proposal', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r);
  const start=new Date(Date.now()+86400000).toISOString(),end=new Date(Date.now()+90000000).toISOString();
  const sql='select sc_live.respond($1,$2,$3,$4,$5) as reply',values=[r,f.business.a,'proposed',start,end];
  const first=(await as(f.a,sql,values))[0].reply, retry=(await as(f.a,sql,values))[0].reply;
  assert.deepEqual(retry,first);
  const changed=await respond(f,r,'a','proposed',7200000);
  assert.equal(changed.version,2);
  await assert.rejects(confirm(f,r,first), /stale_proposal/);
  assert.equal((await db.query('select count(*)::int as n from sc_live.outbox where request_id=$1 and kind=$2',[r,'response'])).rows[0].n,2);
});

test('Only the customer can accept a concrete current proposal; confirmation retries do not resend', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r);
  const hint=await respond(f,r,'a','can_help');
  await assert.rejects(confirm(f,r,hint), /proposal_not_bookable/);
  const p=await respond(f,r);
  await assert.rejects(confirm(f,r,p,f.other), /not_authorized/);
  await assert.rejects(confirm(f,r,p,f.a), /not_authorized/);
  await confirm(f,r,p); await confirm(f,r,p);
  assert.equal((await as(f.customer,'select status from sc_live.requests where id=$1',[r]))[0].status,'confirmed');
  assert.equal((await db.query('select count(*)::int as n from sc_live.outbox where request_id=$1 and kind=$2',[r,'confirmed'])).rows[0].n,2);
});

test('One request cannot confirm two businesses and confirmed proposals cannot be edited', async () => {
  const f=await fixture(),r=await submit(f); await assign(f,r); await assign(f,r,'b');
  const a=await respond(f,r), b=await respond(f,r,'b');
  await confirm(f,r,a);
  await assert.rejects(confirm(f,r,b), /request_not_open/);
  await assert.rejects(respond(f,r), /request_not_open/);
});

test('Overlapping ONE bookings conflict; cancellation releases the interval', async () => {
  const f=await fixture(), r=await submit(f),s=await submit(f,args(),f.other);
  await assign(f,r); await assign(f,s);
  const a=await respond(f,r),b=await respond(f,s);
  await confirm(f,r,a);
  await assert.rejects(confirm(f,s,b,f.other), /slot_conflict/);
  await as(f.a,'select sc_live.cancel_request($1)',[r]);
  await confirm(f,s,b,f.other);
});

test('Expired requests, past proposals and inactive businesses cannot be confirmed', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r); const p=await respond(f,r);
  await db.query('update sc_live.requests set created_at=now()-interval \'3 days\',expires_at=now()-interval \'1 day\' where id=$1',[r]);
  await assert.rejects(confirm(f,r,p), /request_not_open/);
  const s=await submit(f); await assign(f,s); const q=await respond(f,s);
  await db.query('update sc_live.responses set starts_at=now()-interval \'2 hours\',ends_at=now()-interval \'1 hour\' where id=$1',[q.id]);
  await assert.rejects(confirm(f,s,q), /proposal_not_bookable/);
  const u=await submit(f); await assign(f,u); const v=await respond(f,u);
  await db.query('update sc_live.businesses set active=false where id=$1',[f.business.a]);
  await assert.rejects(confirm(f,u,v), /business_not_eligible/);
});

test('Cancellation is authorized, idempotent and final', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r); const p=await respond(f,r);
  await assert.rejects(as(f.other,'select sc_live.cancel_request($1)',[r]), /not_authorized/);
  await as(f.customer,'select sc_live.cancel_request($1)',[r]);
  await as(f.customer,'select sc_live.cancel_request($1)',[r]);
  await assert.rejects(confirm(f,r,p), /request_not_open/);
  assert.equal((await db.query('select count(*)::int as n from sc_live.outbox where request_id=$1 and kind=$2',[r,'cancelled'])).rows[0].n,2);
});

test('Outcomes require the selected parties and a past appointment; business cannot read unrelated outcomes', async () => {
  const f=await fixture(), r=await submit(f); await assign(f,r); const p=await respond(f,r); await confirm(f,r,p);
  await assert.rejects(as(f.customer,'select sc_live.report_outcome($1,$2)',[r,'completed']), /too_early/);
  await db.query('update sc_live.responses set starts_at=now()-interval \'2 hours\',ends_at=now()-interval \'1 hour\' where id=$1',[p.id]);
  await as(f.customer,'select sc_live.report_outcome($1,$2)',[r,'completed']);
  await as(f.a,'select sc_live.report_outcome($1,$2)',[r,'completed']);
  await assert.rejects(as(f.b,'select sc_live.report_outcome($1,$2)',[r,'completed']), /not_authorized/);
  const g=await fixture(),s=await submit(g); await assign(g,s); const q=await respond(g,s); await confirm(g,s,q);
  await db.query('update sc_live.responses set starts_at=now()-interval \'2 hours\',ends_at=now()-interval \'1 hour\' where id=$1',[q.id]);
  await as(g.customer,'select sc_live.report_outcome($1,$2)',[s,'completed']);
  assert.equal((await as(f.a,'select * from sc_live.outcomes')).length,2);
});

test('Retention closes expired requests and purges closed content with dependent rows', async () => {
  const f=await fixture(),r=await submit(f); await assign(f,r); const p=await respond(f,r); await confirm(f,r,p);
  await as(f.customer,'select sc_live.cancel_request($1)',[r]);
  await db.query('update sc_live.requests set closed_at=now()-interval \'31 days\' where id=$1',[r]);
  const removed=(await db.query('select sc_live.maintenance() as n')).rows[0].n;
  assert.equal(removed,1);
  for (const table of ['requests','assignments','responses','outbox','outcomes']) {
    const key=table==='requests'?'id':'request_id';
    assert.equal((await db.query(`select count(*)::int as n from sc_live.${table} where ${key}=$1`,[r])).rows[0].n,0);
  }
});
