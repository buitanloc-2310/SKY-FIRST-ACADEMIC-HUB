PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO meta(key,value) VALUES
  ('instance_id','bc5bc5f5-b089-4102-a812-3b2666a802af'),
  ('schema_version','1'),
  ('platform_name','Sky First Academic Hub');

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  full_name TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 210000,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  short_name TEXT,
  unit_type TEXT NOT NULL DEFAULT 'Đơn vị trực thuộc',
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status,sort_order,name);

CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  library_scope TEXT NOT NULL DEFAULT 'sfn' CHECK(library_scope IN ('sfn','external')),
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  description TEXT,
  unit_id TEXT,
  field_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE SET NULL,
  FOREIGN KEY(field_id) REFERENCES fields(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  subtitle TEXT,
  summary TEXT,
  document_type TEXT NOT NULL,
  library_scope TEXT NOT NULL DEFAULT 'sfn' CHECK(library_scope IN ('sfn','external')),
  unit_id TEXT,
  field_id TEXT,
  category_id TEXT,
  collection_id TEXT,
  authors TEXT,
  keywords TEXT,
  language TEXT NOT NULL DEFAULT 'vi',
  publication_year INTEGER,
  current_version_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden','archived','withdrawn')),
  access_mode TEXT NOT NULL DEFAULT 'view_download' CHECK(access_mode IN ('view_download','view_only','metadata_only','external_link')),
  external_source_name TEXT,
  external_source_url TEXT,
  external_rights_note TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE SET NULL,
  FOREIGN KEY(field_id) REFERENCES fields(id) ON DELETE SET NULL,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_docs_pub ON documents(status,published_at DESC);
CREATE INDEX IF NOT EXISTS idx_docs_unit ON documents(unit_id,status);
CREATE INDEX IF NOT EXISTS idx_docs_field ON documents(field_id,status);
CREATE INDEX IF NOT EXISTS idx_docs_cat ON documents(category_id,status);
CREATE INDEX IF NOT EXISTS idx_docs_scope ON documents(library_scope,status);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_label TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  change_note TEXT,
  file_key TEXT,
  filename TEXT,
  mime TEXT DEFAULT 'application/pdf',
  file_size INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','superseded','withdrawn')),
  effective_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  UNIQUE(document_id,version_label),
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_versions_doc ON document_versions(document_id,version_number DESC);

CREATE TABLE IF NOT EXISTS document_tags (
  document_id TEXT NOT NULL,
  tag TEXT NOT NULL COLLATE NOCASE,
  PRIMARY KEY(document_id,tag),
  FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  FOREIGN KEY(updated_by) REFERENCES admins(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO settings(key,value_json) VALUES
 ('site_name','"Sky First Academic Hub"'),
 ('site_tagline','"Cổng Học liệu & Học thuật"'),
 ('maintenance_mode','false'),
 ('copyright_footer','"© Bản quyền thuộc Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)"'),
 ('external_takedown_email','"skyfirst.ec@gmail.com"');

INSERT OR IGNORE INTO units(id,code,slug,name,short_name,unit_type,description,logo_url,status,sort_order)
VALUES('unit_sfn','SFN','sfn','Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First','SFN','Mạng lưới','Đơn vị quản trị và sở hữu nền tảng học thuật Sky First.','/assets/skyfirst-logo.png','active',0);

INSERT OR IGNORE INTO fields(id,slug,name,description,sort_order) VALUES
 ('field_english','tieng-anh','Tiếng Anh','Học liệu và tài nguyên học thuật tiếng Anh.',10),
 ('field_languages','ngon-ngu','Ngôn ngữ','Học liệu ngôn ngữ và giao tiếp.',20),
 ('field_study','ky-nang-hoc-tap','Kỹ năng học tập','Phương pháp học tập, tự học và quản lý tri thức.',30),
 ('field_community','phat-trien-cong-dong','Phát triển cộng đồng','Tài nguyên về hoạt động cộng đồng và tình nguyện.',40),
 ('field_management','quan-tri-du-an','Quản trị dự án & tổ chức','Tài nguyên quản trị dự án, CLB, đội nhóm.',50),
 ('field_research','nghien-cuu','Nghiên cứu','Phương pháp nghiên cứu và học thuật.',60),
 ('field_digital','nang-luc-so','Năng lực số','Kỹ năng số, thông tin và truyền thông.',70);

INSERT OR IGNORE INTO categories(id,slug,name,description,library_scope,sort_order) VALUES
 ('cat_textbook','giao-trinh','Giáo trình','Giáo trình và tài liệu học theo chương trình.','sfn',10),
 ('cat_exercise','bai-tap','Bài tập','Phiếu bài tập và thực hành.','sfn',20),
 ('cat_exam','ngan-hang-de','Ngân hàng đề','Đề luyện tập và đánh giá.','sfn',30),
 ('cat_lesson','bai-giang','Bài giảng','Kế hoạch bài giảng và học liệu giảng dạy.','sfn',50),
 ('cat_research','nghien-cuu','Nghiên cứu','Nghiên cứu và báo cáo học thuật.','sfn',60),
 ('cat_report','bao-cao','Báo cáo','Báo cáo chuyên môn và tổng hợp.','sfn',80),
 ('cat_article','bai-viet-hoc-thuat','Bài viết học thuật','Bài viết học thuật và phổ biến tri thức.','sfn',90),
 ('cat_reference','tai-lieu-tham-khao','Tài liệu tham khảo','Tài nguyên tổng hợp từ nguồn bên ngoài.','external',110),
 ('cat_official','nguon-giao-duc-chinh-thong','Nguồn giáo dục chính thống','Liên kết tới nguồn chính thống.','external',120),
 ('cat_international','tai-nguyen-quoc-te','Tài nguyên quốc tế','Nguồn học thuật và giáo dục quốc tế.','external',130);
