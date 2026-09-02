# Sky First Academic Hub 1.1 — Bản rà soát 02/09/2026

## Đã chỉnh giao diện và kiến trúc nội dung
- Trang chủ chuyển từ góc nhìn “hạ tầng hệ thống” sang nhu cầu người học: **Tìm học liệu / Luyện đề / Khám phá theo lĩnh vực**.
- Thu gọn menu Học liệu SFN: Giáo trình, Bài giảng, Bài tập, Ngân hàng đề, Toàn bộ học liệu, Theo lĩnh vực, Theo đơn vị.
- Bỏ khỏi điều hướng public: **Bộ sưu tập, Đáp án & Rubric, Chuyên đề, Thư viện liên kết**.
- Các URL cũ được redirect 301 tới mục phù hợp để tránh link chết.
- Footer nâng lên 4 cột: Academic Hub, Khám phá học liệu, Hệ thống SFN, Thông tin & hỗ trợ.
- Cập nhật đúng TTLH SFN và các cổng Academic / Member / TNV / CTT.
- Chuẩn hóa ký hiệu bản quyền từ `@` sang `©`.

## Đã mở rộng nội dung hệ thống
- Viết lại đầy đủ: Về Cổng Học thuật, Quy định sử dụng, Bản quyền, Quyền riêng tư, Liên hệ.
- Làm rõ đối tượng chính, phạm vi Academic Hub, mô hình đa đơn vị và nguyên tắc không tạo hồ sơ học viên/TNV công khai trên cổng này.
- Phân biệt tài liệu SFN, tài liệu của đơn vị trong hệ sinh thái và nguồn bên ngoài.

## Đã xử lý phần “mock data”
- Bỏ cơ chế tự sinh hàng loạt tài liệu demo/mẫu trong script seed.
- `scripts/generate_seed_library.py` hiện chỉ tạo manifest + SHA-256 từ **PDF thật** và `metadata.csv` thật.
- Validation không còn bắt buộc phải có bộ 1.000 PDF giả trong repository.

## SEO / crawler
- Thêm `robots.txt` và `sitemap.xml`.
- Worker hiện xử lý HTML route trước để gắn title, description, Open Graph và canonical riêng cho từng trang.
- Route không tồn tại trả HTTP 404; `/admin` và 404 có `X-Robots-Tag: noindex, nofollow`.
- `run_worker_first` chuyển sang `true` để metadata route thực sự đi qua Worker.

## Database
- Thêm migration `0002_academic_hub_1_1.sql`.
- Migration chuyển `dap-an-rubric`, `chuyen-de`, `thu-vien-lien-ket` sang `inactive` trên database đã deploy trước đây.
- `schema_version` nâng lên `2`.
- Admin chỉ trả về field/category đang `active` khi tạo tài liệu mới.

## Kiểm tra trước khi đóng gói
- JavaScript syntax: PASS.
- Python seed-manifest script: PASS.
- `scripts/validate.mjs`: `VALIDATION_OK`.
- Migration 0001 + 0002 chạy thử bằng SQLite: PASS.
- Migration 0002 trên mô phỏng database cũ: 3 taxonomy đã bỏ chuyển sang `inactive`: PASS.

## Khi deploy bản này
1. `npm install`
2. `npm run db:migrate`
3. `npm run validate`
4. `npm run deploy`

Không cần xóa database hiện tại; migration 0002 xử lý tương thích với dữ liệu cũ.
