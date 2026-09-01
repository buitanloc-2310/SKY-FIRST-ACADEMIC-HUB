const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

const esc=s=>String(s??'').replace(
  /[&<>'"]/g,
  c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c])
);

const fmt=n=>new Intl.NumberFormat('vi-VN').format(Number(n||0));

const api=async(url,opt={})=>{
  const r=await fetch(
    url,
    {
      credentials:'same-origin',
      ...opt,
      headers:{
        ...(opt.body instanceof FormData
          ? {}
          : {'content-type':'application/json'}
        ),
        ...(opt.headers||{})
      }
    }
  );

  let d={};

  try{
    d=await r.json();
  }catch{}

  if(!r.ok){
    throw Object.assign(
      new Error(d.error||'REQUEST_FAILED'),
      {
        status:r.status,
        data:d
      }
    );
  }

  return d;
};


const main=$('#main');

$('#footerYear').textContent=
  `© ${new Date().getFullYear()} SFN`;


function toast(msg){
  const e=document.createElement('div');

  e.className='toast';
  e.textContent=msg;

  document.body.append(e);

  setTimeout(
    ()=>e.remove(),
    3200
  );
}


function title(t){
  document.title=
    `${t} | Sky First Academic Hub`;
}


function pageHero(t,d=''){
  return `
    <section class="page-hero">
      <div class="container">

        <div class="breadcrumbs">
          <a href="/">Trang chủ</a> / ${esc(t)}
        </div>

        <h1>${esc(t)}</h1>

        ${d
          ? `<p>${esc(d)}</p>`
          : ''
        }

      </div>
    </section>
  `;
}


function docCard(d){
  return `
    <a
      class="card doc-card"
      href="/document/${encodeURIComponent(d.slug)}"
    >

      <div class="doc-badges">

        <span class="badge ${d.library_scope==='external'?'external':''}">
          ${d.library_scope==='external'
            ? 'Nguồn tổng hợp'
            : 'Học liệu SFN'
          }
        </span>

        ${d.category_name
          ? `<span class="badge">${esc(d.category_name)}</span>`
          : ''
        }

      </div>

      <h3>${esc(d.title)}</h3>

      <p>
        ${esc(
          d.summary||
          'Tài liệu học thuật trên hệ thống Sky First.'
        )}
      </p>

      <div class="doc-meta">
        <span>${esc(d.code)}</span>

        <span>
          ${esc(
            d.unit_short_name||
            d.unit_name||
            'SFN'
          )}
        </span>
      </div>

    </a>
  `;
}


function empty(t='Chưa có dữ liệu phù hợp.'){
  return `
    <div class="empty">
      ${esc(t)}
    </div>
  `;
}


function setMain(html){
  main.innerHTML=html;

  window.scrollTo({
    top:0,
    behavior:'instant'
  });
}


/* =========================================================
   TRANG CHỦ
========================================================= */

async function home(){

  title('Trang chủ');

  setMain(`
    <section class="hero">

      <div class="container hero-inner">

        <div>

          <span class="eyebrow">
            Hạ tầng học thuật cấp Mạng lưới
          </span>

          <h1>
            Tri thức được tổ chức để
            <span>đi xa hơn.</span>
          </h1>

          <p>
            Kho học liệu, nghiên cứu và tài nguyên tham khảo
            của Mạng lưới Giáo dục & Phát triển Cộng đồng
            Sky First (SFN), được xây dựng cho khả năng
            mở rộng lâu dài.
          </p>

          <form
            class="hero-search"
            id="heroSearch"
          >
            <input
              name="q"
              aria-label="Tìm kiếm tài liệu"
              placeholder="Tìm theo tên, mã tài liệu, từ khóa..."
            >

            <button class="btn btn-primary">
              Tìm kiếm
            </button>
          </form>

        </div>

        <div class="hero-art">
          <img
            src="/assets/skyfirst-logo.png"
            alt="Sky First"
          >
        </div>

      </div>
    </section>


    <section class="stats">

      <div class="container stats-grid">

        <div class="stat">
          <b id="statDocs">—</b>
          <span>Tài liệu đã công bố</span>
        </div>

        <div class="stat">
          <b id="statUnits">—</b>
          <span>Đơn vị trên hệ thống</span>
        </div>

        <div class="stat">
          <b id="statFields">—</b>
          <span>Lĩnh vực học thuật</span>
        </div>

      </div>
    </section>


    <section class="section">

      <div class="container">

        <div class="section-head">

          <div>
            <h2>Học liệu mới & nổi bật</h2>
            <p>
              Nội dung được cập nhật
              trên toàn hệ sinh thái SFN.
            </p>
          </div>

          <a
            class="btn btn-secondary"
            href="/library"
          >
            Xem toàn bộ
          </a>

        </div>

        <div
          class="cards"
          id="homeDocs"
        >
          ${empty('Đang tải học liệu...')}
        </div>

      </div>
    </section>


    <section class="section soft">

      <div class="container">

        <div class="section-head">

          <div>
            <h2>Khám phá theo lĩnh vực</h2>
            <p>
              Một cấu trúc mở có thể mở rộng
              theo hoạt động của Mạng lưới.
            </p>
          </div>

          <a
            class="btn btn-ghost"
            href="/fields"
          >
            Tất cả lĩnh vực
          </a>

        </div>

        <div
          class="field-grid"
          id="homeFields"
        ></div>

      </div>
    </section>
  `);


  $('#heroSearch').onsubmit=e=>{

    e.preventDefault();

    const q=
      new FormData(e.currentTarget).get('q');

    location.href=
      `/search?q=${encodeURIComponent(q||'')}`;
  };


  try{

    const [s,h]=await Promise.all([

      api('/api/public/stats'),

      api('/api/public/home')

    ]);


    $('#statDocs').textContent=
      fmt(s.documents);

    $('#statUnits').textContent=
      fmt(s.units);

    $('#statFields').textContent=
      fmt(s.fields);


    $('#homeDocs').innerHTML=
      h.featured.length
        ? h.featured.map(docCard).join('')
        : empty(
            'Kho học liệu đang được khởi tạo.'
          );


    $('#homeFields').innerHTML=
      h.fields.map(
        f=>`
          <a
            class="field-card"
            href="/field/${encodeURIComponent(f.slug)}"
          >
            <b>${esc(f.name)}</b>

            <span>
              ${esc(
                f.description||
                'Khám phá học liệu'
              )}
            </span>
          </a>
        `
      ).join('');

  }catch{

    $('#homeDocs').innerHTML=
      empty(
        'Không thể tải dữ liệu lúc này.'
      );
  }
}


/* =========================================================
   DANH MỤC
========================================================= */

const pageMap={

  '/materials/textbooks':[
    'Giáo trình',
    'Hệ thống giáo trình và tài liệu học tập do SFN quản lý.',
    'giao-trinh',
    'sfn'
  ],

  '/materials/exercises':[
    'Bài tập',
    'Phiếu bài tập và tài liệu thực hành.',
    'bai-tap',
    'sfn'
  ],

  '/materials/exams':[
    'Ngân hàng đề',
    'Đề luyện tập và đánh giá học tập.',
    'ngan-hang-de',
    'sfn'
  ],

  '/materials/answer-keys':[
    'Đáp án & Rubric',
    'Đáp án, hướng dẫn chấm và tiêu chí đánh giá.',
    'dap-an-rubric',
    'sfn'
  ],

  '/materials/lessons':[
    'Bài giảng',
    'Kế hoạch bài giảng và học liệu giảng dạy.',
    'bai-giang',
    'sfn'
  ],

  '/academic/research':[
    'Nghiên cứu',
    'Công trình và tài liệu nghiên cứu do hệ thống công bố.',
    'nghien-cuu',
    'sfn'
  ],

  '/academic/topics':[
    'Chuyên đề',
    'Chuyên đề học thuật do SFN biên soạn.',
    'chuyen-de',
    'sfn'
  ],

  '/academic/reports':[
    'Báo cáo',
    'Báo cáo chuyên môn và học thuật.',
    'bao-cao',
    'sfn'
  ],

  '/academic/articles':[
    'Bài viết học thuật',
    'Bài viết phổ biến tri thức và học thuật.',
    'bai-viet-hoc-thuat',
    'sfn'
  ],

  '/resources/references':[
    'Tài liệu tham khảo',
    'Tài nguyên được tổng hợp và dẫn nguồn rõ ràng.',
    'tai-lieu-tham-khao',
    'external'
  ],

  '/resources/official':[
    'Nguồn giáo dục chính thống',
    'Liên kết tới các nguồn giáo dục chính thống.',
    'nguon-giao-duc-chinh-thong',
    'external'
  ],

  '/resources/international':[
    'Tài nguyên quốc tế',
    'Nguồn học thuật và giáo dục quốc tế.',
    'tai-nguyen-quoc-te',
    'external'
  ],

  '/resources/links':[
    'Thư viện liên kết',
    'Danh mục liên kết học thuật được tuyển chọn.',
    'thu-vien-lien-ket',
    'external'
  ]

};


