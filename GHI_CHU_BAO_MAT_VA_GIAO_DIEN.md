# Ghi chú phiên bản giao diện & vật phẩm

- Giao diện người chơi không hiển thị tên dịch vụ hạ tầng, tên database, trạng thái đồng bộ kỹ thuật, tab Đồng Bộ, tên version và các lỗi raw từ backend.
- Đăng nhập, phòng nhiều người và chat vẫn dùng backend hiện tại; KHÔNG được xóa SDK đang chạy nếu muốn giữ những tính năng này.
- Kết nối mạng của trình duyệt và Firebase Web Config vẫn có thể được người dùng kỹ thuật xem. Đó là thiết kế công khai của Firebase Web SDK, không phải bí mật quản trị. Không đưa service-account JSON, Firebase Admin private key, secret, .env lên repository công khai.
- Firestore Security Rules phải được triển khai vào đúng database (default). Không dùng `allow read, write: if true`.
- Xu, quyền sở hữu vật phẩm, phần thưởng hiện chưa được kiểm chứng bởi backend đáng tin cậy, vì vậy người dùng có thể sửa payload hoặc trạng thái nếu rules cho phép. Để bảo vệ thật sự cần Cloud Functions / backend giao dịch đáng tin cậy.
- Giá trị Firebase Web Config trong file DEPLOY_ENV_VALUES.txt chỉ dành cho người triển khai. Không đưa file đó vào thư mục public.

## Thay đổi UI
- Lịch sử số: văn bản `01 - 02 - 03` tự xuống dòng, không còn ô/vòng tròn bao từng số.
- Vé: đúng một hàng năm số, bảng màu đỏ/vàng/xanh theo mẫu hội chợ; marker đã trang bị được đặt ở góc số vừa gọi.
- Shop: bỏ tab đồng bộ; mua marker, mẫu vé, frame, danh hiệu lập tức trang bị; cho đổi trong kho; emoji VIP xem trong chat.
- Emoji VIP: gửi qua kênh chat hiện tại, người nhận đang xem kênh sẽ phát hiệu ứng cho tin nhắn mới, không replay tin cũ khi mở kênh.
- Không thêm listener nền mới cho Shop; phát hiệu ứng nhờ listener chat đã có.

## Kiểm thử / giới hạn
- Đã kiểm tra cấu trúc mã TypeScript/TSX, không thay thế cho production build hoặc test 2 thiết bị.
- Quyền dùng vật phẩm, mua bán, thưởng và giới hạn vòng quay cần được xác thực phía máy chủ trước khi phát hành chính thức.
