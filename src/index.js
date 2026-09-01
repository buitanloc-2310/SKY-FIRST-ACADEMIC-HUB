import {json,sameOrigin,isStateChanging} from './utils.js';
import {authRoute} from './auth.js';
import {publicRoute} from './public.js';
import {adminRoute} from './admin.js';

function secure(resp){
  const h=new Headers(resp.headers);h.set('x-content-type-options','nosniff');h.set('x-frame-options','DENY');h.set('referrer-policy','strict-origin-when-cross-origin');h.set('permissions-policy','camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');h.set('strict-transport-security','max-age=63072000; includeSubDomains; preload');h.set('cross-origin-opener-policy','same-origin');h.set('cross-origin-resource-policy','same-origin');
  h.set('content-security-policy',["default-src 'self'","script-src 'self'","style-src 'self' 'unsafe-inline'","img-src 'self' data:","font-src 'self' data:","connect-src 'self'","frame-ancestors 'none'","form-action 'self'","base-uri 'self'","object-src 'none'"].join('; '));
  return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h});
}
async function handle(request,env){const url=new URL(request.url);
if(isStateChanging(request) && url.pathname.startsWith('/api/')){
  const validCurrentOrigin = sameOrigin(request, url.origin);
  const validAppOrigin = env.APP_URL ? sameOrigin(request, env.APP_URL) : false;

  if(
    !validCurrentOrigin &&
    !validAppOrigin &&
    url.pathname !== '/api/auth/bootstrap'
  ){
    return json({error:'BAD_ORIGIN'},403);
  }
}
  if(url.pathname==='/api/health')return json({ok:true,app:'Sky First Academic Hub',instance_id:env.INSTANCE_ID||'bc5bc5f5-b089-4102-a812-3b2666a802af',time:new Date().toISOString(),database:!!env.DB,storage:!!env.FILES});
  let r=await authRoute(request,env,url);if(r)return r;r=await publicRoute(request,env,url);if(r)return r;r=await adminRoute(request,env,url);if(r)return r;
  const asset=await env.ASSETS.fetch(request);if(asset.status!==404)return asset;
  if(request.method==='GET'&&!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(new Request(new URL('/index.html',url),request));
  return json({error:'NOT_FOUND'},404);
}
export default {async fetch(request,env){try{return secure(await handle(request,env));}catch(e){console.error(e);return secure(json({error:'INTERNAL_ERROR',message:'Hệ thống gặp lỗi. Vui lòng thử lại sau.'},500));}},async scheduled(controller,env,ctx){ctx.waitUntil(env.DB.prepare("DELETE FROM sessions WHERE expires_at<=CURRENT_TIMESTAMP").run());}};
