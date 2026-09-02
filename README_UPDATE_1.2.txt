SKY FIRST ACADEMIC HUB — UPDATE 1.1 -> 1.2

Gói này chỉ chứa các file cần chép đè lên source v1.1.
KHÔNG cần chạy migration database.
KHÔNG xóa dữ liệu hiện tại.
KHÔNG tạo mock data.

Cách cập nhật:
1. Mở project Academic Hub v1.1 hiện tại.
2. Chép đè 3 file theo đúng đường dẫn:
   - src/public.js
   - public/app.js
   - public/styles.css
3. Commit/push hoặc deploy lại Cloudflare Worker.
4. Không cần chạy D1 migration cho bản cập nhật này.

Tính năng thêm trong 1.2:
- Bạn đang tìm gì? (5 lối vào học liệu)
- Học liệu nổi bật (chỉ data thật có featured=1; không có thì tự ẩn)
- Mới cập nhật
- Các đơn vị trên Academic Hub + số học liệu thật
- Nút Báo lỗi / góp ý trong hồ sơ tài liệu

Lưu ý:
- Các khối lấy dữ liệu trực tiếp từ D1.
- Muốn hiện SFEC/NHN trong “Các đơn vị trên Academic Hub”, hãy tạo/kích hoạt đơn vị đó trong khu quản trị.
