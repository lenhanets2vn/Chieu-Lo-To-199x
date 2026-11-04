# LÔ TÔ HỘI CHỢ 199x — Rà soát Realtime, Read/Write, Tài khoản & Phòng online

## Các thay đổi được chỉnh trực tiếp trong source

1. **Tài khoản / Đổi tên**: đổi từ gọi lại AuthModal sang AccountModal. Hội viên đã đăng nhập xem thông tin hiện có, đổi nickname, đổi mật khẩu bằng xác thực lại mật khẩu hiện tại và đăng xuất. Mật khẩu do Firebase Authentication giữ, không ghi vào Firestore. Đổi nickname chỉ ghi trực tiếp `users/{uid}` một lần, không tạo thêm bản ghi đồng bộ 15 giây; khi trong phòng, cập nhật tên trên member doc (chỉ khi cần).
2. **Tạo phòng công khai và riêng**: một atomic `writeBatch` tạo metadata, chủ phòng và state cùng lúc (3 write). Không còn phòng tồn tại nửa chừng khi write thứ hai/thứ ba bị từ chối.
3. **Vào phòng công khai và riêng**: dùng `runTransaction` đọc metadata, trạng thái, member; ghi member và `memberCount` nguyên tử (2 write cho người mới; 0 write khi đã tham gia). Rules cho phép người dùng tự đọc đúng member document của mình trước khi nhập phòng; không đòi trùng khớp cả object PlayerState như phiên bản cũ. Dùng mã phòng công khai/ngẫu nhiên hoặc mã mời riêng, chưa hỗ trợ mật khẩu phòng phía máy chủ.
4. **Rời phòng**: giao dịch xoá member và giảm `memberCount`; chủ phòng rời thì đóng room/state. Các subcollection lịch sử khác không tự biến mất khi xoá tài liệu cha — cần cơ chế cleanup phía server để xử lý dài hạn.
5. **Thành viên 100 người**: lưu mỗi thành viên vào `rooms/{roomId}/members/{uid}`, giữ `memberCount` nhỏ trên room. Không cập nhật cả mảng tối đa 100 player profiles mỗi khi có người mới. Snapshot members cập nhật theo sự kiện, giới hạn 100.
6. **Giữ danh sách người khi chủ phòng bắt đầu vòng mới**: nguồn thành viên lấy từ listener thật, không giữ `room.players` lỗi thời và không xoá state roster khi reset ván.
7. **Trạng thái tab ẩn**: dùng `visibilitychange` có state React thực. Tắt listener public lobby, world chat, room chat và reaction khi tab bị ẩn. Giữ ba listener tối thiểu (room metadata/members/game-state) khi đang trong phòng để số hò và thành viên vẫn cập nhật ngay, kể cả tab treo. KINH claims dành cho host vẫn theo sự kiện, không polling.
8. **Hạn chế đọc lại**: listener trạng thái game không reconnect khi đổi nickname; ẩn chat tự unsubscribe; mở lại tab đăng ký listener cần thiết. Lưu tiến trình nhỏ được gộp trong 15 giây và flush khi tab ẩn nếu có thay đổi.
9. **Thông báo lỗi phòng**: cửa sổ không tự đóng khi join lỗi; thông báo hiển thị ngay. Lời mời qua URL/chat có xử lý lỗi. Không giả lập phòng online khi server từ chối.

## Mức sử dụng Firestore theo hành động (ước lượng logic, KHÔNG phải số thực tế đã đo)

| Hành động | Các thao tác phát sinh từ frontend |
|---|---|
| Treo ở menu không mở chat/phòng | 0 Firestore onSnapshot liên quan phòng/chat; chỉ Auth phục hồi phiên và tải profile khi mở phiên |
| Mở danh sách phòng Public | 1 listener tối đa 20 room docs; không polling; đọc lại nếu reconnect |
| Tạo phòng | Batch ghi 3 docs: room, host member, state |
| Vào phòng mới | Transaction đọc room/state/member; ghi 2 docs: member và memberCount |
| Vào lại phòng đã có member | Transaction đọc, không ghi memberCount hoặc member |
| Treo trong ván | 3 listener room/member/state; không có write định kỳ; đọc khi một sự kiện xảy ra |
| Mở chat | 1 listener 40 tin gần nhất; read phát sinh thêm theo thay đổi và lần reconnect |
| Ẩn tab | Ngắt public lobby, chat, reaction; giữ cập nhật ván chơi |
| Công bố một số | 1 write state/current khi chủ phòng công bố số; các listener nhận thay đổi |
| Thay đổi hồ sơ | Ghi theo sự kiện, đồng bộ thường gộp tối đa mỗi 15 giây |

**Lưu ý về billing:** Firestore có thể tính thêm lượt đọc do Security Rules tham chiếu document, truy vấn ban đầu và tái kết nối. Mở lại listener chat 40 tin có thể tạo lại lượt đọc, nên chỉ mở listener khi thật sự xem chat.

## Hạn chế/chưa đủ điều kiện kết luận production

- **CHƯA triển khai rules lên Firebase thật**: cần chạy `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` bằng tài khoản dự án. Deploy Render chỉ đưa source frontend lên web; không triển khai Firestore Rules.
- Chưa kiểm thử hai thiết bị, build production hoặc đo quota thực tế (môi trường này không truy cập Firebase production và không tải được npm dependencies).
- Nếu tắt trình duyệt đột ngột trước thao tác rời phòng, `memberCount` có thể giữ suất chơi. Muốn dọn chính xác khi mất kết nối cần presence/onDisconnect ở RTDB hoặc backend TTL/cleanup, không nên thay bằng heartbeat ghi Firestore vài giây một lần.
- Phòng riêng dùng mã mời dài, **chưa có mật khẩu xác thực phía server**. Mic WebRTC chưa được xây dựng.
- Coins/phần thưởng/vật phẩm vẫn do client có thể cập nhật; phải có Cloud Functions hay backend đáng tin cậy để ngăn giả mạo hoặc gian lận.
- Không khẳng định chịu tải 100 người đã được chứng minh; các phòng đông vẫn cần đánh giá tranh chấp document counter và read amplification.

## Triển khai

1. Upload **toàn bộ source** từ ZIP mới lên GitHub, không chỉ README hoặc file ZIP.
2. Build frontend Render Static Site/Vercel như trước; giữ chính xác `VITE_FIRESTORE_DATABASE_ID` của database (default).
3. Trên Windows giải nén source, dùng `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` triển khai `firestore.rules` vào project đúng. File `firebase.json` đã chỉ rõ database (default).
4. Chỉ khi frontend và rules cùng phiên bản mới có thể xác nhận luồng tạo/join; tránh dùng frontend mới với rules cũ.
5. Kiểm tra định kỳ Firebase Console → Firestore → Usage để đo số read/write thực tế theo lượng người chơi.