async function listing(
  titleText,
  desc,
  params={}
){

  title(titleText);

  setMain(`
    ${pageHero(
      titleText,
      desc
    )}

    <section class="section">

      <div class="container">

        <div class="toolbar">

          <input
            id="listQ"
            placeholder="Tìm trong danh mục..."
          >

          <button
            class="btn btn-primary"
            id="listBtn"
          >
            Tìm
          </button>

        </div>

        <div
          class="cards"
          id="listDocs"
        >
          ${empty('Đang tải...')}
        </div>

      </div>
    </section>
  `);


  async function load(){

    const q=
      $('#listQ').value.trim();

    const usp=
      new URLSearchParams({
        ...params,
        q,
        limit:'60'
      });

    const d=
      await api(
        '/api/public/search?'+usp
      );

    $('#listDocs').innerHTML=
      d.items.length
        ? d.items.map(docCard).join('')
        : empty();
  }


  $('#listBtn').onclick=
    ()=>load().catch(
      ()=>toast(
        'Không thể tải dữ liệu'
      )
    );


  $('#listQ').onkeydown=e=>{

    if(e.key==='Enter'){

      load().catch(
        ()=>toast(
          'Không thể tải dữ liệu'
        )
      );
    }
  };


  await load().catch(
    ()=>{
      $('#listDocs').innerHTML=
        empty(
          'Không thể tải dữ liệu lúc này.'
        );
    }
  );
}


async function library(){

  await listing(
    'Toàn bộ học liệu SFN',
    'Kho tài liệu chính thức do SFN quản lý và công bố.',
    {
      scope:'sfn'
    }
  );
}


/* =========================================================
   LĨNH VỰC
========================================================= */

async function fields(){

  title('Theo lĩnh vực');

  setMain(`
    ${pageHero(
      'Theo lĩnh vực',
      'Khám phá học liệu theo các lĩnh vực chuyên môn trên toàn Mạng lưới.'
    )}

    <section class="section">

      <div class="container">

        <div
          class="field-grid"
          id="fieldsGrid"
        >
          ${empty('Đang tải...')}
        </div>

      </div>
    </section>
  `);


  try{

    const d=
      await api(
        '/api/public/fields'
      );


    $('#fieldsGrid').innerHTML=
      d.items.map(
        f=>`
          <a
            class="field-card"
            href="/field/${encodeURIComponent(f.slug)}"
          >

            <b>
              ${esc(f.name)}
            </b>

            <span>
              ${esc(f.description||'')}
            </span>

          </a>
        `
      ).join('');

  }catch{

    $('#fieldsGrid').innerHTML=
      empty();
  }
}


async function field(slug){

  const fs=
    await api(
      '/api/public/fields'
    );

  const f=
    fs.items.find(
      x=>x.slug===slug
    );


  await listing(
    f?.name||
      'Lĩnh vực',

    f?.description||
      'Học liệu theo lĩnh vực.',

    {
      field:slug
    }
  );
}


/* =========================================================
   ĐƠN VỊ
========================================================= */

async function units(){

  title('Theo đơn vị');

  setMain(`
    ${pageHero(
      'Theo đơn vị',
      'Danh mục các đơn vị tham gia hệ sinh thái học thuật SFN. Hệ thống được thiết kế để mở rộng tới quy mô lớn.'
    )}

    <section class="section">

      <div class="container">

        <div class="toolbar">

          <input
            id="unitQ"
            placeholder="Tìm tên hoặc mã đơn vị..."
          >

          <button
            id="unitBtn"
            class="btn btn-primary"
          >
            Tìm đơn vị
          </button>

        </div>

        <div
          class="unit-list"
          id="unitList"
        >
          ${empty('Đang tải...')}
        </div>

      </div>
    </section>
  `);


  async function load(){

    const q=
      $('#unitQ').value.trim();

    const d=
      await api(
        '/api/public/units?q='+
        encodeURIComponent(q)
      );


    $('#unitList').innerHTML=
      d.items.length
        ? d.items.map(
            u=>`
              <a
                class="unit-card"
                href="/unit/${encodeURIComponent(u.slug)}"
              >

                <h3>
                  ${esc(u.name)}
                </h3>

                <p>
                  ${esc(
                    u.unit_type||
                    'Đơn vị'
                  )}
                </p>

                <div class="doc-meta">

                  <span>
                    ${esc(u.code)}
                  </span>

                  <span>
                    ${fmt(
                      u.document_count
                    )} tài liệu
                  </span>

                </div>

              </a>
            `
          ).join('')
        : empty();
  }


  $('#unitBtn').onclick=
    ()=>load();


  await load();
}


async function unit(slug){

  const d=
    await api(
      '/api/public/unit/'+
      encodeURIComponent(slug)
    );


  title(
    d.unit.name
  );


  setMain(`
    ${pageHero(
      d.unit.name,
      d.unit.description||
      'Hồ sơ đơn vị trên hệ thống học thuật SFN.'
    )}

    <section class="section">

      <div class="container">

        <div class="section-head">

          <div>

            <h2>
              Học liệu của đơn vị
            </h2>

            <p>
              Mã đơn vị:
              ${esc(d.unit.code)}
            </p>

          </div>

        </div>

        <div class="cards">

          ${d.documents.length
            ? d.documents.map(
                docCard
              ).join('')
            : empty(
                'Đơn vị chưa có tài liệu được công bố.'
              )
          }

        </div>

      </div>
    </section>
  `);
}


/* =========================================================
   BỘ SƯU TẬP
========================================================= */

async function collections(){

  title(
    'Bộ sưu tập'
  );

  setMain(`
    ${pageHero(
      'Bộ sưu tập',
      'Các nhóm học liệu được tuyển chọn theo chủ đề và mục tiêu sử dụng.'
    )}

    <section class="section">

      <div class="container">

        ${empty(
          'Bộ sưu tập sẽ được quản trị viên xây dựng và công bố theo nhu cầu của Mạng lưới.'
        )}

      </div>
    </section>
  `);
}


/* =========================================================
   TÌM KIẾM
========================================================= */

