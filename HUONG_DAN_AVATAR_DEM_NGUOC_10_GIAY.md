# Cập nhật Avatar / Bắt đầu phòng / Đếm ngược 10 giây

- Hồ sơ > Đổi ảnh đại diện: chọn JPG/PNG/WebP <=5 MB, ứng dụng cắt vuông 96 x 96, mã hóa JPEG trước khi ghi vào users/{uid}. Không upload ảnh gốc; chỉ một lần ghi Firestore khi thay đổi ảnh. Avatar lưu vào hồ sơ và dùng tại khu vực người chơi.
- maxPlayers chỉ là sức chứa phòng (2..100); chủ phòng được bấm BẮT ĐẦU khi ván đang WAITING dù chưa đủ người hoặc chưa ai chốt vé.
- Nhấn BẮT ĐẦU bắt đầu countdown 10 giây, public `countdownEndsAt` trong rooms/{id}/state/current (một lần ghi). Mỗi thiết bị đang kết nối tự điền 5 số cho chính mình sau 10 giây nếu chưa chốt vé (một lần ghi thành viên). Người đã chốt không bị ghi đè.
- Hết countdown chủ phòng phát nhạc mở màn và tiến hành kêu số theo luồng hiện có.
- Bắt buộc deploy firestore.rules mới trong Firebase project `loto-83a1a` và deploy frontend mới, đồng thời xác nhận biến môi trường VITE_FIREBASE_* không còn tham chiếu project cũ.
- Giới hạn đã biết: vé tự động của người đã đóng tab / hoàn toàn offline không thể bảo đảm vì xử lý trên client; cần Cloud Function/server-authoritative để bao phủ nhóm này. Khi tab nền bị browser throttling, timer có thể trễ. Đồng hồ giữa thiết bị có thể lệch; bản này dùng countdownEndsAt theo Date.now() của chủ phòng, không phải trusted server clock.
- Đã kiểm tra cú pháp 49 file TypeScript/TSX, nhưng chưa npm build/kiểm thử kết nối thực tế giữa hai thiết bị; không thể coi đây là nghiệm thu production.
