# Chat theo phiên và dọn phòng

Chat Thế giới đọc tối đa 40 tin kể từ mốc online của tài khoản; một lần đăng nhập trang tạo một mốc `chat_sessions/{uid}.joinedAt` (một write + một server read). Chat phòng đọc tối đa 40 tin kể từ khi vào phòng, dựa vào `members/{uid}.joinedAt`. Listener chat chỉ mở khi xem kênh và tab còn hiện. Không có heartbeat Firestore.

- Chủ phòng bấm **Rời phòng**: nếu còn người, chuyển quyền HOST nguyên tử, phòng và lịch sử người chơi hiện tại vẫn tồn tại. Khi HOST cuối cùng rời phòng, xóa phòng; Cloud Function (nếu triển khai) xóa subcollections sau đó.
- HOST thoát bất thường (tắt máy, crash, cắt mạng) chưa có cơ chế presence/lease máy chủ: **không bảo đảm tự chuyển quyền** trong tình huống này.
- Triển khai Rules vào Firestore `(default)` của dự án `loto-83a1a`. Cloud Function dọn phòng chỉ chạy khi tài liệu phòng bị xóa, không chạy mỗi tin nhắn hoặc mỗi nhịp nhạc.
- Đối với nhiều tab dùng cùng một tài khoản, mốc chat Thế giới có thể bị ghi đè bởi tab mới; chưa có phiên tách riêng từng tab phía máy chủ.
