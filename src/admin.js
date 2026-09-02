import {json,bodyJson,clean,slugify,uid,sha256Hex} from './utils.js';
import {requireAdmin} from './auth.js';

async function audit(env,a,action,type,id,details={}){
  await env.DB.prepare(
    'INSERT INTO audit_log(admin_id,action,entity_type,entity_id,details_json) VALUES(?,?,?,?,?)'
  ).bind(
    a.id,
    action,
    type,
    id||null,
    JSON.stringify(details)
  ).run();
}

function req(v,name,max=300){
  const x=clean(v,max);
  if(!x)throw new Error(`MISSING_${name}`);
  return x;
}

export async function adminRoute(request,env,url){

  if(!url.pathname.startsWith('/api/admin/'))return null;

  const a=await requireAdmin(request,env);

  if(!a)return json({error:'UNAUTHORIZED'},401);


  /* =========================================================
     DASHBOARD
  ========================================================= */

  if(
    url.pathname==='/api/admin/dashboard' &&
    request.method==='GET'
  ){

    const [
      docs,
      units,
      drafts,
      external,
      auditRows
    ]=await Promise.all([

      env.DB.prepare(
        'SELECT COUNT(*) c FROM documents'
      ).first(),

      env.DB.prepare(
        "SELECT COUNT(*) c FROM units WHERE status='active'"
      ).first(),

      env.DB.prepare(
        "SELECT COUNT(*) c FROM documents WHERE status='draft'"
      ).first(),

      env.DB.prepare(
        "SELECT COUNT(*) c FROM documents WHERE library_scope='external'"
      ).first(),

      env.DB.prepare(
        'SELECT * FROM audit_log ORDER BY id DESC LIMIT 20'
      ).all()

    ]);

    return json({
      stats:{
        documents:Number(docs?.c||0),
        units:Number(units?.c||0),
        drafts:Number(drafts?.c||0),
        external:Number(external?.c||0)
      },
      audit:auditRows.results||[]
    });
  }


  /* =========================================================
     UNITS
  ========================================================= */

  if(
    url.pathname==='/api/admin/units' &&
    request.method==='GET'
  ){

    const rs=await env.DB.prepare(
      'SELECT * FROM units ORDER BY sort_order,name'
    ).all();

    return json({
      items:rs.results||[]
    });
  }


  if(
    url.pathname==='/api/admin/units' &&
    request.method==='POST'
  ){

    const b=await bodyJson(request);

    try{

      const name=req(b?.name,'NAME');

      const code=req(
        b?.code,
        'CODE',
        30
      ).toUpperCase();

      const slug=slugify(
        b?.slug||name
      );

      const id=uid('unit');

      await env.DB.prepare(`
        INSERT INTO units(
          id,
          code,
          slug,
          name,
          short_name,
          unit_type,
          description,
          logo_url,
          website_url,
          status,
          sort_order
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        id,
        code,
        slug,
        name,
        clean(b?.short_name,80)||code,
        clean(b?.unit_type,80)||'Đơn vị trực thuộc',
        clean(b?.description,3000),
        clean(b?.logo_url,500),
        clean(b?.website_url,500),
        clean(b?.status,20)||'active',
        Number(b?.sort_order||0)
      ).run();

      await audit(
        env,
        a,
        'create',
        'unit',
        id,
        {code,name}
      );

      return json(
        {ok:true,id},
        201
      );

    }catch(e){

      return json(
        {error:e.message||'CREATE_FAILED'},
        400
      );
    }
  }


  /* =========================================================
     TAXONOMY
  ========================================================= */

  if(
    url.pathname==='/api/admin/taxonomy' &&
    request.method==='GET'
  ){

    const [fields,cats]=await Promise.all([

      env.DB.prepare(
        "SELECT * FROM fields WHERE status='active' ORDER BY sort_order,name"
      ).all(),

      env.DB.prepare(
        "SELECT * FROM categories WHERE status='active' ORDER BY sort_order,name"
      ).all()

    ]);

    return json({
      fields:fields.results||[],
      categories:cats.results||[]
    });
  }


  /* =========================================================
     DOCUMENTS — DANH SÁCH
  ========================================================= */

  if(
    url.pathname==='/api/admin/documents' &&
    request.method==='GET'
  ){

    const rs=await env.DB.prepare(`
      SELECT
        d.*,
        u.name unit_name,
        f.name field_name,
        c.name category_name
      FROM documents d
      LEFT JOIN units u
        ON u.id=d.unit_id
      LEFT JOIN fields f
        ON f.id=d.field_id
      LEFT JOIN categories c
        ON c.id=d.category_id
      ORDER BY d.updated_at DESC
      LIMIT 300
    `).all();

    return json({
      items:rs.results||[]
    });
  }


  /* =========================================================
     DOCUMENTS — TẠO TÀI LIỆU
  ========================================================= */

  if(
    url.pathname==='/api/admin/documents' &&
    request.method==='POST'
  ){

    const b=await bodyJson(request);

    try{

      const title=req(
        b?.title,
        'TITLE',
        300
      );

      const code=req(
        b?.code,
        'CODE',
        100
      ).toUpperCase();

      const slug=slugify(
        b?.slug||`${code}-${title}`
      );

      const id=uid('doc');

      const scope=[
        'sfn',
        'external'
      ].includes(b?.library_scope)
        ? b.library_scope
        : 'sfn';

      const status=[
        'draft',
        'published',
        'hidden',
        'archived',
        'withdrawn'
      ].includes(b?.status)
        ? b.status
        : 'draft';

      const access=[
        'view_download',
        'view_only',
        'metadata_only',
        'external_link'
      ].includes(b?.access_mode)
        ? b.access_mode
        : 'view_download';


      await env.DB.prepare(`
        INSERT INTO documents(
          id,
          code,
          slug,
          title,
          subtitle,
          summary,
          document_type,
          library_scope,
          unit_id,
          field_id,
          category_id,
          collection_id,
          authors,
          keywords,
          language,
          publication_year,
          status,
          access_mode,
          external_source_name,
          external_source_url,
          external_rights_note,
          featured,
          published_at
        )
        VALUES(
          ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
          CASE
            WHEN ?='published'
            THEN CURRENT_TIMESTAMP
            ELSE NULL
          END
        )
      `).bind(

        id,
        code,
        slug,
        title,
        clean(b?.subtitle,300),
        clean(b?.summary,5000),
        clean(b?.document_type,100)||'Tài liệu',
        scope,
        b?.unit_id||'unit_sfn',
        b?.field_id||null,
        b?.category_id||null,
        b?.collection_id||null,
        clean(b?.authors,500),
        clean(b?.keywords,1000),
        clean(b?.language,10)||'vi',
        Number(
          b?.publication_year||
          new Date().getFullYear()
        ),
        status,
        access,
        clean(b?.external_source_name,300),
        clean(b?.external_source_url,1000),
        clean(b?.external_rights_note,3000),
        b?.featured?1:0,
        status

      ).run();


      await audit(
        env,
        a,
        'create',
        'document',
        id,
        {
          code,
          title,
          scope,
          status
        }
      );

      return json(
        {
          ok:true,
          id,
          slug
        },
        201
      );

    }catch(e){

      return json(
        {
          error:e.message||'CREATE_FAILED'
        },
        400
      );
    }
  }


  /* =========================================================
     DOCUMENTS — CHỈNH SỬA
  ========================================================= */

  const updateMatch=url.pathname.match(
    /^\/api\/admin\/documents\/([^/]+)$/
  );

  if(
    updateMatch &&
    request.method==='PATCH'
  ){

    const id=decodeURIComponent(
      updateMatch[1]
    );

    const b=await bodyJson(request);

    const old=await env.DB.prepare(
      'SELECT * FROM documents WHERE id=?'
    ).bind(id).first();

    if(!old){
      return json(
        {error:'NOT_FOUND'},
        404
      );
    }


    const status=
      b?.status &&
      [
        'draft',
        'published',
        'hidden',
        'archived',
        'withdrawn'
      ].includes(b.status)

        ? b.status
        : old.status;


    await env.DB.prepare(`
      UPDATE documents
      SET
        title=?,
        subtitle=?,
        summary=?,
        document_type=?,
        unit_id=?,
        field_id=?,
        category_id=?,
        authors=?,
        keywords=?,
        status=?,
        access_mode=?,
        featured=?,
        external_source_name=?,
        external_source_url=?,
        external_rights_note=?,

        published_at=
          CASE
            WHEN ?='published'
            AND published_at IS NULL
            THEN CURRENT_TIMESTAMP
            ELSE published_at
          END,

        updated_at=CURRENT_TIMESTAMP

      WHERE id=?
    `).bind(

      clean(b?.title,300)||old.title,
      clean(b?.subtitle,300),
      clean(b?.summary,5000),
      clean(b?.document_type,100)||old.document_type,

      b?.unit_id||old.unit_id,
      b?.field_id||old.field_id,
      b?.category_id||old.category_id,

      clean(b?.authors,500),
      clean(b?.keywords,1000),

      status,

      b?.access_mode||old.access_mode,

      b?.featured?1:0,

      clean(b?.external_source_name,300),
      clean(b?.external_source_url,1000),
      clean(b?.external_rights_note,3000),

      status,
      id

    ).run();


    await audit(
      env,
      a,
      'update',
      'document',
      id,
      {status}
    );


    return json({
      ok:true
    });
  }


  /* =========================================================
     ⭐ DOCUMENTS — ĐỔI TRẠNG THÁI
     Công bố / Ẩn / Thu hồi / Lưu trữ / Công bố lại
  ========================================================= */

  const statusMatch=url.pathname.match(
    /^\/api\/admin\/documents\/([^/]+)\/status$/
  );

  if(
    statusMatch &&
    request.method==='POST'
  ){

    const id=decodeURIComponent(
      statusMatch[1]
    );

    const b=await bodyJson(request);

    const allowed=[
      'draft',
      'published',
      'hidden',
      'archived',
      'withdrawn'
    ];


    if(!allowed.includes(b?.status)){

      return json(
        {error:'INVALID_STATUS'},
        400
      );
    }


    const current=await env.DB.prepare(`
      SELECT
        id,
        code,
        title,
        status
      FROM documents
      WHERE id=?
    `).bind(id).first();


    if(!current){

      return json(
        {error:'NOT_FOUND'},
        404
      );
    }


    const reason=clean(
      b?.reason,
      1500
    );


    await env.DB.prepare(`
      UPDATE documents
      SET
        status=?,

        published_at=
          CASE
            WHEN ?='published'
            THEN COALESCE(
              published_at,
              CURRENT_TIMESTAMP
            )
            ELSE published_at
          END,

        updated_at=CURRENT_TIMESTAMP

      WHERE id=?
    `).bind(
      b.status,
      b.status,
      id
    ).run();


    await audit(
      env,
      a,
      'document_status_changed',
      'document',
      id,
      {
        code:current.code,
        title:current.title,
        from:current.status,
        to:b.status,
        reason:reason||''
      }
    );


    return json({
      ok:true,
      id,
      status:b.status
    });
  }


  /* =========================================================
     DOCUMENT VERSION — UPLOAD PDF
  ========================================================= */

  const upload=url.pathname.match(
    /^\/api\/admin\/documents\/([^/]+)\/versions$/
  );

  if(
    upload &&
    request.method==='POST'
  ){

    const docId=decodeURIComponent(
      upload[1]
    );

    const doc=await env.DB.prepare(
      'SELECT * FROM documents WHERE id=?'
    ).bind(docId).first();


    if(!doc){

      return json(
        {error:'NOT_FOUND'},
        404
      );
    }


    const form=await request.formData();

    const file=form.get('file');

    const version=
      clean(
        form.get('version_label'),
        40
      )||'1.0';

    const note=clean(
      form.get('change_note'),
      1500
    );


    if(
      !(file instanceof File) ||
      file.type!=='application/pdf'
    ){

      return json(
        {error:'PDF_REQUIRED'},
        400
      );
    }


    if(file.size>50*1024*1024){

      return json(
        {error:'FILE_TOO_LARGE'},
        413
      );
    }


    const bytes=
      await file.arrayBuffer();

    const sha=
      await sha256Hex(bytes);

    const vId=
      uid('ver');

    const safe=(
      file.name||
      `${doc.code}.pdf`
    ).replace(
      /[^a-zA-Z0-9._-]+/g,
      '_'
    );

    const key=
      `documents/${doc.id}/${vId}/${safe}`;


    await env.FILES.put(
      key,
      bytes,
      {
        httpMetadata:{
          contentType:'application/pdf'
        }
      }
    );


    const max=await env.DB.prepare(
      'SELECT MAX(version_number) m FROM document_versions WHERE document_id=?'
    ).bind(docId).first();


    const n=
      Number(max?.m||0)+1;


    await env.DB.batch([

      env.DB.prepare(`
        UPDATE document_versions
        SET status='superseded'
        WHERE document_id=?
        AND status='active'
      `).bind(docId),

      env.DB.prepare(`
        INSERT INTO document_versions(
          id,
          document_id,
          version_label,
          version_number,
          change_note,
          file_key,
          filename,
          mime,
          file_size,
          sha256,
          status,
          created_by
        )
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        vId,
        docId,
        version,
        n,
        note,
        key,
        file.name,
        'application/pdf',
        file.size,
        sha,
        'active',
        a.id
      ),

      env.DB.prepare(`
        UPDATE documents
        SET
          current_version_id=?,
          updated_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(
        vId,
        docId
      )

    ]);


    await audit(
      env,
      a,
      'upload_version',
      'document',
      docId,
      {
        version,
        sha256:sha,
        file_size:file.size
      }
    );


    return json({
      ok:true,
      version_id:vId,
      sha256:sha
    });
  }


  /* =========================================================
     BULK IMPORT
  ========================================================= */

  if(
    url.pathname==='/api/admin/import-document' &&
    request.method==='POST'
  ){

    const form=
      await request.formData();

    const metaRaw=
      String(
        form.get('metadata')||''
      );

    const file=
      form.get('file');

    let b;


    try{

      b=JSON.parse(metaRaw);

    }catch{

      return json(
        {error:'INVALID_METADATA'},
        400
      );
    }


    if(
      !(file instanceof File) ||
      file.type!=='application/pdf'
    ){

      return json(
        {error:'PDF_REQUIRED'},
        400
      );
    }


    if(file.size>50*1024*1024){

      return json(
        {error:'FILE_TOO_LARGE'},
        413
      );
    }


    const exists=
      await env.DB.prepare(
        'SELECT id FROM documents WHERE code=?'
      ).bind(
        clean(
          b.code,
          100
        ).toUpperCase()
      ).first();


    if(exists){

      return json({
        ok:true,
        skipped:true,
        id:exists.id
      });
    }


    try{

      const title=req(
        b.title,
        'TITLE',
        300
      );

      const code=req(
        b.code,
        'CODE',
        100
      ).toUpperCase();


      const slug=slugify(
        b.slug||
        `${code}-${title}`
      );


      const id=
        b.id &&
        String(b.id).startsWith('doc_')

          ? clean(b.id,80)
          : uid('doc');


      const bytes=
        await file.arrayBuffer();


      const sha=
        await sha256Hex(bytes);


      if(
        b.sha256 &&
        String(
          b.sha256
        ).toLowerCase()!==sha
      ){

        return json(
          {error:'HASH_MISMATCH'},
          400
        );
      }


      const vId=
        uid('ver');


      const safe=(
        file.name||
        `${code}.pdf`
      ).replace(
        /[^a-zA-Z0-9._-]+/g,
        '_'
      );


      const key=
        `documents/${id}/${vId}/${safe}`;


      await env.FILES.put(
        key,
        bytes,
        {
          httpMetadata:{
            contentType:'application/pdf'
          }
        }
      );


      const importStatus=
        ['draft','published'].includes(
          b.status
        )
          ? b.status
          : 'draft';


      await env.DB.batch([

        env.DB.prepare(`
          INSERT INTO documents(
            id,
            code,
            slug,
            title,
            summary,
            document_type,
            library_scope,
            unit_id,
            field_id,
            category_id,
            authors,
            keywords,
            language,
            publication_year,
            status,
            access_mode,
            published_at,
            current_version_id
          )
          VALUES(
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,
            CASE
              WHEN ?='published'
              THEN CURRENT_TIMESTAMP
              ELSE NULL
            END,
            ?
          )
        `).bind(

          id,
          code,
          slug,
          title,

          clean(
            b.summary,
            5000
          ),

          clean(
            b.document_type,
            100
          )||'Tài liệu',

          b.library_scope==='external'
            ? 'external'
            : 'sfn',

          b.unit_id||
            'unit_sfn',

          b.field_id||
            null,

          b.category_id||
            null,

          clean(
            b.authors,
            500
          ),

          clean(
            b.keywords,
            1000
          ),

          clean(
            b.language,
            10
          )||'vi',

          Number(
            b.publication_year||
            new Date().getFullYear()
          ),

          importStatus,

          b.access_mode||
            'view_download',

          importStatus,

          vId

        ),


        env.DB.prepare(`
          INSERT INTO document_versions(
            id,
            document_id,
            version_label,
            version_number,
            change_note,
            file_key,
            filename,
            mime,
            file_size,
            sha256,
            status,
            created_by
          )
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?)
        `).bind(

          vId,
          id,

          clean(
            b.version_label,
            40
          )||'1.0',

          1,

          'Nhập từ thư viện khởi tạo',

          key,

          file.name,

          'application/pdf',

          file.size,

          sha,

          'active',

          a.id
        )

      ]);


      await audit(
        env,
        a,
        'bulk_import',
        'document',
        id,
        {
          code,
          sha256:sha,
          file_size:file.size
        }
      );


      return json({
        ok:true,
        id,
        version_id:vId
      });


    }catch(e){

      return json(
        {
          error:e.message||
            'IMPORT_FAILED'
        },
        400
      );
    }
  }


  /* =========================================================
     AUDIT LOG
  ========================================================= */

  if(
    url.pathname==='/api/admin/audit' &&
    request.method==='GET'
  ){

    const rs=
      await env.DB.prepare(`
        SELECT
          l.*,
          a.email admin_email,
          a.full_name admin_name
        FROM audit_log l
        LEFT JOIN admins a
          ON a.id=l.admin_id
        ORDER BY l.id DESC
        LIMIT 300
      `).all();


    return json({
      items:rs.results||[]
    });
  }


  /* =========================================================
     NOT FOUND
  ========================================================= */

  return json(
    {error:'NOT_FOUND'},
    404
  );
}
