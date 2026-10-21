import { createHash } from 'node:crypto';
import { createAgent, services } from './agent.js';
export const MODEL = 'openai/gpt-5.4-mini';
const allowedOrigins = new Set(['https://socialclip.art','https://www.socialclip.art']);
const buckets = new Map();
export function createHandler({generate, enabled = () => process.env.CHAT_ENABLED === 'true', now = Date.now} = {}) {
  return async function handle(request) {
    const origin = request.headers.get('origin');
    const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin']=origin;
    const respond=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
    if(origin && !allowedOrigins.has(origin)) return respond({error:'origin_not_allowed'},403);
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    if(request.method==='GET') return respond({available:enabled(),name:'SocialClip KI-Chat',version:1});
    if(request.method!=='POST') return respond({error:'method_not_allowed'},405,{'Allow':'GET, POST, OPTIONS'});
    if(!enabled()) return respond({error:'not_enabled',message:'Der KI-Chat ist noch nicht freigeschaltet. Du erreichst SocialClip über das Kontaktformular.'},503);
    if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json')) return respond({error:'invalid_content_type'},415);
    if(Number(request.headers.get('content-length')||0)>22000) return respond({error:'request_too_large'},413);
    let raw='';
    try {
      const reader=request.body?.getReader(); if(!reader)return respond({error:'invalid_body'},400);
      const decoder=new TextDecoder();let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>22000){await reader.cancel();return respond({error:'request_too_large'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
    } catch {return respond({error:'invalid_body'},400);}
    let input;try{input=JSON.parse(raw);}catch{return respond({error:'invalid_json'},400);}
    if(input.consent!==true) return respond({error:'consent_required'},400);
    const messages=input.messages;
    if(!Array.isArray(messages)||messages.length<1||messages.length>20||messages[0]?.role!=='user'||messages.at(-1)?.role!=='user')return respond({error:'invalid_messages'},400);
    let chars=0;
    for(let i=0;i<messages.length;i++){
      const m=messages[i];if(!m||m.role!==(i%2===0?'user':'assistant')||typeof m.content!=='string'||!m.content.trim()||m.content.length>1800)return respond({error:'invalid_messages'},400);chars+=m.content.length;
    }
    if(chars>12000)return respond({error:'conversation_limit',message:'Bitte starte einen neuen Chat oder bereite deine Anfrage vor.'},413);
    // Best-effort flood protection per warm instance. A hard monthly budget must be configured in AI Gateway before activation.
    const timestamp=now();
    for(const [k,v] of buckets)if(timestamp-v.start>60000)buckets.delete(k);
    const ip=request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
    const key=createHash('sha256').update(ip).digest('hex');
    const bucket=buckets.get(key)||{start:timestamp,count:0};bucket.count++;buckets.set(key,bucket);
    if(bucket.count>8||buckets.size>500)return respond({error:'rate_limited',message:'Bitte warte eine Minute und versuche es erneut.'},429,{'Retry-After':'60'});
    try{
      const clean=messages.map(({role,content})=>({role,content:content.trim()}));
      const result=generate ? await generate(clean) : await createAgent(process.env.AI_GATEWAY_MODEL||MODEL).generate({messages:clean,abortSignal:AbortSignal.timeout(25000)});
      const reply=result.text?.trim();if(!reply)throw new Error('empty_reply');
      const found=new Set();for(const step of result.steps||[])for(const t of step.toolResults||[])for(const item of Array.isArray(t.output)?t.output:[])if(services.some(s=>s.id===item.id))found.add(item.id);
      return respond({reply:reply.slice(0,6000),services:services.filter(s=>found.has(s.id)).slice(0,3).map(({name,url})=>({name,url}))});
    }catch(error){
      // Do not log prompts, responses, IP addresses, credentials, or provider error bodies.
      const status=error?.statusCode;const category=status===401?'authentication':status===402||status===403?'activation_or_budget':error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':'upstream';
      return respond({error:'temporarily_unavailable',category,message:'Nova kann gerade nicht antworten. Versuche es später erneut oder nutze das Kontaktformular.'},503);
    }
  };
}
