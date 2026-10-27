// Offline analysis only. No tracking, network calls, uploads or contact data.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const requestFields = new Set(['id','user_id','created_at','response_due_at','first_response_at','first_helpful_response_at',
  'confirmed_at','cancelled_at','customer_completed_at','business_completed_at','manual_minutes','manual_reminders','is_test']);
const activityFields = new Set(['user_id','at','type','audience','is_test']);
const meaningful = new Set(['map_profile_open_after_search','live_request','live_response']);
const day = 86400000;
const percent = (n,d) => d ? Math.round(10000*n/d)/100 : null;
const median = values => {
  if (!values.length) return null;
  const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
};
const time = value => {
  if (typeof value!=='string' || !/(Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) throw Error('Timestamp needs an explicit timezone');
  return Date.parse(value);
};
const identifier = value => { if (typeof value!=='string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw Error('Use pseudonymous IDs'); };
function fields(row,allowed) {
  if (!row || typeof row!=='object' || Array.isArray(row) || Object.keys(row).some(k=>!allowed.has(k))) throw Error('Invalid fields; exclude contact data and free text');
  if (typeof row.is_test!=='boolean') throw Error('Every record needs is_test=true/false');
}

export function summarize(input,at=new Date().toISOString()) {
  const cutoff=time(at), seen=new Set();
  if (!input || !Array.isArray(input.requests) || !Array.isArray(input.activities)) throw Error('Expected requests and activities arrays');
  const requests=[];
  for (const r of input.requests) {
    fields(r,requestFields); identifier(r.id); identifier(r.user_id);
    if (seen.has(r.id)) throw Error('Duplicate request ID'); seen.add(r.id);
    const created=time(r.created_at),due=time(r.response_due_at);
    if (due<created) throw Error('Response deadline precedes submission');
    const event={};
    for (const k of ['first_response_at','first_helpful_response_at','confirmed_at','cancelled_at','customer_completed_at','business_completed_at']) {
      event[k]=r[k]==null?null:time(r[k]);
      if (event[k]!==null && event[k]<created) throw Error('Event precedes submission');
    }
    if (event.first_helpful_response_at!==null && (event.first_response_at===null || event.first_helpful_response_at<event.first_response_at)) throw Error('Helpful response needs a prior response');
    if (event.confirmed_at!==null && (event.first_helpful_response_at===null || event.confirmed_at<event.first_helpful_response_at)) throw Error('Confirmation needs a prior helpful response');
    if (event.cancelled_at!==null && event.confirmed_at!==null && event.cancelled_at<event.confirmed_at) throw Error('Confirmation follows cancellation');
    for (const k of ['customer_completed_at','business_completed_at']) {
      if (event[k]!==null && (event.confirmed_at===null || event[k]<event.confirmed_at)) throw Error('Completion needs prior confirmation');
    }
    for (const k of ['manual_minutes','manual_reminders']) {
      if (r[k]!=null && (!Number.isFinite(r[k]) || r[k]<0 || (k==='manual_reminders' && !Number.isInteger(r[k])))) throw Error('Invalid manual effort');
    }
    if (!r.is_test && created<=cutoff) requests.push({...r,created,due,event:Object.fromEntries(Object.entries(event).map(([k,v])=>[k,v!==null&&v<=cutoff?v:null]))});
  }
  const actions=[];
  for (const a of input.activities) {
    fields(a,activityFields); identifier(a.user_id);
    if (!['customer','business'].includes(a.audience) || typeof a.type!=='string') throw Error('Invalid activity');
    const timestamp=time(a.at);
    if (!a.is_test && meaningful.has(a.type) && timestamp<=cutoff) actions.push({...a,timestamp});
  }
  requests.forEach(r=>actions.push({user_id:r.user_id,audience:'customer',timestamp:r.created}));
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'});
  const active=new Set(),customers=new Set(),businesses=new Set(),days=new Map();
  for (const a of actions) {
    if (a.timestamp>=cutoff-7*day) { active.add(a.user_id); (a.audience==='customer'?customers:businesses).add(a.user_id); }
    if (a.timestamp>=cutoff-14*day) { if (!days.has(a.user_id)) days.set(a.user_id,new Set()); days.get(a.user_id).add(date.format(a.timestamp)); }
  }
  const matured=requests.filter(r=>r.due<=cutoff && !(r.event.cancelled_at!==null && r.event.cancelled_at<r.due));
  const cancelledBeforeDeadline=requests.filter(r=>r.event.cancelled_at!==null && r.event.cancelled_at<r.due);
  const timely=matured.filter(r=>r.event.first_helpful_response_at!==null && r.event.first_helpful_response_at<=r.due);
  const noResponse=matured.filter(r=>r.event.first_response_at===null);
  const confirmed=requests.filter(r=>r.event.confirmed_at!==null && r.event.cancelled_at===null);
  const bothCompleted=confirmed.filter(r=>r.event.customer_completed_at!==null && r.event.business_completed_at!==null);
  const minutes=requests.filter(r=>r.manual_minutes!=null).map(r=>r.manual_minutes);
  const reminders=requests.filter(r=>r.manual_reminders!=null).map(r=>r.manual_reminders);
  const elapsed=requests.filter(r=>r.event.first_response_at!==null).map(r=>(r.event.first_response_at-r.created)/60000);
  return {
    as_of:new Date(cutoff).toISOString(),status:requests.length?'measured_records':'no_real_request_data',
    real_requests:requests.length,
    requests_with_helpful_response:requests.filter(r=>r.event.first_helpful_response_at!==null).length,
    mature_requests:matured.length,cancelled_before_deadline:cancelledBeforeDeadline.length,
    pending_before_deadline:requests.filter(r=>r.due>cutoff && r.event.cancelled_at===null && r.event.first_response_at===null).length,
    helpful_within_deadline:timely.length,helpful_within_deadline_percent:percent(timely.length,matured.length),
    no_response_after_deadline:noResponse.length,no_response_after_deadline_percent:percent(noResponse.length,matured.length),
    current_confirmed_matches:confirmed.length,confirmed_matches_percent:percent(confirmed.length,requests.length),
    confirmed_then_cancelled:requests.filter(r=>r.event.confirmed_at!==null && r.event.cancelled_at!==null).length,
    completed_confirmed_by_both:bothCompleted.length,
    median_first_response_minutes:median(elapsed),response_time_sample_size:elapsed.length,
    median_manual_minutes:median(minutes),manual_minutes_coverage:minutes.length,
    median_manual_reminders:median(reminders),manual_reminders_coverage:reminders.length,
    active_people_7d:active.size,active_customers_7d:customers.size,active_business_people_7d:businesses.size,
    returning_people_14d:[...days.values()].filter(d=>d.size>=2).length,
    note:'Offline records, not an independently verified delivery log. Tests excluded; null rates mean no eligible denominator. Response-time median excludes unanswered requests.'
  };
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {
    const [file,at]=process.argv.slice(2);
    if (!file) throw Error('Usage: node scripts/one-pilot-metrics.mjs PRIVATE.json [ISO_TIMESTAMP]');
    process.stdout.write(JSON.stringify(summarize(JSON.parse(readFileSync(file,'utf8')),at),null,2)+'\n');
  } catch (error) { process.stderr.write('Auswertung abgebrochen: '+error.message+'\n'); process.exitCode=1; }
}