async function searchPage(){

  title(
    'Tìm kiếm nâng cao'
  );


  const q0=
    new URLSearchParams(
      location.search
    ).get('q')||'';


  setMain(`
    ${pageHero(
      'Tìm kiếm nâng cao',
      'Tra cứu tài liệu trên toàn hệ sinh thái bằng từ khóa và bộ lọc.'
    )}

    <section class="section">

      <div class="container">

        <div class="toolbar">

          <input
            id="sQ"
            value="${esc(q0)}"
            placeholder="Tên, mã tài liệu, từ khóa..."
          >

          <select id="sScope">

            <option value="">
              Tất cả kho
            </option>

            <option value="sfn">
              Học liệu SFN
            </option>

            <option value="external">
              Kho Tổng hợp
            </option>

          </select>

          <select id="sField">

            <option value="">
              Tất cả lĩnh vực
            </option>

          </select>

          <select id="sUnit">

            <option value="">
              Tất cả đơn vị
            </option>

          </select>

          <button
            id="sBtn"
            class="btn btn-primary"
          >
            Tìm kiếm
          </button>

        </div>

        <p
          class="small"
          id="resultCount"
        ></p>

        <div
          class="cards"
          id="sDocs"
        >
          ${empty(
            'Nhập từ khóa hoặc sử dụng bộ lọc để tra cứu.'
          )}
        </div>

      </div>
    </section>
  `);


  const [fs,us]=
    await Promise.all([

      api(
        '/api/public/fields'
      ),

      api(
        '/api/public/units?limit=100'
      )

    ]);


  $('#sField').innerHTML+=
    [...fs.items].map(
      x=>`
        <option value="${esc(x.slug)}">
          ${esc(x.name)}
        </option>
      `
    ).join('');


  $('#sUnit').innerHTML+=
    us.items.map(
      x=>`
        <option value="${esc(x.slug)}">
          ${esc(
            x.short_name||
            x.name
          )}
        </option>
      `
    ).join('');


  async function run(){

    const p=
      new URLSearchParams({

        q:
          $('#sQ').value,

        scope:
          $('#sScope').value,

        field:
          $('#sField').value,

        unit:
          $('#sUnit').value,

        limit:'60'

      });


    const d=
      await api(
        '/api/public/search?'+p
      );


    $('#resultCount').textContent=
      `Tìm thấy ${fmt(d.total)} kết quả.`;


    $('#sDocs').innerHTML=
      d.items.length
        ? d.items.map(
            docCard
          ).join('')
        : empty();
  }


  $('#sBtn').onclick=
    ()=>run().catch(
      ()=>toast(
        'Tra cứu thất bại'
      )
    );


  if(q0){
    await run();
  }
}


/* =========================================================
   TRA CỨU MÃ
========================================================= */

async function codeLookup(){

  title(
    'Mã tài liệu'
  );


  setMain(`
    ${pageHero(
      'Tra cứu mã tài liệu',
      'Nhập chính xác mã tài liệu để xác định hồ sơ đang được SFN công bố.'
    )}

    <section class="section">

      <div class="container">

        <div class="toolbar">

          <input
            id="codeQ"
            placeholder="Ví dụ: SFN-ENG-2026-000001"
          >

          <button
            class="btn btn-primary"
            id="codeBtn"
          >
            Tra cứu
          </button>

        </div>

        <div id="codeResult">
          ${empty(
            'Chưa thực hiện tra cứu.'
          )}
        </div>

      </div>
    </section>
  `);


  $('#codeBtn').onclick=
    async()=>{

      const code=
        $('#codeQ').value.trim();

      try{

        const d=
          await api(
            '/api/public/lookup-code?code='+
            encodeURIComponent(code)
          );


        $('#codeResult').innerHTML=`
          <div class="card">

            <h3>
              ${esc(d.document.title)}
            </h3>

            <p>
              <b>
                ${esc(d.document.code)}
              </b>
              ·
              ${d.document.publication_year||''}
            </p>

            <a
              class="btn btn-primary"
              href="/document/${encodeURIComponent(d.document.slug)}"
            >
              Mở hồ sơ tài liệu
            </a>

          </div>
        `;

      }catch{

        $('#codeResult').innerHTML=
          empty(
            'Không tìm thấy tài liệu đang được công bố với mã này.'
          );
      }
    };
}


/* =========================================================
   TRA CỨU PHIÊN BẢN
========================================================= */

async function versionsLookup(){

  title(
    'Phiên bản tài liệu'
  );


  setMain(`
    ${pageHero(
      'Phiên bản tài liệu',
      'Tra cứu lịch sử phiên bản, trạng thái và thời điểm áp dụng.'
    )}

    <section class="section">

      <div class="container">

        <div class="toolbar">

          <input
            id="verQ"
            placeholder="Nhập mã hoặc tên tài liệu"
          >

          <button
            class="btn btn-primary"
            id="verBtn"
          >
            Tra cứu
          </button>

        </div>

        <div id="verResult">
          ${empty(
            'Chưa thực hiện tra cứu.'
          )}
        </div>

      </div>
    </section>
  `);


  $('#verBtn').onclick=
    async()=>{

      try{

        const d=
          await api(
            '/api/public/lookup-versions?q='+
            encodeURIComponent(
              $('#verQ').value.trim()
            )
          );


        $('#verResult').innerHTML=`
          <div class="card">

            <h3>
              ${esc(
                d.document.title
              )}
            </h3>

            <p>
              ${esc(
                d.document.code
              )}
            </p>

            ${d.versions.length
              ? d.versions.map(
                  v=>`
                    <div class="version">

                      <b>
                        Phiên bản
                        ${esc(v.version_label)}
                      </b>
                      ·
                      ${esc(v.status)}

                      <div class="small">

                        ${esc(
                          v.effective_at||
                          v.created_at
                        )}

                        ${v.change_note
                          ? ` · ${esc(v.change_note)}`
                          : ''
                        }

                      </div>

                    </div>
                  `
                ).join('')
              : empty(
                  'Chưa có phiên bản file.'
                )
            }

          </div>
        `;

      }catch{

        $('#verResult').innerHTML=
          empty(
            'Không tìm thấy tài liệu phù hợp.'
          );
      }
    };
}


/* =========================================================
   HỒ SƠ TÀI LIỆU
========================================================= */

async function documentPage(key){

  const d=
    await api(
      '/api/public/document/'+
      encodeURIComponent(key)
    );


  const x=
    d.document;


  title(
    x.title
  );


  const current=
    d.versions.find(
      v=>v.id===x.current_version_id
    )||
    d.versions[0];


  setMain(`
    ${pageHero(
      x.title,
      x.summary||
      'Hồ sơ tài liệu trên Sky First Academic Hub.'
    )}

    <section class="section">

      <div class="container document-layout">

        <article class="document-main">

          <div class="doc-badges">

            <span
              class="badge ${x.library_scope==='external'?'external':''}"
            >
              ${x.library_scope==='external'
                ? 'Kho Tổng hợp'
                : 'Học liệu SFN'
              }
            </span>

            <span class="badge">
              ${esc(x.code)}
            </span>

          </div>

          <h2>
            Thông tin tài liệu
          </h2>


          <div class="kv">
            <span>Mã tài liệu</span>
            <b>${esc(x.code)}</b>
          </div>


          <div class="kv">
            <span>Loại tài liệu</span>
            <span>${esc(x.document_type)}</span>
          </div>


          <div class="kv">
            <span>Đơn vị</span>
            <span>${esc(x.unit_name||'SFN')}</span>
          </div>


          <div class="kv">
            <span>Lĩnh vực</span>
            <span>${esc(x.field_name||'—')}</span>
          </div>


          <div class="kv">
            <span>Năm</span>
            <span>${esc(x.publication_year||'—')}</span>
          </div>


          <div class="kv">
            <span>Tác giả/Ban biên soạn</span>
            <span>${esc(x.authors||'—')}</span>
          </div>


          ${x.library_scope==='external'
            ? `
              <div class="notice warn">

                <b>
                  Nguồn bên ngoài.
                </b>

                SFN chỉ tổng hợp/giới thiệu tài nguyên này
                và không mặc nhiên sở hữu bản quyền nội dung gốc.

                ${x.external_source_name
                  ? ` Nguồn: ${esc(x.external_source_name)}.`
                  : ''
                }

              </div>
            `
            : `
              <div class="notice">

                <b>
                  Tài liệu thuộc hệ thống SFN.
                </b>

                Việc sử dụng và phân phối phải tuân thủ
                thông tin bản quyền và quy định sử dụng
                đi kèm tài liệu.

              </div>
            `
          }


          <h2>
            Phiên bản
          </h2>


          ${d.versions.length
            ? d.versions.map(
                v=>`
                  <div class="version">

                    <b>
                      ${esc(v.version_label)}
                    </b>
                    ·
                    ${esc(v.status)}

                    <div class="small">

                      ${esc(
                        v.effective_at||
                        v.created_at
                      )}

                      ${v.change_note
                        ? ` · ${esc(v.change_note)}`
                        : ''
                      }

                    </div>

                  </div>
                `
              ).join('')
            : empty(
                'Chưa có file phiên bản.'
              )
          }

        </article>


        <aside class="document-side">

          <h3>
            Truy cập tài liệu
          </h3>


          ${x.access_mode==='external_link' &&
            x.external_source_url

            ? `
              <a
                class="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
                href="${esc(x.external_source_url)}"
              >
                Mở nguồn gốc ↗
              </a>
            `

            : current &&
              x.access_mode!=='metadata_only'

              ? `
                <a
                  class="btn btn-primary"
                  target="_blank"
                  rel="noopener"
                  href="/api/public/version-file/${encodeURIComponent(current.id)}"
                >
                  Xem PDF
                </a>
              `

              : `
                <p class="small">
                  Tài liệu hiện chỉ công bố thông tin mô tả.
                </p>
              `
          }


          <hr
            style="
              border:0;
              border-top:1px solid var(--line);
              margin:22px 0
            "
          >


          <p class="small">
            Hồ sơ này phản ánh phiên bản đang được hệ thống công bố.
            Hãy tra cứu lịch sử phiên bản khi cần xác định bản áp dụng.
          </p>

        </aside>

      </div>
    </section>
  `);
}


