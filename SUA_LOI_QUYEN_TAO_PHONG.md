# Firestore từ chối tạo phòng công khai — hướng dẫn xử lý

## Kết luận mã nguồn

Ứng dụng tạo ba tài liệu lần lượt: `/rooms/{id}`, `/rooms/{id}/members/{uid}` và `/rooms/{id}/state/current`. Rules trong ZIP cho phép việc này với tài khoản Firebase Email/Password đã đăng nhập, đúng UID, trạng thái WAITING, số người từ 2 đến 100 và không có trường password. Nhưng ZIP **không thể chứng minh** Rules của dự án Cloud đã được deploy.

Firestore được cấu hình ở database **có tên riêng** `ai-studio-lthich199xlthoin-2cb02316-a219-47a4-9acb-21d18684e2a5`, thuộc project `leafy-concept-qt8c4`. Không nhầm với `(default)`.

## Sửa ngay

1. Giải nén Full Source. Tại thư mục có `firebase.json`, `firestore.rules`, chạy `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` bằng CMD Windows.
2. Nếu chưa có CLI, chạy `npm install -g firebase-tools` rồi chạy lại CMD. Đăng nhập Firebase bằng tài khoản có quyền quản trị dự án.
3. Script xác nhận database có tồn tại rồi chạy **`firebase deploy --only firestore:rules --project leafy-concept-qt8c4`**; không tạo database mới và không deploy frontend/Hosting.
4. Chỉ sau khi Firebase CLI báo deploy thành công, quay lại website để thử tạo phòng bằng tài khoản Email/Password (không phải Anonymous).
5. Nếu vẫn bị từ chối: bản source này hiển thị chính xác giai đoạn: `tạo phòng`, `ghi chủ phòng`, `khởi tạo ván chơi`. Đối chiếu UID và cấu hình môi trường Render/Vercel, đặc biệt `VITE_FIRESTORE_DATABASE_ID`; redeploy giao diện nếu thay biến môi trường.

Không sửa rules thành `allow read, write: if true` — sẽ mở quyền truy cập mọi hồ sơ và chat. Không lưu thông tin tài khoản dịch vụ Firebase Admin vào `VITE_*` hay GitHub.

## Lưu ý

Trường hợp Rules chưa được deploy không thể sửa bằng chỉ cập nhật website Render. Lệnh CLI cần quyền truy cập tài khoản Firebase thật và kết quả sẽ được in tại CMD.
