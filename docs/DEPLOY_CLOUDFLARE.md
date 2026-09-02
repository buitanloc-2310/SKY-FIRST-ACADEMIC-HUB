# Triển khai Cloudflare

## Điều kiện
- Node.js LTS.
- Wrangler đăng nhập đúng tài khoản Cloudflare của SFN.
- Domain `skyfirst.io.vn` đang được quản lý trên Cloudflare nếu muốn gắn custom domain.

## 1. Cài dependency
```bash
npm install
```

## 2. Tạo D1
```bash
npx wrangler d1 create skyfirst-academic-db
```
Sao chép `database_id` Cloudflare trả về vào `wrangler.jsonc`.

## 3. Tạo R2
```bash
npx wrangler r2 bucket create skyfirst-academic-files
```

## 4. Áp dụng migration
```bash
npm run db:migrate
```

## 5. Tạo secret bootstrap
Tạo một chuỗi ngẫu nhiên dài, chỉ dùng để tạo quản trị viên đầu tiên:
```bash
npx wrangler secret put BOOTSTRAP_TOKEN
```
Không ghi token này vào file, email công khai hoặc source control.

## 6. Deploy
```bash
npm run validate
npm run deploy
```

## 7. Tạo quản trị viên đầu tiên
Gửi POST tới `/api/auth/bootstrap`, header `x-bootstrap-token` chứa secret vừa tạo, body JSON gồm `email`, `full_name`, `password`. Mật khẩu bootstrap tối thiểu 14 ký tự.

Sau khi tạo quản trị viên thành công, **rotate hoặc xóa BOOTSTRAP_TOKEN**. Endpoint cũng tự từ chối khi đã có quản trị viên.

## 8. Custom domain
Trong Cloudflare Workers, gắn `academic.skyfirst.io.vn` vào Worker. Đồng thời xác nhận `APP_URL` trong `wrangler.jsonc` đúng origin production trước khi deploy.

## 9. Nhập học liệu thật
1. Chuẩn bị các PDF đã được rà soát trong `seed-library/pdfs/`.
2. Tạo `seed-library/metadata.csv` với tối thiểu các cột `code,title,filename`.
3. Chạy `python scripts/generate_seed_library.py` để tạo `manifest.json` và SHA-256 từ **file thật**.
4. Truy cập `/admin` và đăng nhập.
5. Chọn **Nhập hàng loạt**, tải `manifest.json` và các PDF tương ứng.
6. Tất cả tài liệu mới được nhập dưới trạng thái **Bản nháp**.
7. Rà soát nội dung, metadata, quyền sử dụng và nguồn trước khi chuyển sang **Công bố**.

Academic Hub 1.1 **không tự sinh mock/demo learning content**. Chỉ đưa dữ liệu thật lên môi trường production.
