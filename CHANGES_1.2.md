# Sky First Academic Hub 1.2

Bản 1.2 tập trung vào khả năng khám phá học liệu và cảm giác hệ thống đang hoạt động thật, không bổ sung dữ liệu giả.

## Thay đổi chính

- Tách **Học liệu nổi bật** khỏi **Mới cập nhật**.
- Học liệu nổi bật chỉ hiển thị tài liệu thật có `featured = 1`; nếu chưa có, cả khối tự ẩn.
- Thêm khối **Bạn đang tìm gì?** với 5 lối vào: Giáo trình, Bài giảng, Bài tập, Ngân hàng đề, Nghiên cứu.
- Thêm khối **Các đơn vị trên Academic Hub**, lấy trực tiếp từ bảng `units` và hiển thị số tài liệu thật của từng đơn vị.
- Giữ số liệu trang chủ hoàn toàn từ D1; không dùng mock data.
- Thêm khối **Báo lỗi / góp ý tài liệu** trong hồ sơ tài liệu.
- API `/api/public/home` trả thêm `recent` và `units`, đồng thời chỉ lấy `featured` đúng nghĩa.
- Không có migration database mới.

## File thay đổi

- `src/public.js`
- `public/app.js`
- `public/styles.css`
- `package.json` (chỉ cập nhật version trong bản full)

## Triển khai

Nếu website đang ở bản 1.1, có thể dùng gói `UPDATE-ONLY`: chép đè đúng 3 file code trong gói rồi deploy lại. Không cần chạy migration.
