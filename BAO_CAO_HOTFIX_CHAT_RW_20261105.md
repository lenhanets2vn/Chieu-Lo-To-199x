# HOTFIX Chat Thế giới và chi phí Firestore – 05/11/2026

## Lỗi đã tìm thấy trong bản Spark RTDB 90-slot

1. `startOnlineAdmission` chạy **tự động ngay sau khi đăng nhập** nếu có `VITE_FIREBASE_DATABASE_URL`. Nó ghi `online_waiting/{uid}`, mở listener query đến **50 tài liệu** và ghi cập nhật `lastSeen` mỗi 3 phút cho người chờ; leader kiểm tra suất mỗi 25 giây. Nhiều người đồng thời có thể khuếch đại document reads. Điều này không liên quan trực tiếp đến gameplay OneDoc; nó được thêm khi tích hợp hàng chờ.
2. `goOffline(rtdb)` trong hàm admission tác động đến **cả kết nối Realtime Database**, nên có thể làm Chat Thế giới mất kết nối. Chat và hàng chờ dùng chung `getDatabase`.
3. Chat Thế giới trước đó không có fallback khi RTDB đã cấu hình nhưng không thể đọc (thiếu Rules, sai URL, quyền truy cập hoặc mất socket). Giao diện chỉ hiển thị “Không thể tải tin nhắn”.
4. Chưa có dữ liệu đo Firebase Usage đủ để kết luận phần nào chiếm bao nhiêu lượt. Firestore vẫn dùng cho gameplay, vé, chat phòng và hồ sơ.

## Thay đổi đã thực hiện

- **Công tắc an toàn** `VITE_ENABLE_SPARK_ADMISSION=false` mặc định. Khi tắt, không mở listener hoặc ghi vào `online_waiting` từ tính năng xếp hàng. Chỉ bật lại sau khi kiểm thử tải trên Firebase thật.
- **Lưu ý lớn:** khi tắt công tắc, giới hạn 90 slot và hàng chờ **KHÔNG được thực thi**. Firebase Spark vẫn có giới hạn kết nối RTDB của nhà cung cấp. Nếu phục vụ tải lớn, cần một phương án admission server-side hoặc RTDB queue tối ưu riêng và kiểm thử.
- Chat Thế giới ưu tiên RTDB; trong phiên gặp lỗi đọc, chuyển **một lần** sang Firestore và **không chạy song song hai listener**.
- Khi chuyển Firestore, tạo mốc thời gian phiên Firestore một lần, ghi nhớ giữa các lần đóng/mở kênh; truy vấn chỉ 40 tin mới nhất sau mốc phiên. Không tải lịch sử trước khi online.
- Khi tắt chat và không bật tính năng admission, ngắt kết nối RTDB để tránh giữ socket khi idle; khi mở lại, kết nối trở lại.
- Nếu bật tính năng admission, không gọi `goOffline()` khi Chat Thế giới đang lắng nghe (khắc phục xung đột chung connection, không phải đảm bảo toàn bộ hàng chờ tối ưu).
- Giao diện hiển thị thông báo lỗi rõ ràng hơn và có nút “Thử kết nối lại”.
- Không thay đổi Security Rules và không tạo heartbeat mới.

## Hướng dẫn deploy

1. Upload Full Source ZIP vào GitHub, redeploy Render/Vercel.
2. Biến môi trường của website: `VITE_FIREBASE_DATABASE_URL` phải là URL RTDB thật trong Firebase Console. **Chỉ thêm** `VITE_ENABLE_SPARK_ADMISSION=true` nếu chủ động muốn bật lại cơ chế hàng chờ cũ sau kiểm thử; để trống hoặc `false` giúp tránh spike từ hàng chờ.
3. Trong Firebase Console, kiểm tra RTDB Rules đã triển khai thành công và cho phép `worldChatSessions/{uid}` cùng truy vấn có giới hạn của `worldMessages`. Nếu RTDB chưa truy cập được, app có Firestore fallback nhưng Firestore Rules cho `chat_sessions` và `world_messages` cũng phải được triển khai.
4. Kiểm tra 2 thiết bị thật: đăng nhập 2 tài khoản, mở Chat Thế giới, gửi tin từ máy A và xem máy B nhận tin ngay. Đóng kênh chat và quan sát Usage.
5. Đo Firestore Usage *trước/sau* trên cùng số người chơi và cùng số phút; ghi riêng Reads, Writes, RTDB bandwidth, reconnects. Đừng cộng lượt RTDB vào Firestore Reads; cách tính khác nhau.

## Kiểm thử thực tế chưa được xác nhận

- Không có quyền truy cập tài khoản Firebase của bạn để kiểm tra RTDB Rules đang triển khai, usage hay xác nhận chat hai máy.
- Không build production vì môi trường không có dependencies dự án. 51 TS/TSX đã parse không có lỗi cú pháp; test game core và kiểm tra dự án đạt.

## Rủi ro còn tồn tại

- Gameplay vẫn ở Firestore OneDoc; mỗi sự kiện số/nhạc là một write và mỗi thành viên đang theo dõi nhận read. Chuyển riêng Chat Thế giới sang RTDB không giảm số lần đọc gameplay.
- Firestore fallback khi RTDB không hoạt động vẫn tạo Reads/Writes, nhưng giới hạn một session và chỉ khi người chơi mở chat.
- Hàng chờ/giới hạn 90 kết nối đang tắt mặc định là **phương án ngắt chi phí tạm thời**, không phải giải pháp admission hoàn chỉnh cho 100+ người chơi.
- Để đảm bảo cả tải lớn và giới hạn Spark, cần xây dựng lại hàng chờ theo cơ chế server-authoritative và kiểm thử security rules, kết nối, đo usage thực tế.