/* =========================================================
   TRANG TĨNH
========================================================= */

const staticPages={

  '/about':[
    'Về Cổng Học thuật',
    `
      <p>
        <b>Sky First Academic Hub</b>
        là Cổng Học liệu & Học thuật cấp Mạng lưới
        của Mạng lưới Giáo dục & Phát triển Cộng đồng
        Sky First (SFN).
      </p>

      <p>
        Nền tảng được thiết kế theo mô hình đa đơn vị:
        mỗi đơn vị trực thuộc có thể được gắn hồ sơ,
        lĩnh vực, bộ sưu tập và học liệu riêng
        mà không làm thay đổi lõi hệ thống.
      </p>

      <h2>
        Nguyên tắc thiết kế
      </h2>

      <ul>

        <li>
          Ưu tiên khả năng mở rộng
          và tính độc lập của dữ liệu.
        </li>

        <li>
          Người đọc không cần tạo tài khoản
          để truy cập nội dung công khai.
        </li>

        <li>
          Chỉ quản trị viên được ủy quyền
          mới có quyền đăng và cập nhật tài liệu.
        </li>

        <li>
          Phiên bản, mã tài liệu và lịch sử thay đổi
          được quản lý riêng biệt.
        </li>

      </ul>
    `
  ],


  '/terms':[
    'Quy định sử dụng',
    `
      <p>
        Người dùng được truy cập các nội dung công khai
        theo phạm vi hệ thống cho phép và phải tôn trọng
        quyền tác giả, quyền sở hữu trí tuệ,
        nguồn gốc tài liệu và các giới hạn sử dụng
        được ghi trên từng tài nguyên.
      </p>

      <h2>
        Không được phép
      </h2>

      <ul>

        <li>
          Giả mạo tư cách SFN
          hoặc đơn vị trực thuộc.
        </li>

        <li>
          Loại bỏ thông tin bản quyền,
          nguồn hoặc mã nhận diện tài liệu
          nhằm gây hiểu nhầm.
        </li>

        <li>
          Sử dụng hệ thống để phát tán mã độc,
          khai thác trái phép
          hoặc gây gián đoạn dịch vụ.
        </li>

        <li>
          Sao chép hoặc phân phối tài nguyên của bên thứ ba
          trái với quyền được cấp.
        </li>

      </ul>

      <p>
        Các quy định có thể được cập nhật
        theo hoạt động thực tế
        và yêu cầu pháp luật áp dụng.
      </p>
    `
  ],


  '/copyright':[
    'Bản quyền',
    `
      <div class="notice">

        <b>
          Tài liệu do SFN sở hữu:
        </b>

        các tài liệu được công bố là tài liệu SFN
        có thể hiển thị dòng
        “@ Bản quyền thuộc Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)”.

      </div>

      <h2>
        Nguồn bên ngoài
      </h2>

      <p>
        Tài liệu hoặc liên kết nằm trong Kho Tổng hợp
        không mặc nhiên thuộc bản quyền SFN.
        Hệ thống phải ghi nhận nguồn,
        tác giả/đơn vị phát hành
        và điều kiện sử dụng khi có thông tin.
      </p>

      <h2>
        Yêu cầu quyền tác giả
      </h2>

      <p>
        Nếu chủ thể quyền cho rằng một tài nguyên
        được đăng hoặc mô tả không phù hợp,
        có thể gửi yêu cầu xem xét
        qua kênh liên hệ chính thức.
        SFN có thể tạm ẩn nội dung
        trong thời gian xác minh.
      </p>
    `
  ],


  '/privacy':[
    'Quyền riêng tư',
    `
      <p>
        Cổng học thuật công khai không yêu cầu tài khoản
        đối với người đọc.
        Hệ thống ưu tiên giảm thiểu dữ liệu cá nhân
        và không thiết kế hồ sơ học viên/TNV
        trên cổng này.
      </p>

      <h2>
        Dữ liệu kỹ thuật
      </h2>

      <p>
        Nhà cung cấp hạ tầng có thể xử lý
        thông tin kỹ thuật cần thiết
        để vận hành, bảo mật
        và chống lạm dụng dịch vụ.
        Khu quản trị sử dụng phiên đăng nhập bảo mật,
        nhật ký thao tác và giới hạn quyền truy cập.
      </p>

      <h2>
        Quản trị viên
      </h2>

      <p>
        Thông tin tài khoản quản trị
        chỉ được sử dụng để xác thực,
        quản trị và kiểm toán hoạt động hệ thống.
        Không có chức năng đăng ký tài khoản quản trị công khai.
      </p>
    `
  ],


  '/contact':[
    'Liên hệ',
    `
      <p>
        Đối với góp ý học thuật,
        yêu cầu cập nhật metadata,
        báo cáo liên kết lỗi
        hoặc yêu cầu liên quan đến bản quyền,
        vui lòng sử dụng kênh liên hệ chính thức
        được Mạng lưới công bố.
      </p>

      <p class="small">
        Không gửi mật khẩu,
        mã xác thực hoặc thông tin định danh nhạy cảm
        qua biểu mẫu/địa chỉ liên hệ công khai.
      </p>
    `
  ]

};


async function staticPage(path){

  const [t,html]=
    staticPages[path];

  title(t);

  setMain(`
    ${pageHero(t)}

    <section class="section">

      <div class="container prose">

        ${html}

      </div>
    </section>
  `);
}


/* =========================================================
   ADMIN
========================================================= */

