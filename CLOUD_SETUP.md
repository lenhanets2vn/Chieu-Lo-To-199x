# Lô Tô Hội Chợ 199x — cấu hình kết nối chính thức

- **Firebase project:** `loto-83a1a`.
- **Firestore database:** `(default)`.
- Cấu hình Web SDK: `firebase-applet-config.json`. Khi dùng Render/Vercel, cấu hình `VITE_FIREBASE_*` theo `DEPLOY_ENV_VALUES.txt` và `VITE_FIRESTORE_DATABASE_ID=(default)`. Không đưa service-account hay khóa quản trị vào frontend.
- **Bắt buộc dùng bộ Security Rules mới** trong `firestore.rules`. Triển khai bằng `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` (đăng nhập Firebase CLI bằng tài khoản có quyền quản trị dự án).
- **Cloud Function dọn phòng** (không bắt buộc để chơi; cần billing nếu bật) trong `functions/index.cjs`, deploy riêng bằng `DEPLOY_CHAT_CLOUD_WINDOWS.cmd`. Trigger theo database `(default)`.
- Bật Firebase Authentication Email/Password, Firestore Database và Authorized domains của tên miền website. Đừng mở Rules thành `allow read,write: if true`.

**Chưa triển khai hoặc chạy thử trên dự án Firebase thực tế trong lần sửa này.** Frontend chỉ được đưa lên Render/Vercel sau khi Rules đã sẵn sàng. Kiểm tra bằng hai tài khoản khác nhau, hai thiết bị khác nhau.
