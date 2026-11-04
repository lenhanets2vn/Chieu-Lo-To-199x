# Báo cáo thay đổi Chat Thế Giới & Chat Phòng

## Đã chỉnh sửa trong Full Source

1. Hai kênh chat độc lập về giao diện: Thế Giới mở riêng; chat phòng chỉ xuất hiện trong phòng. Trong game có nút mở cửa sổ Thế Giới, không trộn hai tab trong một panel.
2. Thế Giới tạo `chat_sessions/{uid}.joinedAt` bằng `serverTimestamp` **một lần khi vào phiên đăng nhập trên trang**, sau đó truy vấn tin nhắn chỉ từ mốc đó. Không đọc lại lịch sử trước phiên.
3. Phòng tạo `members/{uid}.joinedAt` khi tham gia. Tin nhắn phòng được truy vấn từ thời điểm người chơi gia nhập. Thành viên được tạo theo bản cũ, nếu thiếu mốc, được bổ sung một lần khi truy cập phòng.
4. Thêm Rules hạn chế truy vấn lịch sử chat trước mốc tham gia và chặn đọc tin nhắn sau khi tài liệu phòng không còn tồn tại.
5. Xóa kênh nhận tin nhắn nội bộ BroadcastChannel cũ có nguy cơ đưa các tin không thuộc mốc phiên vào giao diện.
6. Bộ chọn emoji chèn **Unicode thật** và hiển thị biểu tượng kèm tên; tin nhắn cũ chứa mã `:)`, `:x`, `=))`, `:(`... được chuyển khi hiển thị. Không dùng HTML nguy hiểm.
7. Chống spam kênh Thế Giới và kênh Phòng được theo dõi riêng để không chặn nhầm tin vừa gửi sang kênh kia.
8. Realtime giới hạn tối đa 40 tin/kênh, chỉ bật listener khi xem đúng chat; tạm ngắt khi tab trình duyệt bị ẩn. Không tạo thêm vòng polling. Việc đăng nhập tạo một lần ghi và một lần đọc timestamp từ máy chủ để xác định mốc riêng tư.
9. Thêm Cloud Function v2 theo sự kiện xóa phòng (database đặt tên riêng): `cleanupClosedRoom`, xóa tài liệu con tồn dư dưới phòng. Cần triển khai độc lập trên Firebase bằng tài khoản có quyền; frontend không thể tự chạy function.

## Chưa xác nhận / giới hạn

- Chưa triển khai Rules/Function lên Firebase hoặc chạy hai máy thực tế; kết quả dựa trên rà soát source và kiểm tra cú pháp.
- Room chỉ tự đóng khi chủ phòng rời đúng luồng tạo phòng hiện tại; khi mọi người đóng tab đột ngột, còn cần cơ chế presence/onDisconnect đáng tin cậy ở backend. Không nhận là đã xử lý tình huống này.
- Multi-tab cùng một tài khoản hiện chia sẻ `chat_sessions/{uid}`; mở một tab mới đặt lại mốc chat Thế Giới, có thể ảnh hưởng tab cũ. Để độc lập từng tab và vẫn bảo vệ quyền đọc cần xác thực session-specific phía server.
- Xóa vật lý subcollection phải đợi Cloud Function thực thi. Nếu Functions chưa triển khai, Rules chỉ ngăn truy cập chứ không xóa dữ liệu còn lưu ở Firestore.
- Chưa có rate limiting server-side hay kiểm duyệt tin nhắn đáng tin cậy với SDK giả mạo.

## Bắt buộc triển khai đồng bộ

1. Upload mã nguồn frontend mới lên GitHub và redeploy Render/Vercel.
2. Chạy `DEPLOY_CHAT_CLOUD_WINDOWS.cmd` trong thư mục Full Source (cần Firebase CLI, đăng nhập Firebase, quyền triển khai và billing cho Functions) hoặc ít nhất triển khai Firestore Rules mới bằng `firebase deploy --only firestore:rules --project leafy-concept-qt8c4`.
3. Đảm bảo cả phần frontend và Rules dùng database `ai-studio-lthich199xlthoin-2cb02316-a219-47a4-9acb-21d18684e2a5`.
4. Không bật Rules mở toàn bộ để khắc phục lỗi cấp quyền.
