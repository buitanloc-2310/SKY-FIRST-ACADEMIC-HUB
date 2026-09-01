import {json,clean,escapeLike} from './utils.js';

function normalizeDoc(r){if(!r)return null;return {...r,featured:!!r.featured};}
export async function publicRoute(request,env,url){
  if(request.method!=='GET')return null;
  if(url.pathname==='/api/public/stats'){
    const [docs,units,fields]=await Promise.all([
      env.DB.prepare("SELECT COUNT(*) c FROM documents WHERE status='published'").first(),
      env.DB.prepare("SELECT COUNT(*) c FROM units WHERE status='active'").first(),
      env.DB.prepare("SELECT COUNT(*) c FROM fields WHERE status='active'").first()
    ]);return json({documents:Number(docs?.c||0),units:Number(units?.c||0),fields:Number(fields?.c||0)});
  }
  if(url.pathname==='/api/public/home'){
    const featured=await env.DB.prepare(`SELECT d.*,u.name unit_name,u.short_name unit_short_name,f.name field_name,c.name category_name FROM documents d LEFT JOIN units u ON u.id=d.unit_id LEFT JOIN fields f ON f.id=d.field_id LEFT JOIN categories c ON c.id=d.category_id WHERE d.status='published' ORDER BY d.featured DESC,d.published_at DESC,d.created_at DESC LIMIT 12`).all();
    const fields=await env.DB.prepare("SELECT * FROM fields WHERE status='active' ORDER BY sort_order,name LIMIT 20").all();
    return json({featured:(featured.results||[]).map(normalizeDoc),fields:fields.results||[]});
  }
  if(url.pathname==='/api/public/units'){
    const q=clean(url.searchParams.get('q'),100),limit=Math.min(100,Math.max(1,Number(url.searchParams.get('limit')||30))),offset=Math.max(0,Number(url.searchParams.get('offset')||0));
    let sql=`SELECT u.*,COUNT(d.id) document_count FROM units u LEFT JOIN documents d ON d.unit_id=u.id AND d.status='published' WHERE u.status='active'`,args=[];
    if(q){sql+=` AND (u.name LIKE ? ESCAPE '\\' OR u.code LIKE ? ESCAPE '\\')`;const v=`%${escapeLike(q)}%`;args.push(v,v);}sql+=` GROUP BY u.id ORDER BY u.sort_order,u.name LIMIT ? OFFSET ?`;args.push(limit,offset);
    const rs=await env.DB.prepare(sql).bind(...args).all();return json({items:rs.results||[]});
  }
  if(url.pathname.startsWith('/api/public/unit/')){
    const slug=clean(decodeURIComponent(url.pathname.split('/').pop()),120);const unit=await env.DB.prepare("SELECT * FROM units WHERE slug=? AND status='active'").bind(slug).first();if(!unit)return json({error:'NOT_FOUND'},404);
    const docs=await env.DB.prepare(`SELECT d.*,f.name field_name,c.name category_name FROM documents d LEFT JOIN fields f ON f.id=d.field_id LEFT JOIN categories c ON c.id=d.category_id WHERE d.unit_id=? AND d.status='published' ORDER BY d.published_at DESC LIMIT 100`).bind(unit.id).all();return json({unit,documents:docs.results||[]});
  }
  if(url.pathname==='/api/public/fields'){const rs=await env.DB.prepare("SELECT * FROM fields WHERE status='active' ORDER BY sort_order,name").all();return json({items:rs.results||[]});}
  if(url.pathname==='/api/public/categories'){const scope=clean(url.searchParams.get('scope'),20);let sql="SELECT * FROM categories WHERE status='active'",args=[];if(scope){sql+=' AND library_scope=?';args.push(scope)}sql+=' ORDER BY sort_order,name';const rs=await env.DB.prepare(sql).bind(...args).all();return json({items:rs.results||[]});}
  if(url.pathname==='/api/public/search'){
    const q=clean(url.searchParams.get('q'),150),scope=clean(url.searchParams.get('scope'),20),unit=clean(url.searchParams.get('unit'),80),field=clean(url.searchParams.get('field'),80),category=clean(url.searchParams.get('category'),80),type=clean(url.searchParams.get('type'),80),year=Number(url.searchParams.get('year')||0),limit=Math.min(60,Math.max(1,Number(url.searchParams.get('limit')||24))),offset=Math.max(0,Number(url.searchParams.get('offset')||0));
    let where=["d.status='published'"],args=[];
    if(q){const v=`%${escapeLike(q)}%`;where.push(`(d.title LIKE ? ESCAPE '\\' OR d.code LIKE ? ESCAPE '\\' OR d.summary LIKE ? ESCAPE '\\' OR d.keywords LIKE ? ESCAPE '\\')`);args.push(v,v,v,v)}
    if(scope){where.push('d.library_scope=?');args.push(scope)}if(unit){where.push('u.slug=?');args.push(unit)}if(field){where.push('f.slug=?');args.push(field)}if(category){where.push('c.slug=?');args.push(category)}if(type){where.push('d.document_type=?');args.push(type)}if(year){where.push('d.publication_year=?');args.push(year)}
    const base=` FROM documents d LEFT JOIN units u ON u.id=d.unit_id LEFT JOIN fields f ON f.id=d.field_id LEFT JOIN categories c ON c.id=d.category_id WHERE ${where.join(' AND ')}`;
    const total=await env.DB.prepare(`SELECT COUNT(*) c${base}`).bind(...args).first();
    const rs=await env.DB.prepare(`SELECT d.*,u.name unit_name,u.short_name unit_short_name,u.slug unit_slug,f.name field_name,f.slug field_slug,c.name category_name,c.slug category_slug${base} ORDER BY d.featured DESC,d.published_at DESC,d.title LIMIT ? OFFSET ?`).bind(...args,limit,offset).all();
    return json({items:(rs.results||[]).map(normalizeDoc),total:Number(total?.c||0),limit,offset});
  }
  if(url.pathname.startsWith('/api/public/document/')){
    const key=clean(decodeURIComponent(url.pathname.split('/').pop()),180);const d=await env.DB.prepare(`SELECT d.*,u.name unit_name,u.short_name unit_short_name,u.slug unit_slug,f.name field_name,f.slug field_slug,c.name category_name,c.slug category_slug FROM documents d LEFT JOIN units u ON u.id=d.unit_id LEFT JOIN fields f ON f.id=d.field_id LEFT JOIN categories c ON c.id=d.category_id WHERE (d.slug=? OR d.code=?) AND d.status='published'`).bind(key,key).first();if(!d)return json({error:'NOT_FOUND'},404);
    const versions=await env.DB.prepare('SELECT id,version_label,version_number,change_note,filename,file_size,sha256,page_count,status,effective_at,created_at FROM document_versions WHERE document_id=? ORDER BY version_number DESC,created_at DESC').bind(d.id).all();
    return json({document:normalizeDoc(d),versions:versions.results||[]});
  }
  if(url.pathname.startsWith('/api/public/version-file/')){
    const id=clean(decodeURIComponent(url.pathname.split('/').pop()),80);const v=await env.DB.prepare(`SELECT v.*,d.status document_status,d.access_mode,d.library_scope,d.external_source_url FROM document_versions v JOIN documents d ON d.id=v.document_id WHERE v.id=? AND d.status='published'`).bind(id).first();if(!v)return json({error:'NOT_FOUND'},404);if(v.access_mode==='metadata_only'||v.access_mode==='external_link'||!v.file_key)return json({error:'FILE_NOT_PUBLIC'},403);
    const obj=await env.FILES.get(v.file_key);if(!obj)return json({error:'FILE_NOT_FOUND'},404);const h=new Headers();h.set('content-type',v.mime||'application/pdf');h.set('content-disposition',`${v.access_mode==='view_only'?'inline':'inline'}; filename*=UTF-8''${encodeURIComponent(v.filename||'document.pdf')}`);h.set('cache-control','public, max-age=3600');return new Response(obj.body,{headers:h});
  }
  if(url.pathname==='/api/public/lookup-code'){const code=clean(url.searchParams.get('code'),100);if(!code)return json({error:'MISSING_CODE'},400);const d=await env.DB.prepare("SELECT code,slug,title,summary,status,publication_year,current_version_id FROM documents WHERE code=? AND status='published'").bind(code).first();return d?json({document:d}):json({error:'NOT_FOUND'},404);}
  if(url.pathname==='/api/public/lookup-versions'){const key=clean(url.searchParams.get('q'),160);if(!key)return json({error:'MISSING_QUERY'},400);const d=await env.DB.prepare("SELECT id,code,slug,title FROM documents WHERE status='published' AND (code=? OR slug=? OR title LIKE ?) ORDER BY CASE WHEN code=? THEN 0 ELSE 1 END LIMIT 1").bind(key,key,`%${escapeLike(key)}%`,key).first();if(!d)return json({error:'NOT_FOUND'},404);const v=await env.DB.prepare('SELECT id,version_label,version_number,change_note,status,effective_at,created_at FROM document_versions WHERE document_id=? ORDER BY version_number DESC').bind(d.id).all();return json({document:d,versions:v.results||[]});}
  return null;
}
