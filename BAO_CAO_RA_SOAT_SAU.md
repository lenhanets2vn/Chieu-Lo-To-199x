# BÁO CÁO RÀ SOÁT SÂU — Lô Tô Hội Chợ 199x

**Phạm vi:** mã nguồn người dùng đính kèm và hai yêu cầu thay đổi UI/UX + Firebase/cloud multiplayer. **Nguồn thật đã chỉnh**, không chỉ ảnh mockup. Rà soát tĩnh; không chứng nhận build hoặc production.

## A. Các lỗi / lệch yêu cầu đã sửa trong source

| Ưu tiên | Phát hiện trên mã nguồn | Cách xử lý |
|---|---|---|
| P0 | Thiếu dấu phẩy trong `UNLOCKABLE_CATALOG`, lỗi cú pháp nghiêm trọng | Sửa danh mục; parser đã xác nhận cú pháp hợp lệ |
| P0 | Firebase thất bại thì sinh phòng giả lập để người chơi tưởng là phòng online | Bỏ fallback phòng giả; lỗi cloud được hiển thị |
| P0 | Join room dùng `getDoc` rồi cập nhật array mù, làm mất thành viên khi hai người cùng vào | Dùng Firestore transaction |
| P0 | Đăng nhập có thể gắn dữ liệu khách vào UID tài khoản khác | Nạp đúng `users/{uid}`, profile mới tạo mặc định riêng; sync kiểm tra UID |
| P0 | Firestore Rules cho phép các thành viên can thiệp quá rộng vào danh sách phòng | Giới hạn thêm thành viên do chính mình, tách members documents và chỉ tự sửa tài liệu mình; host giữ quyền quản lý |
| P0 | Phòng riêng giao diện có mật khẩu nhưng không được kiểm tra an toàn | Bỏ mật khẩu giả, dùng mã mời dài và ghi rõ giới hạn; không phát mã phòng riêng lên chat thế giới |
| P0 | Chơi online chỉ có room ID; chủ phòng không đồng bộ mỗi số đã hò | Tách `rooms/{room}/state/current`, host cập nhật khi hò; khách subscribe nhận số và đánh dấu vé |
| P0 | KINH do mỗi máy tự công nhận, không báo chủ phòng | Ghi claim theo sự kiện; host đối chiếu với vé thành viên và lịch sử đã hò |
| P1 | Khi đổi tab chat, các listener phòng/người chơi/game liên tục bị tháo và tạo lại | Tách listener theo vòng đời phòng và listener chat theo tab |
| P1 | Chat thế giới subscribe ngay cả khi không xem | Chỉ subscribe khi hiện chat, thêm giao diện xem chat từ menu |
| P1 | Dòng thời gian audio gây React re-render dù đã ẩn | Bỏ state cập nhật mỗi nhịp phát audio |
| P1 | Điều chỉnh volume/mute, thanh nhạc và nhiều nút audio lặp | Chuyển volume/mute vào nút bánh răng; một sân khấu âm nhạc 2 loa + 5 đường khuông, nốt động + spectrum |
| P1 | Cho phép chọn 5 bộ vé trái yêu cầu | Ép một bộ duy nhất gồm 5 số; 30s chốt vé |
| P1 | Vòng quay có quay thử, giới hạn dựa vào localStorage/thiết bị | Bỏ quay thử, thêm transaction `spinClaims` trên Firestore theo ngày và trạng thái chặn |
| P1 | Dùng vòng quay khiến bộ đếm `totalGames` tăng | Không coi vòng quay là trận đấu |
| P1 | Vật phẩm có giá vẫn tự mở khi lên cấp, làm mất ý nghĩa Shop | Chỉ tự mở vật phẩm miễn phí; hàng có giá vẫn phải mua |
| P1 | Tab Shop có mã sao lưu base64 tự nhận “mã bảo mật” dễ sửa xu | Bỏ form nhập mã từ UI; dùng đăng nhập Firebase cho tiến trình |
| P1 | Đăng nhập/đổi tài khoản có thể bỏ pending write | Flush trước chuyển tài khoản và khi ẩn tab, đồng thời chặn sync sai UID |
| P1 | Chủ phòng bắt đầu khi người chơi chưa chọn xong vé | Kiểm tra tất cả member có vé một bộ trước khi bắt đầu |
| P2 | Giao diện vé và lịch sử số ít giống mẫu người dùng | Đổi chip tròn đỏ/kem/xanh, hàng 5 số, bảng “CÁC SỐ ĐÃ RA”, vé có ribbon màu xanh |
| P2 | Shop thiếu vật phẩm rất hiếm | Bổ sung vật phẩm hiếm 250.000 / 1.000.000 / 5.000.000 xu |
| P2 | Tham gia phòng qua link khi Auth chưa xong gây lỗi | Chờ UID và hồ sơ Cloud nạp xong trước khi xử lý mã mời |
| P2 | Lượt gửi KINH bị click nhiều lần | Chặn gửi yêu cầu trùng trong cùng ván |
| P2 | VIP effect chưa mua vẫn có thể nhấn gửi | Khóa hành động VIP chưa sở hữu trong giao diện; server vẫn cần xác minh quyền |

