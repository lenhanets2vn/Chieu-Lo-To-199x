# Chat Thế Giới & Chat Phòng — theo phiên online

## Quy tắc hiển thị

- **Thế Giới:** lúc tài khoản xác thực trên một trang web mới, app tạo một tài liệu `chat_sessions/{uid}` có thời điểm `joinedAt` do **Firestore server** tạo. Chỉ truy vấn `world_messages` từ mốc đó, tối đa 40 tin. Người đến sau không nhận những tin cũ. Một người mở nhiều tab đồng thời dưới cùng UID có thể khiến phiên trên tab cũ bị thay mốc: giới hạn cần xử lý bằng server riêng trước khi phát hành ở quy mô lớn.
- **Phòng:** `rooms/{roomId}/members/{uid}.joinedAt` được ghi cùng giao dịch tạo/tham gia phòng. Chat phòng chỉ truy vấn các tin tạo sau thời điểm người đó tham gia phòng, tối đa 40 tin. Thành viên từ bản cũ chưa có mốc được cập nhật 1 lần lúc vào phòng. Thao tác đọc tin trong phòng bị từ chối ngay khi tài liệu phòng bị xóa.
- **Icon:** gửi Unicode thật khi chọn emoji, đọc mã Yahoo cũ như `:)`, `:x`, `=))` và hiển thị emoji thay vì chuỗi ký tự. Nội dung tin nhắn được React escape mặc định, không dùng `dangerouslySetInnerHTML`.

## Thực hiện để online thật

1. **Deploy cùng lúc mã frontend mới và `firestore.rules` mới.** Query `createdAt >= joinedAt` phải khớp Rules, nếu giữ rules cũ/new frontend lệch phiên có thể bị `permission-denied`.
2. Chạy `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` để đưa Rules và function dọn phòng lên đúng dự án Firebase. Functions cần tài khoản có quyền và cấu hình thanh toán thích hợp.
3. Cần bảo đảm Firebase CLI đã tạo trigger **trên database có tên** `ai-studio-lthich199xlthoin-2cb02316-a219-47a4-9acb-21d18684e2a5`, không dùng `(default)`; kiểm tra vùng đặt database trên Firebase Console.
4. `onDocumentDeleted('rooms/{roomId}')` chạy **khi phòng bị xóa** để xóa thực tế các tài liệu con, không có vòng polling. Firestore không tự xóa subcollections khi xóa parent.

## Giới hạn cần nắm

- Không khẳng định đã xóa vật lý nếu function chưa được triển khai. Ngay khi phòng bị xóa, Rules đã **chặn truy cập** chat phòng; dữ liệu cũ có thể còn lưu trong database cho tới khi trigger hoàn tất.
- **Thoát trang đột ngột/mất mạng** không bảo đảm gửi thao tác rời phòng, vì trình duyệt không có onDisconnect đáng tin cậy cho Firestore. Xóa phòng khi không còn người trong trường hợp treo tab/mất kết nối cần hệ thống presence phía máy chủ (như Firebase Realtime Database onDisconnect) và có thể được bổ sung sau.
- Message vẫn lưu trong Firestore cho tới khi phòng đóng (nếu triển khai cleanup). Kênh Thế Giới hiện chưa có TTL tự xóa vật lý; mỗi tài khoản chỉ thấy tin từ khi online.
- Firestore Rules không phải hệ thống kiểm soát spam server-authoritative; chưa triển khai hạn mức tin/phút và kiểm duyệt độc lập với frontend.
- World chat dùng 1 write và 1 server read để ghi mốc phiên khi đăng nhập; không có heartbeat liên tục. Chat listener chỉ hoạt động khi mở đúng kênh và tab đang được nhìn thấy; trò chơi vẫn giữ listener nhỏ cho trạng thái ván đang chơi.

## Kiểm chứng

Mã nguồn được rà soát tĩnh, chưa được triển khai lên dự án Firebase thật. Khuyến nghị kiểm tra 2 tài khoản/thiết bị sau deploy để xác minh `permission-denied`, phân quyền theo thời điểm vào và việc dọn phòng.