async function admin(){

  title(
    'Quản trị'
  );


  const me=
    await api(
      '/api/auth/me'
    );


  if(!me.authenticated){

    return adminLogin();
  }


  setMain(`
    ${pageHero(
      'Quản trị hệ thống',
      'Khu vực dành riêng cho quản trị viên được ủy quyền của SFN.'
    )}

    <section class="admin-shell">

      <div class="container admin-grid">

        <aside class="admin-side">

          <h3>
            Academic Hub
          </h3>

          <button
            data-a="dashboard"
            class="active"
          >
            Tổng quan
          </button>

          <button data-a="documents">
            Tài liệu
          </button>

          <button data-a="newdoc">
            Đăng tài liệu
          </button>

          <button data-a="bulk">
            Nhập hàng loạt
          </button>

          <button data-a="units">
            Đơn vị
          </button>

          <button data-a="audit">
            Nhật ký
          </button>

          <button data-a="logout">
            Đăng xuất
          </button>

        </aside>


        <div
          class="admin-panel"
          id="adminPanel"
        ></div>

      </div>
    </section>
  `);


  $$('[data-a]').forEach(
    b=>
      b.onclick=
        ()=>adminAction(
          b.dataset.a,
          b
        )
  );


  await adminAction(
    'dashboard',
    $('[data-a=dashboard]')
  );
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

async function adminLogin(){

  setMain(`
    <section class="admin-shell">

      <div class="container">

        <div class="login-box">

          <img
            src="/assets/skyfirst-logo.png"
            alt="Sky First"
          >

          <h1>
            Quản trị Academic Hub
          </h1>

          <p
            class="small"
            style="text-align:center"
          >
            Không có đăng ký công khai.
            Chỉ quản trị viên hệ thống được ủy quyền
            mới có thể đăng nhập.
          </p>


          <form id="loginForm">

            <div class="form-field">

              <label>
                Email quản trị
              </label>

              <input
                required
                type="email"
                name="email"
                autocomplete="username"
              >

            </div>


            <div class="form-field">

              <label>
                Mật khẩu
              </label>

              <input
                required
                type="password"
                name="password"
                autocomplete="current-password"
                minlength="10"
              >

            </div>


            <button
              class="btn btn-primary"
              style="
                width:100%;
                margin-top:8px
              "
            >
              Đăng nhập
            </button>

          </form>

        </div>
      </div>
    </section>
  `);


  $('#loginForm').onsubmit=
    async e=>{

      e.preventDefault();

      const f=
        new FormData(
          e.currentTarget
        );


      try{

        await api(
          '/api/auth/login',
          {
            method:'POST',
            body:JSON.stringify({
              email:f.get('email'),
              password:f.get('password')
            })
          }
        );


        toast(
          'Đăng nhập thành công'
        );


        admin();

      }catch(err){

        toast(
          err.status===429
            ? 'Đã có quá nhiều lần thử. Vui lòng chờ rồi thử lại.'
            : 'Thông tin đăng nhập không đúng.'
        );
      }
    };
}


function activeAdmin(btn){

  $$('[data-a]').forEach(
    x=>x.classList.remove(
      'active'
    )
  );


  btn?.classList.add(
    'active'
  );
}


/* =========================================================
   ADMIN ACTION
========================================================= */

async function adminAction(
  action,
  btn
){

  activeAdmin(btn);

  const p=
    $('#adminPanel');


  /* ============================
     LOGOUT
  ============================ */

  if(action==='logout'){

    await api(
      '/api/auth/logout',
      {
        method:'POST',
        body:'{}'
      }
    );


    location.href=
      '/admin';

    return;
  }


  /* ============================
     DASHBOARD
  ============================ */

  if(action==='dashboard'){

    const d=
      await api(
        '/api/admin/dashboard'
      );


    p.innerHTML=`
      <h2>
        Tổng quan
      </h2>


      <div class="admin-stats">

        <div class="admin-stat">
          <b>
            ${fmt(d.stats.documents)}
          </b>
          <span>
            Tài liệu
          </span>
        </div>


        <div class="admin-stat">
          <b>
            ${fmt(d.stats.units)}
          </b>
          <span>
            Đơn vị
          </span>
        </div>


        <div class="admin-stat">
          <b>
            ${fmt(d.stats.drafts)}
          </b>
          <span>
            Bản nháp
          </span>
        </div>


        <div class="admin-stat">
          <b>
            ${fmt(d.stats.external)}
          </b>
          <span>
            Nguồn ngoài
          </span>
        </div>

      </div>


      <h3>
        Hoạt động gần đây
      </h3>


      ${auditTable(
        d.audit
      )}
    `;

    return;
  }


  /* ============================
     DOCUMENTS
  ============================ */

  if(action==='documents'){

    const d=
      await api(
        '/api/admin/documents'
      );


    const statusNames={

      draft:'Bản nháp',

      published:'Đã công bố',

      hidden:'Đang ẩn',

      archived:'Lưu trữ',

      withdrawn:'Đã thu hồi'

    };


    let currentFilter='all';


    const render=()=>{

      const items=
        currentFilter==='all'

          ? d.items

          : d.items.filter(
              x=>
                x.status===
                currentFilter
            );


      p.innerHTML=`

        <h2>
          Quản lý tài liệu
        </h2>


        <div
          class="toolbar"
          style="
            margin-bottom:14px;
            display:flex;
            gap:8px;
            flex-wrap:wrap
          "
        >

          <select id="docStatusFilter">

            <option value="all">
              Tất cả trạng thái
              (${d.items.length})
            </option>

            <option value="draft">
              Bản nháp
              (${d.items.filter(
                x=>x.status==='draft'
              ).length})
            </option>

            <option value="published">
              Đã công bố
              (${d.items.filter(
                x=>x.status==='published'
              ).length})
            </option>

            <option value="hidden">
              Đang ẩn
              (${d.items.filter(
                x=>x.status==='hidden'
              ).length})
            </option>

            <option value="withdrawn">
              Đã thu hồi
              (${d.items.filter(
                x=>x.status==='withdrawn'
              ).length})
            </option>

            <option value="archived">
              Lưu trữ
              (${d.items.filter(
                x=>x.status==='archived'
              ).length})
            </option>

          </select>


          <input
            id="docSearch"
            placeholder="Tìm mã hoặc tên tài liệu..."
            style="min-width:260px"
          >

        </div>


        <div
          id="docBulkBar"
          class="notice"
          style="margin-bottom:14px"
        >

          <b id="selectedCount">
            0 tài liệu được chọn
          </b>


          <div
            style="
              display:flex;
              gap:8px;
              flex-wrap:wrap;
              margin-top:10px
            "
          >

            <button
              id="publishSelected"
              class="btn btn-primary"
            >
              Công bố
            </button>


            <button
              id="hideSelected"
              class="btn btn-secondary"
            >
              Ẩn
            </button>


            <button
              id="withdrawSelected"
              class="btn btn-secondary"
            >
              Thu hồi
            </button>


            <button
              id="archiveSelected"
              class="btn btn-secondary"
            >
              Lưu trữ
            </button>

          </div>

        </div>


        <div class="table-wrap">

          <table class="data-table">

            <thead>

              <tr>

                <th>
                  <input
                    type="checkbox"
                    id="selectAllDocs"
                    title="Chọn tất cả tài liệu đang hiển thị"
                  >
                </th>

                <th>Mã</th>

                <th>Tên</th>

                <th>Đơn vị</th>

                <th>Lĩnh vực</th>

                <th>Trạng thái</th>

                <th>Phiên bản</th>

                <th>Thao tác</th>

              </tr>

            </thead>


            <tbody id="documentsBody">

              ${items.map(
                x=>`

                  <tr
                    data-doc-row
                    data-id="${esc(x.id)}"
                    data-code="${esc(
                      (x.code||'')
                        .toLowerCase()
                    )}"
                    data-title="${esc(
                      (x.title||'')
                        .toLowerCase()
                    )}"
                  >

                    <td>

                      <input
                        type="checkbox"
                        class="docCheck"
                        value="${esc(x.id)}"
                      >

                    </td>


                    <td>

                      <b>
                        ${esc(x.code)}
                      </b>

                    </td>


                    <td>
                      ${esc(x.title)}
                    </td>


                    <td>
                      ${esc(
                        x.unit_name||
                        'SFN'
                      )}
                    </td>


                    <td>
                      ${esc(
                        x.field_name||
                        '—'
                      )}
                    </td>


                    <td>

                      <span class="badge">
                        ${esc(
                          statusNames[x.status]||
                          x.status
                        )}
                      </span>

                    </td>


                    <td>

                      ${x.current_version_id
                        ? 'Có'
                        : '—'
                      }

                    </td>


                    <td>

                      <div
                        style="
                          display:flex;
                          gap:6px;
                          flex-wrap:wrap
                        "
                      >


                        ${x.status!=='published'
                          ? `
                            <button
                              class="btn btn-primary doc-status"
                              data-id="${esc(x.id)}"
                              data-status="published"
                            >

                              ${x.status==='withdrawn' ||
                                x.status==='hidden'

                                ? 'Công bố lại'

                                : 'Công bố'
                              }

                            </button>
                          `
                          : ''
                        }


                        ${x.status==='published'
                          ? `
                            <button
                              class="btn btn-secondary doc-status"
                              data-id="${esc(x.id)}"
                              data-status="hidden"
                            >
                              Ẩn
                            </button>


                            <button
                              class="btn btn-secondary doc-withdraw"
                              data-id="${esc(x.id)}"
                            >
                              Thu hồi
                            </button>
                          `
                          : ''
                        }


                        ${x.status==='hidden'
                          ? `
                            <button
                              class="btn btn-secondary doc-withdraw"
                              data-id="${esc(x.id)}"
                            >
                              Thu hồi
                            </button>
                          `
                          : ''
                        }


                        ${x.status!=='archived'
                          ? `
                            <button
                              class="btn btn-secondary doc-status"
                              data-id="${esc(x.id)}"
                              data-status="archived"
                            >
                              Lưu trữ
                            </button>
                          `
                          : ''
                        }

                      </div>

                    </td>

                  </tr>

                `
              ).join('')}

            </tbody>

          </table>

        </div>


        ${!items.length
          ? `
            <div class="empty">
              Không có tài liệu
              ở trạng thái này.
            </div>
          `
          : ''
        }

      `;


      /* ============================
         ĐẾM TÀI LIỆU ĐÃ CHỌN
      ============================ */

      const updateSelectedCount=()=>{

        const checked=
          $$('.docCheck:checked');

        const el=
          $('#selectedCount');


        if(el){

          el.textContent=
            `${checked.length} tài liệu được chọn`;
        }
      };


      $$('.docCheck').forEach(
        x=>{

          x.onchange=
            updateSelectedCount;

        }
      );


      /* ============================
         CHỌN TẤT CẢ
      ============================ */

      const selectAll=
        $('#selectAllDocs');


      if(selectAll){

        selectAll.onchange=e=>{

          $$('[data-doc-row]').forEach(
            row=>{

              if(
                row.style.display!==
                'none'
              ){

                const cb=
                  $('.docCheck',row);


                if(cb){

                  cb.checked=
                    e.target.checked;
                }
              }
            }
          );


          updateSelectedCount();
        };
      }


      /* ============================
         FILTER TRẠNG THÁI
      ============================ */

      const filter=
        $('#docStatusFilter');


      if(filter){

        filter.value=
          currentFilter;


        filter.onchange=e=>{

          currentFilter=
            e.target.value;

          render();
        };
      }


      /* ============================
         SEARCH
      ============================ */

      const search=
        $('#docSearch');


      if(search){

        search.oninput=e=>{

          const q=
            e.target.value
              .trim()
              .toLowerCase();


          $$('[data-doc-row]').forEach(
            row=>{

              const code=
                row.dataset.code||
                '';

              const title=
                row.dataset.title||
                '';


              row.style.display=
                !q ||
                code.includes(q) ||
                title.includes(q)

                  ? ''

                  : 'none';
            }
          );


          if(
            $('#selectAllDocs')
          ){

            $('#selectAllDocs').checked=
              false;
          }


          updateSelectedCount();
        };
      }


      /* ============================
         API ĐỔI TRẠNG THÁI
      ============================ */

      async function changeStatus(
        id,
        status,
        reason=''
      ){

        return api(
          `/api/admin/documents/${encodeURIComponent(id)}/status`,
          {
            method:'POST',
            body:JSON.stringify({
              status,
              reason
            })
          }
        );
      }


      /* ============================
         THAO TÁC TỪNG TÀI LIỆU
      ============================ */

      $$('.doc-status').forEach(
        b=>{

          b.onclick=
            async()=>{

              const status=
                b.dataset.status;


              const label=

                status==='published'
                  ? 'công bố'

                  : status==='hidden'
                    ? 'ẩn'

                    : status==='archived'
                      ? 'lưu trữ'

                      : 'cập nhật';


              if(
                !confirm(
                  `Xác nhận ${label} tài liệu này?`
                )
              ){

                return;
              }


              b.disabled=true;


              try{

                await changeStatus(
                  b.dataset.id,
                  status
                );


                toast(

                  status==='published'
                    ? 'Đã công bố tài liệu.'

                    : status==='hidden'
                      ? 'Đã ẩn tài liệu.'

                      : status==='archived'
                        ? 'Đã chuyển tài liệu vào lưu trữ.'

                        : 'Đã cập nhật tài liệu.'

                );


                await adminAction(
                  'documents',
                  $('[data-a=documents]')
                );

              }catch(err){

                console.error(err);


                toast(
                  'Không thể cập nhật: '+
                  (
                    err.data?.error||
                    err.message
                  )
                );


                b.disabled=false;
              }
            };
        }
      );


      /* ============================
         THU HỒI TỪNG TÀI LIỆU
      ============================ */

      $$('.doc-withdraw').forEach(
        b=>{

          b.onclick=
            async()=>{

              const reason=
                prompt(
                  'Nhập lý do thu hồi tài liệu:'
                );


              if(
                reason===null
              ){

                return;
              }


              if(
                !reason.trim()
              ){

                toast(
                  'Phải nhập lý do thu hồi.'
                );

                return;
              }


              if(
                !confirm(
                  'Xác nhận thu hồi tài liệu này khỏi hệ thống công khai?'
                )
              ){

                return;
              }


              b.disabled=true;


              try{

                await changeStatus(
                  b.dataset.id,
                  'withdrawn',
                  reason.trim()
                );


                toast(
                  'Đã thu hồi tài liệu.'
                );


                await adminAction(
                  'documents',
                  $('[data-a=documents]')
                );

              }catch(err){

                console.error(err);


                toast(
                  'Không thể thu hồi: '+
                  (
                    err.data?.error||
                    err.message
                  )
                );


                b.disabled=false;
              }
            };
        }
      );


      /* ============================
         DANH SÁCH ID ĐÃ CHỌN
      ============================ */

      const selectedIds=()=>{

        return $$('.docCheck:checked')
          .map(
            x=>x.value
          );
      };


      /* ============================
         BULK ACTION
      ============================ */

      async function bulkStatus(
        status
      ){

        const ids=
          selectedIds();


        if(
          !ids.length
        ){

          toast(
            'Chưa chọn tài liệu nào.'
          );

          return;
        }


        let reason='';


        if(
          status==='withdrawn'
        ){

          reason=
            prompt(
              `Nhập lý do thu hồi ${ids.length} tài liệu:`
            );


          if(
            reason===null
          ){

            return;
          }


          if(
            !reason.trim()
          ){

            toast(
              'Phải nhập lý do thu hồi.'
            );

            return;
          }
        }


        const actionName={

          published:'công bố',

          hidden:'ẩn',

          withdrawn:'thu hồi',

          archived:'lưu trữ'

        }[status]||
          'cập nhật';


        if(
          !confirm(
            `Xác nhận ${actionName} ${ids.length} tài liệu?`
          )
        ){

          return;
        }


        const buttons=[

          $('#publishSelected'),

          $('#hideSelected'),

          $('#withdrawSelected'),

          $('#archiveSelected')

        ].filter(Boolean);


        buttons.forEach(
          x=>x.disabled=true
        );


        let success=0;

        let failed=0;


        for(
          let i=0;
          i<ids.length;
          i++
        ){

          try{

            await changeStatus(
              ids[i],
              status,
              reason
            );


            success++;

          }catch(err){

            console.error(
              'Không thể cập nhật:',
              ids[i],
              err
            );


            failed++;
          }


          if(
            $('#selectedCount')
          ){

            $('#selectedCount').textContent=
              `Đang xử lý ${i+1}/${ids.length} · Thành công ${success} · Lỗi ${failed}`;
          }
        }


        toast(
          `Hoàn tất: ${success} thành công · ${failed} lỗi.`
        );


        await adminAction(
          'documents',
          $('[data-a=documents]')
        );
      }


      /* ============================
         NÚT BULK
      ============================ */

      $('#publishSelected').onclick=
        ()=>{
          bulkStatus(
            'published'
          );
        };


      $('#hideSelected').onclick=
        ()=>{
          bulkStatus(
            'hidden'
          );
        };


      $('#withdrawSelected').onclick=
        ()=>{
          bulkStatus(
            'withdrawn'
          );
        };


      $('#archiveSelected').onclick=
        ()=>{
          bulkStatus(
            'archived'
          );
        };

    };


    render();

    return;
  }


  /* ============================
     BULK IMPORT
  ============================ */

  if(action==='bulk'){

    p.innerHTML=`

      <h2>
        Nhập thư viện khởi tạo
      </h2>


      <p class="small">

        Chọn
        <b>manifest.json</b>
        và toàn bộ PDF trong thư mục
        <b>seed-library/pdfs</b>.

        Hệ thống đối chiếu SHA-256 trước khi lưu;
        mã đã tồn tại sẽ được bỏ qua.

      </p>


      <div class="form-grid">

        <div class="form-field full">

          <label>
            Manifest JSON
          </label>

          <input
            id="bulkManifest"
            type="file"
            accept="application/json,.json"
          >

        </div>


        <div class="form-field full">

          <label>
            Các file PDF
          </label>

          <input
            id="bulkFiles"
            type="file"
            accept="application/pdf"
            multiple
          >

        </div>


        <div class="form-field full">

          <button
            id="bulkStart"
            class="btn btn-primary"
          >
            Bắt đầu nhập
          </button>

        </div>

      </div>


      <div
        id="bulkProgress"
        class="notice"
        style="margin-top:16px"
      >
        Chưa bắt đầu.
      </div>
    `;


    $('#bulkStart').onclick=
      async()=>{

        const mf=
          $('#bulkManifest').files[0];

        const files=
          [...$('#bulkFiles').files];


        if(
          !mf||
          !files.length
        ){

          return toast(
            'Hãy chọn manifest và các PDF.'
          );
        }


        let manifest;


        try{

          manifest=
            JSON.parse(
              await mf.text()
            );

        }catch{

          return toast(
            'Manifest không hợp lệ.'
          );
        }


        if(
          manifest.instance_id!==
          'bc5bc5f5-b089-4102-a812-3b2666a802af'
        ){

          return toast(
            'Instance ID của manifest không khớp hệ thống.'
          );
        }


        const byName=
          new Map(
            files.map(
              f=>[
                f.name,
                f
              ]
            )
          );


        let ok=0;

        let skip=0;

        let fail=0;


        $('#bulkStart').disabled=
          true;


        for(
          let i=0;
          i<manifest.documents.length;
          i++
        ){

          const m=
            manifest.documents[i];

          const f=
            byName.get(
              m.filename
            );


          $('#bulkProgress').textContent=
            `Đang xử lý ${i+1}/${manifest.documents.length}: ${m.code}`;


          if(
            !f
          ){

            fail++;

            continue;
          }


          const fd=
            new FormData();


          fd.set(
            'metadata',
            JSON.stringify({
              ...m,
              status:'draft'
            })
          );


          fd.set(
            'file',
            f
          );


          try{

            const r=
              await api(
                '/api/admin/import-document',
                {
                  method:'POST',
                  body:fd
                }
              );


            r.skipped
              ? skip++
              : ok++;

          }catch(e){

            console.error(
              m.code,
              e
            );


            fail++;
          }
        }


        $('#bulkProgress').innerHTML=
          `
            Hoàn tất:
            <b>${ok}</b> mới
            ·
            <b>${skip}</b> đã tồn tại
            ·
            <b>${fail}</b> lỗi.

            Tất cả tài liệu mới được nhập
            ở trạng thái
            <b>bản nháp</b>
            để quản trị viên rà soát
            trước khi công bố.
          `;


        $('#bulkStart').disabled=
          false;
      };


    return;
  }


  /* ============================
     UNITS
  ============================ */

  if(action==='units'){

    const d=
      await api(
        '/api/admin/units'
      );


    p.innerHTML=`

      <h2>
        Đơn vị
      </h2>


      <div class="table-wrap">

        <table class="data-table">

          <thead>

            <tr>

              <th>Mã</th>

              <th>Tên</th>

              <th>Loại</th>

              <th>Trạng thái</th>

            </tr>

          </thead>


          <tbody>

            ${d.items.map(
              x=>`

                <tr>

                  <td>
                    ${esc(x.code)}
                  </td>

                  <td>
                    ${esc(x.name)}
                  </td>

                  <td>
                    ${esc(x.unit_type)}
                  </td>

                  <td>
                    ${esc(x.status)}
                  </td>

                </tr>

              `
            ).join('')}

          </tbody>

        </table>

      </div>


      <h3 style="margin-top:24px">
        Thêm đơn vị
      </h3>


      <form
        id="unitForm"
        class="form-grid"
      >

        <div class="form-field">

          <label>
            Mã đơn vị
          </label>

          <input
            name="code"
            required
          >

        </div>


        <div class="form-field">

          <label>
            Tên viết tắt
          </label>

          <input
            name="short_name"
          >

        </div>


        <div class="form-field full">

          <label>
            Tên đầy đủ
          </label>

          <input
            name="name"
            required
          >

        </div>


        <div class="form-field full">

          <label>
            Mô tả
          </label>

          <textarea
            name="description"
            rows="3"
          ></textarea>

        </div>


        <div class="form-field full">

          <button class="btn btn-primary">
            Tạo đơn vị
          </button>

        </div>

      </form>
    `;


    $('#unitForm').onsubmit=
      async e=>{

        e.preventDefault();


        const x=
          Object.fromEntries(
            new FormData(
              e.currentTarget
            )
          );


        await api(
          '/api/admin/units',
          {
            method:'POST',
            body:JSON.stringify(x)
          }
        );


        toast(
          'Đã tạo đơn vị'
        );


        adminAction(
          'units',
          btn
        );
      };


    return;
  }


  /* ============================
     NEW DOCUMENT
  ============================ */

  if(action==='newdoc'){

    const [u,t]=
      await Promise.all([

        api(
          '/api/admin/units'
        ),

        api(
          '/api/admin/taxonomy'
        )

      ]);


    p.innerHTML=`

      <h2>
        Đăng tài liệu
      </h2>


      <p class="small">

        Tạo hồ sơ metadata trước,
        sau đó tải PDF phiên bản đầu tiên.

      </p>


      <form
        id="docForm"
        class="form-grid"
      >


        <div class="form-field">

          <label>
            Mã tài liệu
          </label>

          <input
            name="code"
            required
            placeholder="SFN-ENG-2026-000001"
          >

        </div>


        <div class="form-field">

          <label>
            Loại tài liệu
          </label>

          <input
            name="document_type"
            required
            value="Tài liệu học thuật"
          >

        </div>


        <div class="form-field full">

          <label>
            Tên tài liệu
          </label>

          <input
            name="title"
            required
          >

        </div>


        <div class="form-field full">

          <label>
            Mô tả
          </label>

          <textarea
            name="summary"
            rows="4"
          ></textarea>

        </div>


        <div class="form-field">

          <label>
            Kho
          </label>

          <select name="library_scope">

            <option value="sfn">
              Học liệu SFN
            </option>

            <option value="external">
              Kho Tổng hợp
            </option>

          </select>

        </div>


        <div class="form-field">

          <label>
            Đơn vị
          </label>

          <select name="unit_id">

            ${u.items.map(
              x=>`
                <option value="${esc(x.id)}">
                  ${esc(x.code)} · ${esc(x.name)}
                </option>
              `
            ).join('')}

          </select>

        </div>


        <div class="form-field">

          <label>
            Lĩnh vực
          </label>

          <select name="field_id">

            <option value="">
              —
            </option>

            ${t.fields.map(
              x=>`
                <option value="${esc(x.id)}">
                  ${esc(x.name)}
                </option>
              `
            ).join('')}

          </select>

        </div>


        <div class="form-field">

          <label>
            Danh mục
          </label>

          <select name="category_id">

            <option value="">
              —
            </option>

            ${t.categories.map(
              x=>`
                <option value="${esc(x.id)}">
                  ${esc(x.name)}
                </option>
              `
            ).join('')}

          </select>

        </div>


        <div class="form-field">

          <label>
            Tác giả/Ban biên soạn
          </label>

          <input name="authors">

        </div>


        <div class="form-field">

          <label>
            Từ khóa
          </label>

          <input name="keywords">

        </div>


        <div class="form-field">

          <label>
            Năm
          </label>

          <input
            name="publication_year"
            type="number"
            value="${new Date().getFullYear()}"
          >

        </div>


        <div class="form-field">

          <label>
            Trạng thái
          </label>

          <select name="status">

            <option value="draft">
              Bản nháp
            </option>

            <option value="published">
              Công bố ngay
            </option>

          </select>

        </div>


        <div class="form-field full">

          <label>
            File PDF phiên bản đầu tiên
          </label>

          <input
            name="file"
            type="file"
            accept="application/pdf"
          >

        </div>


        <div class="form-field">

          <label>
            Nhãn phiên bản
          </label>

          <input
            name="version_label"
            value="1.0"
          >

        </div>


        <div class="form-field">

          <label>
            Ghi chú phiên bản
          </label>

          <input
            name="change_note"
            value="Phiên bản đầu tiên"
          >

        </div>


        <div class="form-field full">

          <button class="btn btn-primary">
            Lưu tài liệu
          </button>

        </div>

      </form>
    `;


    $('#docForm').onsubmit=
      async e=>{

        e.preventDefault();


        const fd=
          new FormData(
            e.currentTarget
          );


        const file=
          fd.get('file');


        const obj={};


        [
          'code',
          'document_type',
          'title',
          'summary',
          'library_scope',
          'unit_id',
          'field_id',
          'category_id',
          'authors',
          'keywords',
          'publication_year',
          'status'
        ].forEach(
          k=>
            obj[k]=
              fd.get(k)
        );


        try{

          const d=
            await api(
              '/api/admin/documents',
              {
                method:'POST',
                body:JSON.stringify(obj)
              }
            );


          if(
            file &&
            file.size
          ){

            const v=
              new FormData();


            v.set(
              'file',
              file
            );


            v.set(
              'version_label',
              fd.get(
                'version_label'
              )||
              '1.0'
            );


            v.set(
              'change_note',
              fd.get(
                'change_note'
              )||
              ''
            );


            await api(
              `/api/admin/documents/${encodeURIComponent(d.id)}/versions`,
              {
                method:'POST',
                body:v
              }
            );
          }


          toast(
            'Đã lưu tài liệu'
          );


          adminAction(
            'documents',
            $('[data-a=documents]')
          );

        }catch(err){

          toast(
            'Không thể lưu: '+
            (
              err.data?.error||
              err.message
            )
          );
        }
      };


    return;
  }


  /* ============================
     AUDIT
  ============================ */

  if(action==='audit'){

    const d=
      await api(
        '/api/admin/audit'
      );


    p.innerHTML=`

      <h2>
        Nhật ký hệ thống
      </h2>

      ${auditTable(
        d.items
      )}
    `;


    return;
  }
}


