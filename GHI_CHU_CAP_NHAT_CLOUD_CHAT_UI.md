# Lô Tô Hội Chợ 199x — cập nhật giao diện và Firebase (04/11/2026)

## Những điểm đã thay đổi trong mã nguồn

1. Lịch sử số có chip nhỏ hơn, 8/12/15 cột theo kích thước màn hình, chiều cao giới hạn và cuộn tự động; vẫn giữ số mới nhất nổi bật.
2. Khuông nhạc, hai loa và spectrum chỉ xuất hiện sau khi chủ phòng/người chơi nhấn **BẮT ĐẦU VÁN CHƠI** (trạng thái COUNTDOWN, CALLING hoặc PAUSED); không hiện trên menu/trước khi chơi.
3. Nút bánh răng **ÂM LƯỢNG** được phóng lớn, tương phản cao, có chữ rõ ràng; mọi thao tác bật/tắt và kéo volume nằm trong cùng một menu.
4. Bắt buộc Firebase Authentication và hồ sơ Firestore trước khi vào màn hình game. Không còn nút chơi khách, không tự đăng nhập anonymous; Firestore Rules từ chối provider `anonymous` khi triển khai.
5. Tạo phòng mặc định 30 người (đã tự điền); có thêm tuỳ chọn 50, 75, 100 người. Giới hạn trên dịch vụ + Firestore Rules + listener thành viên đều tăng lên 100.
6. Sửa **lỗi chống spam hai lần**: ChatPanel trước đó gọi `validateAndFilterChatMessage` rồi Firebase Chat Service gọi lại tức thì, khiến lần thứ hai chặn gần như toàn bộ tin nhắn. Bộ lọc/rate limiter chỉ được chạy một lần ở tầng gửi Firebase.
7. Chat từ nay xác nhận khi Firestore ghi thành công trước khi xóa ô nhập; không còn chat phòng giả trên thiết bị không thuộc phòng. Snapshot có trạng thái `Cloud / Ngoại tuyến / Đang kết nối / Mất kết nối` và thông báo lỗi `permission-denied` hoặc sai database.
8. Trạng thái danh sách phòng hiển thị kết nối Firebase và lỗi quyền. Việc chọn vé chỉ sửa dữ liệu của tài khoản hiện tại, không gán cùng vé cho tất cả thành viên trên máy.
9. Khi người dùng chơi offline có tài khoản, chat giao diện trò chơi mặc định dùng kênh thế giới (không gắn vào kênh phòng khi chưa vào phòng online).

## Việc bắt buộc làm trên Firebase Console (bản source KHÔNG tự triển khai Cloud)

- Kiểm tra project **`loto-83a1a`**, chọn đúng Firestore **database (default)** `(default)` (là `(default)`).
- Authentication → Sign-in method → bật **Email/Password**. Anonymous không cần bật và sẽ bị từ chối ở Firestore Rules mới.
- Authentication → Settings → Authorized domains → thêm đúng tên domain Render/Vercel (không thêm `https://`).
- Triển khai `firestore.rules` và `firestore.indexes.json` vào database mặc định trên: mở CMD tại thư mục source, cài `firebase-tools`, đăng nhập và chạy `firebase deploy --only firestore --project loto-83a1a`. Có thể dùng `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd`.
- Trên Render/Vercel nhập đủ `VITE_FIREBASE_*` và `VITE_FIRESTORE_DATABASE_ID` theo `DEPLOY_ENV_VALUES.txt`; bảo đảm **hai máy người chơi truy cập cùng một site/project/database**, không phải hai Firebase projects khác nhau.
- Redeploy frontend sau khi thay biến môi trường; deploy frontend không tự deploy Firestore Rules.
- Kiểm tra 2 tài khoản Email/Password độc lập vào cùng kênh thế giới/chiếu hội; trạng thái đọc từ server hiện **● Cloud** khi listener kết nối thành công.

## Các giới hạn còn lại

- Không có quyền Firebase Console trong phiên này nên không thể xác nhận dịch vụ chạy trên dự án thật hoặc thay đổi rules ở Cloud.
- Mức tối đa **100 người là cấu hình sức chứa**, chưa được load test với 100 kết nối cùng lúc. Cấu trúc `rooms/{id}.players` vẫn dùng roster trong một tài liệu và transaction khi tham gia; để chịu tải phòng 100 người liên tục/đông đột biến cần chuyển sang membership riêng + server-controlled room count, cơ chế dọn thành viên ngắt kết nối và xử lý chủ phòng rời đi.
- Hiện chat realtime là Firestore (listener chỉ khi người dùng mở chat); mic realtime/WebRTC chưa có. Quy tắc chống spam ở client chưa thay thế rate limiting phía server.
- Shop, điểm, phần thưởng và quyền chơi cần xác thực bằng Cloud Functions nếu triển khai rộng rãi để phòng gian lận.
- Đã kiểm tra cú pháp TypeScript/TSX, cấu trúc tệp, ZIP. Chưa build/kiểm thử online hai thiết bị, vì phụ thuộc vào dự án Firebase và dependencies.
