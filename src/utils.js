export function json(data,status=200,headers={}){
  const h=new Headers(headers); h.set('content-type','application/json; charset=utf-8');
  return new Response(JSON.stringify(data),{status,headers:h});
}
export function text(data,status=200,headers={}){return new Response(data,{status,headers});}
export function uid(prefix='id'){return `${prefix}_${crypto.randomUUID().replaceAll('-','')}`;}
export function clean(v,max=1000){return String(v??'').trim().slice(0,max);}
export function slugify(v){return clean(v,180).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120);}
export function escapeLike(v){return String(v??'').replace(/[\\%_]/g,m=>'\\'+m);}
export async function sha256Hex(value){const b=value instanceof ArrayBuffer?value:new TextEncoder().encode(String(value)); const d=await crypto.subtle.digest('SHA-256',b); return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function b64url(bytes){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
export function randomToken(size=32){const a=new Uint8Array(size);crypto.getRandomValues(a);return b64url(a);}
export function parseCookie(req,name){const c=req.headers.get('cookie')||'';for(const p of c.split(';')){const [k,...r]=p.trim().split('=');if(k===name)return decodeURIComponent(r.join('='));}return null;}
export function sameOrigin(req,appUrl){const origin=req.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(appUrl).origin}catch{return false}}
export function isStateChanging(req){return !['GET','HEAD','OPTIONS'].includes(req.method);}
export async function bodyJson(req){try{return await req.json()}catch{return null}}
export function isEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||''));}
