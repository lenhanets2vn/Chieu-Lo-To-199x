# Kiểm toán và sửa lỗi Realtime — Lô Tô Hội Chợ 199x

## Thực hiện trong source

1. Từ nút BẮT ĐẦU, HOST ghi `status=COUNTDOWN`, `countdownEndsAt` và `roundId` vào Firestore; cập nhật trạng thái phòng chờ trong cùng batch. Thời gian đếm 10 giây hiển thị theo cùng deadline, không cần ghi mỗi giây. Thành viên chưa chọn tự chốt đủ 5 số khi hết hạn; có xử lý bắt kịp nếu tab bỏ lỡ deadline.
2. HOST duy nhất chọn số và phát nhạc; khi **bắt đầu mỗi bài**, HOST công bố `audioPhase`, `audioTrack`, `audioStartedAt` và `soundpackId`. Các máy khách nhận qua listener và tìm đến vị trí thời gian tương ứng trong tập tin âm thanh, không tự rút số mới.
3. Khi bài nhạc thực sự mở số, HOST ghi `calledHistory` và `currentBallNumber` vào state realtime; mọi máy khách đồng bộ số và tự đánh dấu vé.
4. **KINH:** Người chơi gửi claim 1 lần; HOST đọc claim và kiểm tra đúng bộ 5 số so với lịch sử đã gọi và vé thành viên. Các claim đến ngay lúc đổi HOST được chờ danh sách thành viên nạp xong. HOST công bố `GAME_OVER` và người thắng; máy khác thấy kết quả và hiệu ứng chiến thắng.
5. Xóa nút **Tạm dừng** và **Kết thúc chưa KINH**. `Ván Mới` bị khóa khi đang đếm ngược/phát số. HOST có nút **Rời phòng · chuyển HOST**: giao dịch chuyển quyền cho một thành viên còn lại, trừ một thành viên và xóa thành viên cũ nguyên tử. Người nhận quyền tiếp tục ván, giữ số đã mở; nếu rời giữa bài, bắt đầu một bài tiếp theo.
6. Danh sách thành viên tối đa 100 người: HOST theo dõi toàn bộ để đối soát KINH; khách chỉ theo dõi hồ sơ chính mình, tải danh sách đầy đủ khi mở tab Người chơi. Mặc định mở tab Bảng số để không tải tất cả vé khi mới vào.
7. Việc chốt vé chỉ cập nhật `tickets` và `isReady` ở tài liệu thành viên, không ghi đè toàn bộ hồ sơ, thời điểm tham gia hay quyền HOST. Không ghi lượt âm lượng, tiến độ nhạc, đồng hồ 1 giây, animation 30 ms hoặc các thao tác tab nền vào Firestore. Giữ các listener `rooms/{id}`, `state/current`, own-member cho ván realtime; ngắt chat, hiệu ứng, danh sách chờ khi không xem.
8. Đã sửa config backend cleanup sang `(default)` của project `loto-83a1a`; `DEPLOY_ENV_VALUES.txt` không còn chứa project cũ.

## Ước tính Read/Write (không phải số đo từ Firebase Console)

- **Treo tab trong phòng, không có biến động:** thường **0 writes/phút** do logic ván chơi; không có poll/heartbeat. Listener đang mở không tự tính read mỗi giây nếu không có tài liệu thay đổi, nhưng reconnect, quy tắc truy cập và các tài liệu khác vẫn có thể làm phát sinh reads.
- **Đếm ngược 10 giây:** 1 batch **2 document writes** (state + room status), không có 10 writes.
- **Một số được hò:** thường **2 state writes**: bắt đầu nhạc (để mọi người nghe) và công bố số đã mở. Lượt đầu có thêm 1 room status write. Gần hết số / nhạc kết có thêm sự kiện riêng.
- **Trọn 90 số:** xấp xỉ **180 writes vào state**, cộng một số writes cho bắt đầu, đổi trạng thái, kết thúc; ở phòng 100 thiết bị có thể khoảng **18.000 lượt đọc state** (180 sự kiện x 100 listener), chưa tính tải lần đầu, Rules reads, thành viên, chat, reconnect hoặc tài liệu bị thay đổi khác. Nếu người chơi treo tab không có sự kiện số mới, không xảy ra 180 writes đó.
- **HOST đổi quyền:** 1 query tìm người kế nhiệm (tối đa 5 tài liệu) + 1 transaction đọc/ghi tài liệu phòng/thành viên. Không có kiểm tra lặp trong lúc treo tab.
- **Chat thế giới:** tạo một phiên bằng 1 write + 1 read lúc mở web; không heartbeat. Chat/phản ứng/KINH chỉ ghi khi có sự kiện thực.
- **Ưu tiên tiếp theo khi hoạt động quy mô lớn:** chuyển sự kiện realtime có tần suất cao sang WebSocket/backend có quyền điều phối, vẫn giữ Firestore cho dữ liệu bền vững; 2 writes/số là chi phí có chủ đích để giữ thời điểm phát nhạc và thời điểm mở số tách biệt.

## Kiểm thử và giới hạn

- Đã kiểm tra cú pháp TypeScript/TSX và chạy **test mô phỏng offline** (`tools/test-online-realtime.cjs` và `tools/test-game-core.mjs`): tạo/vào phòng, đếm ngược, sự kiện nhạc, công bố số, chuyển HOST, giữ lịch sử, kết thúc KINH, cấp lại bộ số không trùng.
- Chưa có `node_modules` đầy đủ để chạy `npm run build` (npm offline báo thiếu package cache `@google/genai`). Chưa chạy Firebase Emulator, chưa deploy Rules hoặc kiểm thử 2 thiết bị. Chưa đo Usage thực tế từ dự án Google Cloud.
- Âm thanh Web Audio trên trình duyệt yêu cầu người dùng cho phép; thiết bị khách có nút **Bật nhạc phòng**. Đồng bộ thời gian là gần realtime theo timestamp máy chủ, **không bảo đảm đồng bộ mẫu âm thanh tuyệt đối** giữa các thiết bị/đường truyền.
- Không giải quyết hoàn toàn HOST bị ngắt mạng/đóng tab bất ngờ, tình trạng gian lận từ HOST client, hoặc tiền/xu/phần thưởng do máy chủ xác thực. Cần backend đáng tin cậy nếu phát hành công khai ở quy mô lớn.

## Triển khai

1. Trong Firebase Console dự án `loto-83a1a`, xác nhận Firestore `(default)` và Authentication Email/Password.
2. Chạy `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` để triển khai **Rules mới** vào đúng project.
3. Upload source lên GitHub, redeploy Render/Vercel và kiểm tra cấu hình `VITE_FIREBASE_*` cùng `VITE_FIRESTORE_DATABASE_ID=(default)`.
4. Kiểm thử 2–3 thiết bị: vào cùng phòng 100 chỗ với 2 người; HOST bấm BẮT ĐẦU; hai máy thấy cùng 10 giây, số và nghe cùng bài; một người KINH; HOST rời giữa ván và máy kia được nâng HOST; thử tab nền 10 phút rồi xem Firebase Console → Firestore → Usage.
5. Nếu cần dọn subcollections vật lý sau khi phòng bị xóa: triển khai Cloud Function bằng `DEPLOY_CHAT_CLOUD_WINDOWS.cmd` (yêu cầu quyền Google Cloud và có thể cần billing).
