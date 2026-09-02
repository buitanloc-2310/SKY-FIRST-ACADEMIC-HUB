import {json,sameOrigin,isStateChanging} from './utils.js';
import {authRoute} from './auth.js';
import {publicRoute} from './public.js';
import {adminRoute} from './admin.js';

function secure(resp){
  const h=new Headers(resp.headers);
  h.set('x-content-type-options','nosniff');
  h.set('x-frame-options','DENY');
  h.set('referrer-policy','strict-origin-when-cross-origin');
  h.set('permissions-policy','camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  h.set('strict-transport-security','max-age=63072000; includeSubDomains; preload');
  h.set('cross-origin-opener-policy','same-origin');
  h.set('cross-origin-resource-policy','same-origin');
  h.set('content-security-policy',[
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; '));
  return new Response(resp.body,{status:resp.status,statusText:resp.statusText,headers:h});
}

const META={
  '/': ['Trang chủ','Tìm giáo trình, bài giảng, bài tập, ngân hàng đề và nội dung học thuật của Sky First Network.'],
  '/library': ['Toàn bộ học liệu SFN','Tra cứu toàn bộ học liệu đã công bố trên Sky First Academic Hub.'],
  '/materials/textbooks': ['Giáo trình','Giáo trình và tài liệu học tập trên Sky First Academic Hub.'],
  '/materials/lessons': ['Bài giảng','Bài giảng và học liệu hỗ trợ dạy - học trên Sky First Academic Hub.'],
  '/materials/exercises': ['Bài tập','Phiếu bài tập và tài liệu thực hành trên Sky First Academic Hub.'],
  '/materials/exams': ['Ngân hàng đề','Đề luyện tập và đánh giá trên Sky First Academic Hub.'],
  '/academic/research': ['Nghiên cứu','Công trình và tài liệu nghiên cứu được công bố trên Sky First Academic Hub.'],
  '/academic/articles': ['Bài viết học thuật','Bài viết học thuật và nội dung phổ biến tri thức trên Sky First Academic Hub.'],
  '/academic/reports': ['Báo cáo','Báo cáo chuyên môn và học thuật trên Sky First Academic Hub.'],
  '/resources/references': ['Tài liệu tham khảo','Nguồn tham khảo được tổng hợp và ghi nhận nguồn trên Sky First Academic Hub.'],
  '/resources/official': ['Nguồn giáo dục chính thống','Danh mục nguồn giáo dục chính thống trên Sky First Academic Hub.'],
  '/resources/international': ['Tài nguyên quốc tế','Nguồn học thuật và giáo dục quốc tế được tuyển chọn để tham khảo.'],
  '/fields': ['Lĩnh vực học thuật','Khám phá học liệu theo lĩnh vực trên Sky First Academic Hub.'],
  '/units': ['Đơn vị học thuật','Khám phá học liệu theo đơn vị trong hệ sinh thái Sky First Network.'],
  '/search': ['Tìm kiếm nâng cao','Tìm tài liệu theo tên, mã, từ khóa, lĩnh vực và đơn vị.'],
  '/document-code': ['Tra cứu mã tài liệu','Tra cứu hồ sơ tài liệu theo mã công bố trên Sky First Academic Hub.'],
  '/versions': ['Tra cứu phiên bản tài liệu','Kiểm tra lịch sử phiên bản của tài liệu trên Sky First Academic Hub.'],
  '/about': ['Về Cổng Học thuật','Giới thiệu mục tiêu, đối tượng phục vụ và mô hình vận hành của Sky First Academic Hub.'],
  '/terms': ['Quy định sử dụng','Quy định sử dụng nội dung và tài nguyên trên Sky First Academic Hub.'],
  '/copyright': ['Bản quyền','Thông tin quyền tác giả, nguồn bên ngoài và quy trình tiếp nhận yêu cầu bản quyền.'],
  '/privacy': ['Quyền riêng tư','Thông tin về dữ liệu kỹ thuật, tài khoản quản trị và quyền riêng tư trên Academic Hub.'],
  '/contact': ['Liên hệ','Kênh liên hệ và hỗ trợ chính thức của Sky First Academic Hub và Sky First Network.']
};

function escapeHtml(s=''){
  return String(s).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function routeMeta(pathname){
  if(pathname.startsWith('/document/')){
    return ['Tài liệu','Hồ sơ tài liệu và phiên bản công bố trên Sky First Academic Hub.'];
  }
  if(pathname.startsWith('/field/')){
    return ['Học liệu theo lĩnh vực','Khám phá tài liệu theo lĩnh vực trên Sky First Academic Hub.'];
  }
  if(pathname.startsWith('/unit/')){
    return ['Học liệu theo đơn vị','Khám phá tài liệu theo đơn vị trên Sky First Academic Hub.'];
  }
  return META[pathname]||['Sky First Academic Hub','Cổng Học liệu & Học thuật của Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN).'];
}

function isHtmlRoute(request,url){
  if(request.method!=='GET'||url.pathname.startsWith('/api/'))return false;
  const last=url.pathname.split('/').pop()||'';
  if(last.includes('.'))return false;
  const accept=request.headers.get('accept')||'';
  return !accept||accept.includes('text/html')||accept.includes('*/*');
}

async function pageResponse(request,env,url,status=200){
  const baseReq=new Request(new URL('/index.html',url),{
    method:'GET',
    headers:request.headers
  });
  const base=await env.ASSETS.fetch(baseReq);
  if(!base.ok)return base;

  const [pageTitle,description]=routeMeta(url.pathname);
  const fullTitle=pageTitle==='Trang chủ'?'Sky First Academic Hub':`${pageTitle} | Sky First Academic Hub`;
  const appBase=(env.APP_URL||url.origin).replace(/\/$/,'');
  const canonical=`${appBase}${url.pathname==='/'?'/':url.pathname}`;

  let html=await base.text();
  html=html
    .replace(/<title>[^<]*<\/title>/i,`<title>${escapeHtml(fullTitle)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/i,`<meta property="og:title" content="${escapeHtml(fullTitle)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/i,`<meta property="og:description" content="${escapeHtml(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/i,`<meta property="og:url" content="${escapeHtml(canonical)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/i,`<link rel="canonical" href="${escapeHtml(canonical)}">`);

  const h=new Headers(base.headers);
  h.set('content-type','text/html; charset=utf-8');
  h.set('cache-control','public, max-age=300');
  if(status===404||url.pathname.startsWith('/admin'))h.set('x-robots-tag','noindex, nofollow');
  return new Response(html,{status,headers:h});
}

const LEGACY_REDIRECTS={
  '/materials/answer-keys':'/materials/exams',
  '/academic/topics':'/academic/articles',
  '/resources/links':'/resources/references',
  '/collections':'/library'
};

async function handle(request,env){
  const url=new URL(request.url);

  if(request.method==='GET' && LEGACY_REDIRECTS[url.pathname]){
    return Response.redirect(new URL(LEGACY_REDIRECTS[url.pathname],url),301);
  }

  if(isStateChanging(request) && url.pathname.startsWith('/api/')){
    const validCurrentOrigin=sameOrigin(request,url.origin);
    const validAppOrigin=env.APP_URL?sameOrigin(request,env.APP_URL):false;
    if(!validCurrentOrigin&&!validAppOrigin&&url.pathname!=='/api/auth/bootstrap'){
      return json({error:'BAD_ORIGIN'},403);
    }
  }

  if(url.pathname==='/api/health'){
    return json({
      ok:true,
      app:'Sky First Academic Hub',
      instance_id:env.INSTANCE_ID||'bc5bc5f5-b089-4102-a812-3b2666a802af',
      time:new Date().toISOString(),
      database:!!env.DB,
      storage:!!env.FILES
    });
  }

  let r=await authRoute(request,env,url);if(r)return r;
  r=await publicRoute(request,env,url);if(r)return r;
  r=await adminRoute(request,env,url);if(r)return r;

  if(isHtmlRoute(request,url)){
    const known=Boolean(
      META[url.pathname] ||
      url.pathname.startsWith('/document/') ||
      url.pathname.startsWith('/field/') ||
      url.pathname.startsWith('/unit/') ||
      url.pathname==='/admin' ||
      url.pathname==='/admin/login'
    );
    return pageResponse(request,env,url,known?200:404);
  }

  const asset=await env.ASSETS.fetch(request);
  if(asset.status!==404)return asset;
  return json({error:'NOT_FOUND'},404);
}

export default {
  async fetch(request,env){
    try{
      return secure(await handle(request,env));
    }catch(e){
      console.error(e);
      return secure(json({error:'INTERNAL_ERROR',message:'Hệ thống gặp lỗi. Vui lòng thử lại sau.'},500));
    }
  },
  async scheduled(controller,env,ctx){
    ctx.waitUntil(env.DB.prepare("DELETE FROM sessions WHERE expires_at<=CURRENT_TIMESTAMP").run());
  }
};
