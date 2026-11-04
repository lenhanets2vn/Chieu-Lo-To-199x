# Lô Tô 199x — tối ưu Spark Free theo mô hình lai (05/11/2026)

## Các thay đổi đã viết vào mã

- Thêm `src/services/realtime.ts`: kết nối Realtime Database (RTDB) **chỉ khi** khai báo URL thật `VITE_FIREBASE_DATABASE_URL`. Không tự đoán URL theo Project ID.
- Thêm `src/features/capacity/onlineAdmission.ts`: khi được bật, người vừa đăng nhập vào hàng chờ Firestore `online_waiting/{uid}`. Người ở đầu hàng chờ thử chiếm slot RTDB; tối đa **90 slot** theo RTDB Security Rules, 10 kết nối dự phòng ở giới hạn Spark 100. Slot có `onDisconnect().remove()` trước khi công bố online; mất kết nối giải phóng slot ở phía RTDB. Khi kết nối bị mất và hồi phục, client phải xin suất lại thay vì dùng suất cũ. Chỉ người đầu hàng thử lại khoảng 25 giây/lần; người chờ không giữ RTDB socket. Hàng chờ có lease khoảng 8 phút, cập nhật 3 phút/lần. Không ghi heartbeat khi đã vào chơi.
- Tách **chat Thế Giới** sang RTDB khi URL đã cấu hình: session `worldChatSessions/{uid}` có dấu thời gian server; chỉ được nghe 40 tin mới từ thời điểm phiên bắt đầu; truyền sự kiện `onChildAdded` thay vì đọc lại toàn bộ 40 tin khi mỗi tin tới. Khi chưa cấu hình RTDB, tiếp tục dùng phiên Firestore cũ.
- Chat Phòng, trạng thái ván, nhạc, vé và tài khoản **vẫn ở Firestore**, vì RTDB Rules không thể kiểm tra quyền thành viên của Firestore trực tiếp. Di chuyển những dữ liệu riêng tư/đối soát này đòi hỏi chuyển hẳn nguồn xác thực quyền hoặc một backend đáng tin cậy.
- XP/xu trong tiến trình ván vốn đã được tính trong máy và cộng tại `handleGameOver`. Bổ sung lệnh flush hồ sơ ngay khi kết toán thay vì ghi cho mỗi thao tác nhỏ. Shop vẫn đồng bộ theo cơ chế 15 giây hoặc khi tab bị ẩn/đăng xuất.

## Hạn mức và điều kiện

- Spark RTDB: 100 kết nối đồng thời, 1GB dữ liệu lưu, 10GB tải xuống/tháng. **Không phải** 100 người chơi cộng một số lượng người đang chờ. Giữ trần 90 giúp có chút dư địa khi kết nối lại. Kết nối ngoài ứng dụng hay nhiều tab vẫn chiếm kết nối.
- Firestore: 50.000 reads, 20.000 writes/ngày trên cơ sở dữ liệu miễn phí. Hàng chờ dùng Firestore reads/writes khi thay đổi/thấy lease; không hoàn toàn miễn phí. Vì trạng thái ván vẫn là Firestore, ví dụ 90 người × 90 số ≈ **8.100 reads/ván**, chưa tính nguồn dữ liệu khác. Không cam kết 5.000–10.000 lượt chơi mỗi ngày.
- Cloud Functions Firebase hiện yêu cầu Blaze để triển khai. Bản này **không cần Functions cho hàng chờ/hiện diện RTDB**.
- **Không bảo đảm hàng chờ FIFO tuyệt đối chống người dùng sửa JS**: máy chủ RTDB áp trần 90 slot; nhưng quy tắc tham gia *phòng Firestore* chưa xác minh slot RTDB. Để bảo vệ khỏi client cố tình vượt UI, cần backend hoặc thiết kế lại quy tắc truy cập cùng một DB. Không nên quảng cáo là hệ thống an ninh hoàn chỉnh.
- Firestore queue có thể chứa bản ghi cũ nếu người dùng đóng tab đột ngột, nhưng giao diện lọc bản ghi không được làm mới trong 8 phút. Tài liệu cũ vẫn tồn tại trong Firestore, cần có chính sách dọn dữ liệu định kỳ an toàn trước khi khai thác quy mô lớn.
- RTDB chat chưa có dọn tin cũ trên server và chống spam ở mức server. Quota RTDB lưu trữ có thể tăng theo thời gian. Quy trình dọn dữ liệu cần được triển khai trước vận hành lâu dài.
- Phải tạo RTDB mới trong `loto-83a1a`, triển khai `database.rules.json` + `firestore.rules`, bổ sung URL vào biến môi trường Render/Vercel. Nếu không có URL, tất cả tính năng cũ vẫn chạy trên Firestore.

## Hướng dẫn bật (không lộ kỹ thuật cho người chơi)

1. Firebase Console → chọn `loto-83a1a` → Build → Realtime Database → Create Database → chọn vùng gần người dùng, chế độ **Locked**.
2. Sao chép URL đầy đủ từ tab **Data**, ví dụ `https://...firebasedatabase.app` (không tự dựng URL).
3. Giải nén source và chạy `DEPLOY_SPARK_REALTIME_WINDOWS.cmd` bằng tài khoản quản trị. Gói này triển khai Firestore Rules, indexes và RTDB Rules. Không bật quyền công khai.
4. Trong Render/Vercel Environment, đặt `VITE_FIREBASE_DATABASE_URL=<URL lấy từ Console>`, giữ nguyên 6 biến Firebase của dự án `loto-83a1a`. Redeploy website.
5. Kiểm thử 2 thiết bị: mở chat thế giới (không thấy tin cũ), gửi và nhận emoji, bắt đầu game ở 2 trình duyệt, xếp hàng khi trần 90 slot và thử tắt tab để kiểm tra onDisconnect; quan sát Usage RTDB và Firestore.

## Những gì chưa được kiểm thử/triển khai trên đám mây

Không có quyền truy cập Firebase Console của bạn, không có RTDB URL, không có credential triển khai. Đã kiểm tra mã nguồn offline, chưa xác minh Rules bằng Emulator hoặc toàn bộ luồng với người dùng thật. Không thể khẳng định hàng chờ/nhạc/chat toàn hệ thống hoàn toàn hoạt động cho đến khi triển khai và test.

Tài liệu Firebase: https://firebase.google.com/pricing , https://firebase.google.com/docs/database/web/offline-capabilities , https://firebase.google.com/docs/database/security , https://firebase.google.com/docs/functions

## Cảnh báo vận hành

- RTDB Rules mới dành cho database RTDB riêng của ứng dụng. Nếu RTDB đang chứa dữ liệu của ứng dụng khác, triển khai tập Rules này sẽ thay thế Rules cũ. Hãy xem lại trước khi deploy.
- Người dùng mở nhiều tab có thể tiêu thụ nhiều slot. Giới hạn 90 chủ yếu nhằm dự phòng giới hạn 100 kết nối Spark, không phải cam kết xử lý 90 người với mọi loại tải.
- Phiên Chat Thế Giới theo UID hiện chưa hỗ trợ độc lập lịch sử trên hai tab cùng tài khoản; tab thứ hai mở phiên có thể làm thay đổi mốc đọc của tab thứ nhất.
- Đăng nhập/đăng xuất, mua vật phẩm, phát thưởng vẫn cần máy chủ đáng tin cậy để chống gian lận; giới hạn số lượng RTDB không thay thế quyền truy cập Firestore.