/* =========================================================
   AUDIT TABLE
========================================================= */

function auditTable(items){

  return `
    <div class="table-wrap">

      <table class="data-table">

        <thead>

          <tr>

            <th>
              Thời gian
            </th>

            <th>
              Hành động
            </th>

            <th>
              Đối tượng
            </th>

            <th>
              ID
            </th>

          </tr>

        </thead>


        <tbody>

          ${items.map(
            x=>`

              <tr>

                <td>
                  ${esc(x.created_at)}
                </td>

                <td>
                  ${esc(x.action)}
                </td>

                <td>
                  ${esc(x.entity_type)}
                </td>

                <td>
                  ${esc(
                    x.entity_id||
                    ''
                  )}
                </td>

              </tr>

            `
          ).join('')}

        </tbody>

      </table>

    </div>
  `;
}


/* =========================================================
   NAV
========================================================= */

function navSetup(){

  const toggle=
    $('#navToggle');

  const nav=
    $('#mainNav');


  toggle.onclick=()=>{

    const on=
      nav.classList.toggle(
        'open'
      );


    toggle.setAttribute(
      'aria-expanded',
      on
        ? 'true'
        : 'false'
    );
  };


  $$('.nav-group>button').forEach(
    b=>{

      b.onclick=e=>{

        if(
          innerWidth<=1080
        ){

          e.preventDefault();

          b.parentElement.classList.toggle(
            'open'
          );
        }
      };
    }
  );


  document.addEventListener(
    'click',
    e=>{

      if(
        innerWidth>1080 &&
        !e.target.closest(
          '.nav-group'
        )
      ){

        $$('.nav-group').forEach(
          g=>
            g.classList.remove(
              'open'
            )
        );
      }
    }
  );
}


