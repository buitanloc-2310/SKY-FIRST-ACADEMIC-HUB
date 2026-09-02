# SKY FIRST ACADEMIC HUB

**Cổng Học liệu & Học thuật** của **Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)**.

- Domain production: `https://academic.skyfirst.io.vn`
- Instance ID do SFN cung cấp: `bc5bc5f5-b089-4102-a812-3b2666a802af`
- Nền tảng: Cloudflare Workers + D1 + R2 + Static Assets
- Người đọc: công khai, không cần tài khoản.
- Quản trị: chỉ tài khoản quản trị viên được tạo bằng quy trình bootstrap bảo mật; **không có đăng ký tài khoản công khai**.
- Hỗ trợ nhập thư viện PDF hàng loạt bằng manifest JSON qua Cổng quản trị. Bộ `seed-library` được lưu và tải lên riêng, không nằm trong source GitHub. Academic Hub 1.1 không tự sinh học liệu demo/mock cho môi trường production.

## 1. Cấu trúc

- `public/`: giao diện public + giao diện quản trị.
- `src/`: Worker API, xác thực admin, public API và admin API.
- `migrations/`: schema D1.
- `seed-library/`: **không nằm trong repository**. Bộ học liệu khởi tạo được lưu riêng và chỉ nhập qua Cổng quản trị khi cần.
- `scripts/`: kiểm tra dự án và bộ tạo học liệu.
- `docs/`: triển khai, bảo mật, pháp lý/quản trị và mô hình dữ liệu.

## 2. Chuẩn tài liệu PDF

- Khổ A4.
- Font hiển thị: họ Times-compatible (Tinos được nhúng khi môi trường không có Times New Roman bản quyền).
- Tiêu đề chính: 17 pt.
- Nội dung: 13 pt.
- Mọi trang đều có: `© Bản quyền thuộc Mạng lưới Giáo dục & Phát triển Cộng đồng Sky First (SFN)`.
- Mọi trang đều hiển thị Instance ID và mã tài liệu.
- Tài liệu mới nhập mặc định ở trạng thái **Bản nháp** để quản trị viên rà soát trước khi công bố.

## 3. Khởi chạy

Đọc `docs/DEPLOY_CLOUDFLARE.md`. Không commit secret, mật khẩu hoặc token vào mã nguồn.

## 4. Lưu ý dài hạn

Kiến trúc ưu tiên tiêu chuẩn web, dữ liệu tách biệt, không phụ thuộc framework front-end và không hard-code SFEC. Tuy nhiên không có hệ thống nào có thể được bảo đảm tuyệt đối rằng sẽ không cần cập nhật trong 10-20 năm. Cần duy trì bản vá bảo mật, theo dõi thay đổi Cloudflare và rà soát pháp luật định kỳ.

## 5. Academic Hub 1.1

- Thu gọn menu public: bỏ Bộ sưu tập, Đáp án & Rubric, Chuyên đề và Thư viện liên kết khỏi điều hướng chính.
- Trang chủ ưu tiên nhu cầu người học: tìm học liệu, luyện đề, khám phá theo lĩnh vực.
- Mở rộng các trang Về hệ thống, Quy định sử dụng, Bản quyền, Quyền riêng tư và Liên hệ.
- Chuẩn hóa footer, TTLH SFN và các cổng trực tuyến.
- Chuẩn hóa ký hiệu bản quyền `©`.
- Thêm `robots.txt`, `sitemap.xml` và metadata riêng theo route.
- Bộ tạo seed cũ đã được thay bằng trình tạo manifest từ PDF thật + metadata CSV; không tự sinh mock data.
