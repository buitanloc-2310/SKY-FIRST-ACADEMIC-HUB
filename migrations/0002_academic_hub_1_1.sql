PRAGMA foreign_keys = ON;

-- Academic Hub 1.1: thu gọn taxonomy public và chuẩn hóa thông tin bản quyền.
UPDATE settings
SET value_json='"© Bản quyền thuộc Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)"',
    updated_at=CURRENT_TIMESTAMP
WHERE key='copyright_footer';

UPDATE categories
SET status='inactive', updated_at=CURRENT_TIMESTAMP
WHERE slug IN ('dap-an-rubric','chuyen-de','thu-vien-lien-ket');

UPDATE meta
SET value='2'
WHERE key='schema_version';