/* =========================================================
   ROUTER
========================================================= */

async function route(){

  const p=
    location.pathname.replace(
      /\/+$/,
      ''
    )||
    '/';


  try{


    if(
      p==='/admin'||
      p==='/admin/login'
    ){

      return admin();
    }


    if(
      p==='/'
    ){

      return home();
    }


    if(
      pageMap[p]
    ){

      const [t,d,c,s]=
        pageMap[p];


      return listing(
        t,
        d,
        {
          category:c,
          scope:s
        }
      );
    }


    if(
      p==='/library'
    ){

      return library();
    }


    if(
      p==='/fields'
    ){

      return fields();
    }


    if(
      p.startsWith(
        '/field/'
      )
    ){

      return field(
        decodeURIComponent(
          p.slice(7)
        )
      );
    }


    if(
      p==='/units'
    ){

      return units();
    }


    if(
      p.startsWith(
        '/unit/'
      )
    ){

      return unit(
        decodeURIComponent(
          p.slice(6)
        )
      );
    }


    if(
      p==='/collections'
    ){

      return collections();
    }


    if(
      p==='/search'
    ){

      return searchPage();
    }


    if(
      p==='/document-code'
    ){

      return codeLookup();
    }


    if(
      p==='/versions'
    ){

      return versionsLookup();
    }


    if(
      p.startsWith(
        '/document/'
      )
    ){

      return documentPage(
        decodeURIComponent(
          p.slice(10)
        )
      );
    }


    if(
      staticPages[p]
    ){

      return staticPage(p);
    }


    title(
      'Không tìm thấy'
    );


    setMain(`
      ${pageHero(
        'Không tìm thấy trang'
      )}

      <section class="section">

        <div class="container">

          ${empty(
            'Đường dẫn không tồn tại hoặc đã được thay đổi.'
          )}

        </div>
      </section>
    `);


  }catch(e){


    console.error(e);


    setMain(`
      ${pageHero(
        'Không thể tải nội dung'
      )}

      <section class="section">

        <div class="container">

          ${empty(
            'Hệ thống gặp lỗi khi tải nội dung. Vui lòng thử lại sau.'
          )}

        </div>
      </section>
    `);

  }
}


/* =========================================================
   START
========================================================= */

navSetup();

route();