## B. Các việc chưa khớp / không nên nhận là đã xong

- **Mic trực tuyến:** chưa có WebRTC/STUN/TURN, nút mic giả đã được vô hiệu hóa.
- **Password room:** phòng riêng = mã mời dài, KHÔNG phải xác minh mật khẩu.
- **Thưởng / chi tiêu / giao dịch:** vẫn client-controlled, **không chống gian lận**. Quyền cập nhật hồ sơ chính chủ không đồng nghĩa ngăn tự cộng xu.
- **Khách thắng KINH trong phòng:** host nhận xét duyệt KINH và cập nhật kết quả, nhưng thưởng/xu cho guest chưa có Cloud Functions cấp phát chính thức.
- **Vòng quay một lần/ngày:** Firestore transaction chặn trùng cùng khóa ngày; ngày và thưởng vẫn do client điều phối. Có thể đổi múi giờ/chỉnh client để lách khi chưa có server authority.
- **Phòng chơi:** còn thiếu rời phòng sạch metadata, host disconnect/reconnect, chuyển quyền, xoá phòng không dùng, timeout user rời phiên.
- **Chat:** cần rate-limit thực sự, quản trị nội dung, TTL/pruning.
- **Cloud xác thực:** chưa đăng nhập Firebase Console/triển khai rules, chưa xác nhận database ID tồn tại, Firebase Auth providers đã mở hoặc hosting domain hợp lệ.
- **Leaderboard:** hiện vẫn có dữ liệu mô phỏng, chưa phải xếp hạng toàn cầu dựa trên giao dịch kết quả đáng tin.
- **Full build / chạy hai trình duyệt:** chưa thực hiện; TypeScript parsing là kiểm tra cú pháp chứ không chứng nhận type-check hoặc runtime.

## C. Đề xuất kỹ thuật cho phát hành online thực sự

1. Cloud Functions + App Check: server nhận lệnh quay/nhận thưởng/mua đồ, kiểm tra thời gian server, quyền và cập nhật tài sản atomically.
2. Cloud Functions hoặc dịch vụ game relay: trạng thái ván, xác nhận KINH, tổng kết trận, chống thao túng client.
3. WebRTC: signaling + ICE, STUN/TURN, push-to-talk; không gửi raw mic qua Firestore.
4. Firestore: chỉ listener 2 loại chat khi mở, 1 doc state ván đang chơi, 1 listener member khi ở phòng; dọn TTL theo vòng đời; index theo các query thật.
5. Server validation phòng riêng nếu cần mật khẩu: lưu **hash mật khẩu ở backend**, xác thực qua function, phát token thành viên/claim; không lưu password trần vào Firestore.
6. Thiết lập giới hạn chi phí và cảnh báo usage, audit Security Rules Emulator và thử nghiệm mạng mobile trước public release.

## D. Trạng thái kiểm tra

- Các file mã TS/TSX được phân tích syntax, không có lỗi parser.
- Không có dependency node_modules đầy đủ để xác nhận `npm run build`/`tsc --noEmit` thành công.
- Không thể truy cập Firebase Console và triển khai Rules hoặc Hosting ở đây; file ZIP là mã nguồn, chưa phải game đang chạy online được xác minh.
