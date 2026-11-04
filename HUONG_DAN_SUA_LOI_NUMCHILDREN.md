# Vá lỗi `numChildren()` — Firebase Realtime Database Rules

**Dự án:** `loto-83a1a`. **Ngày:** 05/11/2026.

## Nguyên nhân
Ba lỗi 8:159, 9:71, 26:106 do sử dụng `RuleDataSnapshot.numChildren()`, không được Realtime Database Rules hỗ trợ. Đây là lỗi **cú pháp**, không phải lỗi IAM.

## Giải pháp
- Bỏ hoàn toàn `numChildren()` trong `database.rules.json`.
- Thay giới hạn 90 người thành **90 slot cố định** với khóa chuỗi `0` đến `89`, được RTDB Rules ràng buộc bằng regex `^([0-9]|[1-8][0-9])$`. Không thể thêm slot thứ 91 vào `/admission/active`.
- Thêm `/admission/claims/{uid}` (chỉ chính UID được ghi) để ngăn cùng tài khoản giữ nhiều slot cùng lúc khi các lượt ghi được thực hiện đúng theo Rules.
- `src/features/capacity/onlineAdmission.ts` đọc tối đa 90 slot đang có, chọn slot còn trống, ghi claim, đăng ký `onDisconnect().remove()` và chỉ sau đó tạo slot. Nếu đụng tranh chấp sẽ thử vị trí khác.
- `.validate` thay kiểm tra đếm trường bằng `hasChildren` và `$other: {".validate": false}` để không chấp nhận thuộc tính lạ.

## Thực hiện
1. Giải nén **bộ Rules vá lỗi**.
2. Chạy `DEPLOY_SPARK_REALTIME_WINDOWS.cmd` trong thư mục bộ Rules.
3. Sau khi deploy Rules thành công, **cập nhật frontend bằng Full Source cùng phiên bản**. Bộ Rules mới sẽ không tương thích với frontend cũ đang tạo slot theo UID ngẫu nhiên.
4. Xác nhận URL Realtime Database trong `VITE_FIREBASE_DATABASE_URL` thuộc dự án `loto-83a1a`.
5. Kiểm tra thực tế tạo slot, rời tab, tự giải phóng; thử 2 thiết bị và thử giới hạn công suất.

## Hạn chế cần biết
- 90 slot là giới hạn **đăng ký trong ứng dụng**, không giới hạn vật lý các kết nối RTDB mà trình duyệt hoặc bên thứ ba có thể tự mở. Spark vẫn chỉ có tối đa 100 kết nối đồng thời.
- Phải cập nhật cả frontend và Rules; chỉ cập nhật Rules có thể khiến bản cũ không vào được.
- Chưa kiểm thử trên Firebase Emulator hoặc trên dự án thực tế; đã kiểm tra tĩnh JSON/cú pháp TypeScript.
- RTDB Rules không thể xác minh trạng thái tham gia phòng trong Firestore. Hàng chờ vẫn là best-effort, không phải chống gian lận hoàn toàn.

### Nguồn tham khảo
https://firebase.google.com/docs/reference/security/database
https://firebase.google.com/docs/database/security/regex
https://firebase.google.com/docs/database/usage/limits
