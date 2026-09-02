import {json,bodyJson,clean,isEmail,randomToken,sha256Hex,parseCookie} from './utils.js';
const COOKIE='sfn_academic_session';
const ITER=100000;

function bytesHex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
function hexBytes(hex){const a=new Uint8Array(hex.length/2);for(let i=0;i<a.length;i++)a[i]=parseInt(hex.slice(i*2,i*2+2),16);return a;}
async function derive(password,saltHex,iterations=ITER){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:hexBytes(saltHex),iterations},key,256);
  return bytesHex(new Uint8Array(bits));
}
export async function hashPassword(password){const salt=new Uint8Array(16);crypto.getRandomValues(salt);const saltHex=bytesHex(salt);return {salt:saltHex,hash:await derive(password,saltHex),iterations:ITER};}
async function verifyPassword(password,row){const h=await derive(password,row.password_salt,row.password_iterations||ITER);return h===row.password_hash;}
function sessionCookie(token,maxAge=28800){return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;}
function clearCookie(){return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;}
async function ipKey(request){return sha256Hex(request.headers.get('cf-connecting-ip')||'unknown');}
async function allowedAttempt(request,env){
  const key=await ipKey(request), now=Math.floor(Date.now()/1000), window=900;
  const row=await env.DB.prepare('SELECT * FROM login_attempts WHERE key=?').bind(key).first();
  if(!row||now-row.window_started_at>window){await env.DB.prepare('INSERT OR REPLACE INTO login_attempts(key,count,window_started_at) VALUES(?,?,?)').bind(key,0,now).run();return true;}
  return row.count<8;
}
async function markAttempt(request,env,success){const key=await ipKey(request),now=Math.floor(Date.now()/1000);if(success){await env.DB.prepare('DELETE FROM login_attempts WHERE key=?').bind(key).run();}else{await env.DB.prepare('INSERT INTO login_attempts(key,count,window_started_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=count+1').bind(key,1,now).run();}}
export async function getAdmin(request,env){
  const token=parseCookie(request,COOKIE);if(!token)return null;const hash=await sha256Hex(token);
  const row=await env.DB.prepare(`SELECT a.id,a.email,a.full_name,a.status,s.expires_at FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND a.status='active'`).bind(hash).first();
  if(!row)return null; await env.DB.prepare('UPDATE sessions SET last_seen_at=CURRENT_TIMESTAMP WHERE token_hash=?').bind(hash).run(); return row;
}
export async function requireAdmin(request,env){const a=await getAdmin(request,env);return a||null;}
export async function authRoute(request,env,url){
  if(url.pathname==='/api/auth/me'&&request.method==='GET'){const a=await getAdmin(request,env);return json({authenticated:!!a,admin:a?{id:a.id,email:a.email,full_name:a.full_name}:null});}
  if(url.pathname==='/api/auth/login'&&request.method==='POST'){
    if(!await allowedAttempt(request,env))return json({error:'TOO_MANY_ATTEMPTS'},429);
    const b=await bodyJson(request);const email=clean(b?.email,254).toLowerCase(),password=String(b?.password||'');
    const row=isEmail(email)?await env.DB.prepare('SELECT * FROM admins WHERE email=?').bind(email).first():null;
    const ok=row&&row.status==='active'&&password.length>=10&&await verifyPassword(password,row);
    await markAttempt(request,env,!!ok);if(!ok)return json({error:'INVALID_CREDENTIALS'},401);
    const token=randomToken(48),hash=await sha256Hex(token),ip=await ipKey(request);
    await env.DB.prepare("INSERT INTO sessions(admin_id,token_hash,user_agent,ip_hash,expires_at) VALUES(?,?,?,?,datetime('now','+8 hours'))").bind(row.id,hash,clean(request.headers.get('user-agent'),300),ip).run();
    await env.DB.prepare('UPDATE admins SET last_login_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.id).run();
    await env.DB.prepare("INSERT INTO audit_log(admin_id,action,entity_type,entity_id,details_json) VALUES(?,'login','admin',?,'{}')").bind(row.id,String(row.id)).run();
    return json({ok:true,admin:{id:row.id,email:row.email,full_name:row.full_name}},200,{'set-cookie':sessionCookie(token)});
  }
  if(url.pathname==='/api/auth/logout'&&request.method==='POST'){
    const token=parseCookie(request,COOKIE);if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256Hex(token)).run();
    return json({ok:true},200,{'set-cookie':clearCookie()});
  }
  // One-time bootstrap. Set BOOTSTRAP_TOKEN using `wrangler secret put BOOTSTRAP_TOKEN`, then remove/rotate it after first admin creation.
  if(url.pathname==='/api/auth/bootstrap'&&request.method==='POST'){
const supplied=request.headers.get('x-bootstrap-token')||''; if(!env.BOOTSTRAP_TOKEN_||supplied!==env.BOOTSTRAP_TOKEN_)return json({error:'NOT_AVAILABLE'},404);
    const count=await env.DB.prepare('SELECT COUNT(*) AS c FROM admins').first();if(Number(count?.c||0)>0)return json({error:'ALREADY_BOOTSTRAPPED'},409);
    const b=await bodyJson(request),email=clean(b?.email,254).toLowerCase(),name=clean(b?.full_name,120),password=String(b?.password||'');
    if(!isEmail(email)||name.length<2||password.length<14)return json({error:'INVALID_INPUT'},400);
    const hp=await hashPassword(password);await env.DB.prepare('INSERT INTO admins(email,full_name,password_salt,password_hash,password_iterations) VALUES(?,?,?,?,?)').bind(email,name,hp.salt,hp.hash,hp.iterations).run();
    return json({ok:true});
  }
  return null;
}
