# Mô hình dữ liệu

Lõi: `SFN -> units -> fields/categories/collections -> documents -> document_versions`.

- `units.id`: ID bất biến; không dùng tên đơn vị làm khóa.
- `units.slug`: đường dẫn public có thể quản lý độc lập với tên hiển thị.
- `documents.id`: ID nội bộ bất biến.
- `documents.code`: mã tài liệu công khai, unique.
- `documents.current_version_id`: phiên bản hiện hành.
- `document_versions.sha256`: dấu vân tay file.
- `library_scope`: `sfn` hoặc `external`.
- `access_mode`: `view_download`, `view_only`, `metadata_only`, `external_link`.
- `audit_log`: lịch sử thao tác admin.

Không có bảng học viên, TNV, lớp học hoặc đăng ký tài khoản public.
