# Firebase & Firestore — cấu hình dùng cho Lô Tô Hội Chợ 199x

## Hiện trạng

- Dự án Firebase khai báo trong `firebase-applet-config.json`: `leafy-concept-qt8c4`.
- Ứng dụng truy cập **Firestore database đặt tên riêng**: `ai-studio-lthich199xlthoin-2cb02316-a219-47a4-9acb-21d18684e2a5`, không phải `(default)`.
- Thư mục mã nguồn đã có `firebase.json`, `.firebaserc`, `firestore.rules` và `firestore.indexes.json` cho CSDL đó.
- Cấu hình trong mã nguồn không chứng minh rằng dự án Firestore/Authentication/Hosting ngoài đời đang hoạt động. Trong quá trình rà soát không đăng nhập được Firebase Console và không triển khai production.

## Triển khai thủ công bằng tài khoản có quyền

1. Firebase Console → chọn dự án `leafy-concept-qt8c4`. Kiểm tra tên database Firestore đặt riêng chính xác như trên và khả năng chỉnh sửa security rules của database này. Nếu database không tồn tại, không triển khai lên database khác một cách im lặng.
2. Authentication → Sign-in method → kích hoạt **Email/Password** và **Anonymous**. Bổ sung domain web Hosting/HTTPS vào Authorized domains.
3. Bật Firestore API và Hosting theo hướng dẫn Firebase Console; kiểm tra hạn mức/billing.
4. Tại thư mục mã nguồn, dùng Node.js tương thích với Vite 8, cài các thư viện và build:

   ```bash
   npm install
   npm run build
   ```

5. Đăng nhập Firebase CLI bằng tài khoản được cấp quyền:

   ```bash
   npx firebase login
   npx firebase deploy --only firestore,hosting --project leafy-concept-qt8c4
   ```

6. Kiểm tra thực tế bằng **hai tài khoản khác nhau, hai trình duyệt/thiết bị khác nhau** trước khi công khai link. Nếu triển khai rules báo lỗi, dừng và kiểm tra cú pháp/permission, **không bật rules công khai** để né lỗi.

## Hành vi dữ liệu đã được sửa trong source

- `/users/{uid}`: hồ sơ thuộc UID đã đăng nhập, không lưu mật khẩu; gom lượt cập nhật thông thường 15 giây và flush khi ẩn tab.
- `/users/{uid}/spinClaims/{YYYY-MM-DD}`: một tài liệu đặt lượt quay dùng transaction tạo một lần/khóa theo ngày (ngày lấy từ thiết bị, chưa phải giới hạn theo thời gian máy chủ xác thực toàn diện).
- `/rooms/{code}`: thông tin phòng; chỉ mở listener danh sách phòng công khai khi mở menu phòng.
- `/rooms/{code}/members/{uid}`: vé/ID thành viên, tài khoản chỉ sửa tài liệu thành viên của chính mình.
- `/rooms/{code}/state/current`: trạng thái ván và lịch sử hò, chỉ chủ phòng được ghi; mỗi lần hò mới ghi một sự kiện.
- `/rooms/{code}/claims/{docId}`: yêu cầu KINH từ người chơi; chủ phòng đối chiếu vé với số đã công bố.
- `/rooms/{code}/messages` và `/world_messages`: chỉ realtime 40 tin gần nhất khi xem đúng kênh chat.
- `/rooms/{code}/reactions`: nhận biểu cảm khi đang ở ván; tối đa 10 mục gần nhất.

## Những điều KHÔNG được coi là đã hoàn thành

1. **Mic / voice online** chưa có. Cần thiết kế WebRTC signaling, kết nối peer, STUN/TURN, quyền mic, trạng thái kết nối và cơ chế băng thông. Firestore không được dùng để lưu các mẫu âm thanh liên tục.
2. **Quyền riêng tư phòng bằng mật khẩu** chưa có. Phòng riêng hiện chỉ dùng mã mời dài khó đoán. Không tự nhận là phòng có mật khẩu. Không chia sẻ mã mời riêng lên chat thế giới.
3. **An toàn chống gian lận** chưa có nguồn xác thực phía server cho tiền xu, vật phẩm, điểm, thưởng và kết quả trận. Firestore Rules hiện cho tài khoản chỉnh hồ sơ của chính mình; điều đó không đủ chống việc tự tăng xu từ ứng dụng giả mạo. Cần Cloud Functions, trusted transactions, và có thể App Check.
4. **Giới hạn vòng quay** có transaction để ngăn cùng một ngày-key được tạo nhiều lần. Nhưng ngày-key hiện lấy từ thiết bị và client vẫn quyết định phần thưởng; phải chuyển việc kiểm tra ngày và phát thưởng sang Cloud Functions để thực sự chống đổi múi giờ/thiết bị/công cụ lập trình.
5. **Thưởng người chơi thắng online** chưa được cấp bằng giao dịch server-authoritative; chỉ đồng bộ số/KINH qua chủ phòng. Không quảng cáo hệ thống tiền xu trực tuyến là an toàn.
6. **Chủ phòng bị ngắt kết nối**, chuyển quyền chủ phòng, dọn thành viên bỏ đi, dọn phòng/chat cũ theo TTL và tiến trình đa thiết bị xung đột chưa được giải quyết hoàn chỉnh.
7. **Chống spam/moderation** mới có lọc phía frontend và giới hạn kích thước tin nhắn trong Rules; chưa có server rate-limit, quản trị viên xóa/ẩn tin, báo cáo vi phạm.
8. **Tài khoản sử dụng tên đăng nhập đổi thành email nội bộ giả định**, vì vậy chưa có khôi phục mật khẩu qua email thật. Muốn dùng công khai cần email hợp lệ hoặc dịch vụ ánh xạ username an toàn ở server.
9. **Không build/full QA hoặc kiểm thử Firebase live** trong lượt làm này. Chỉ rà soát source và kiểm tra cú pháp các TS/TSX bằng trình phân tích TypeScript. Các quyền truy cập bên ngoài không thể xác nhận.

## Chi phí và độ trễ

- Không polling liên tục danh sách phòng, game state và chat; các listener được giới hạn theo màn hình.
- Chuyển qua lại tab chat **không** tự đăng ký lại listener thành viên/phòng/trạng thái game.
- Thư viện chat mỗi lần mở kênh tải tối đa 40 tin; lần đầu đăng ký/onSnapshot lại vẫn có thể phát sinh tối đa 40 document reads, và Firestore Rules còn có dependent reads.
- Vòng quay mỗi lượt tối đa một giao dịch đọc+ghi claim, sau đó đồng bộ hồ sơ theo batch.
- Không có số đo latency/chi phí thực tế vì chưa triển khai và chưa tải thật.
