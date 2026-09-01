# Security baseline

## Mô hình truy cập
- Public: chỉ đọc nội dung đã `published`.
- Không có đăng ký tài khoản public, học viên, TNV hoặc giáo viên.
- Admin: cookie `HttpOnly + Secure + SameSite=Strict`, thời hạn phiên 8 giờ.
- Mật khẩu: PBKDF2-SHA256, 210.000 vòng, salt ngẫu nhiên.
- Bootstrap admin: secret ngoài source code + chỉ cho phép khi bảng admin còn trống.
- Login rate-limit theo IP hash.

## HTTP security
Worker thiết lập CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP và CORP.

## File
- Chỉ chấp nhận PDF trong luồng upload phiên bản.
- Giới hạn 50 MB/file ở API hiện tại.
- SHA-256 được lưu để kiểm tra tính toàn vẹn.
- File R2 không được public trực tiếp; public truy cập qua API sau khi kiểm tra trạng thái document.

## Audit
Các thao tác quản trị quan trọng được ghi `audit_log`. Không lưu mật khẩu, session token hoặc bootstrap secret vào audit.

## Việc nên làm trước production
- Bật Cloudflare WAF/rate limiting phù hợp với gói đang sử dụng.
- Bật MFA cho tài khoản Cloudflare của quản trị viên.
- Dùng password manager.
- Định kỳ revoke session/admin không còn được ủy quyền.
- Sao lưu D1/R2 theo chính sách của SFN.
- Theo dõi dependency/compatibility date của Worker.
- Thực hiện kiểm thử xâm nhập hợp pháp trước khi hệ thống có quy mô lớn.
