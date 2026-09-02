# Pháp lý, bản quyền và quản trị nội dung

Mục tiêu của kiến trúc là giảm rủi ro pháp lý bằng nguyên tắc dữ liệu tối thiểu, phân tách nội dung SFN với nguồn bên ngoài, ghi nguồn và có cơ chế ẩn/rút tài liệu. Đây không phải là ý kiến pháp lý và không thể bảo đảm một hệ thống sẽ tự động phù hợp với mọi thay đổi pháp luật trong 10-20 năm.

## 1. Hai kho nội dung
### Học liệu SFN
Chỉ dùng nhãn bản quyền SFN đối với tài liệu mà SFN có quyền sở hữu/sử dụng phù hợp.

### Kho Tổng hợp
Không gắn thông tin khiến người đọc hiểu SFN sở hữu nội dung gốc của bên thứ ba. Lưu `external_source_name`, `external_source_url`, `external_rights_note`; ưu tiên liên kết tới nguồn gốc khi không có quyền phân phối lại file.

## 2. Quy trình công bố
- Upload/nhập tài liệu -> Bản nháp.
- Rà soát nội dung, quyền sử dụng, nguồn và metadata.
- Công bố.
- Khi có tranh chấp hợp lý: có thể chuyển `hidden`/`withdrawn` trong khi xác minh.

## 3. Quyền riêng tư
Cổng public không yêu cầu tài khoản người đọc và không xây hồ sơ TNV/học viên. Admin chỉ lưu thông tin cần cho xác thực/quản trị.

## 4. Người chưa thành niên
Không thiết kế cổng này như nền tảng nhắn tin, hồ sơ cá nhân hay tương tác một-một với người học. Nếu SFN bổ sung các tính năng đó sau này, phải đánh giá riêng về bảo vệ trẻ em và dữ liệu cá nhân trước khi triển khai.

## 5. Rà soát định kỳ
Nên có rà soát ít nhất hằng năm về: quyền tác giả; dữ liệu cá nhân; điều khoản sử dụng; quy trình gỡ nội dung; nhà cung cấp hạ tầng; backup/retention; tài khoản quản trị; và thay đổi pháp luật liên quan.
