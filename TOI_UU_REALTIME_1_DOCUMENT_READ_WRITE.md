# Tối ưu Realtime Firestore — 1 tài liệu trạng thái ván chơi

Dự án: `loto-83a1a` · Firestore database: `(default)`

## Thay đổi thực tế trong source

- Một listener `onSnapshot(rooms/{roomId})` nhận toàn bộ dữ liệu công khai cần thiết trong phòng: trạng thái ván, số hiện tại, lịch sử số, countdown, bài nhạc, người thắng, HOST, số thành viên và danh sách tên/nhân vật dạng rút gọn.
- Không dùng listener `rooms/{roomId}/state/current` cũ. Mỗi sự kiện bắt đầu nhạc, công bố số hoặc đổi trạng thái dùng **một write** vào `rooms/{roomId}`. Không ghi số giây countdown, tiến độ âm thanh hoặc heartbeat định kỳ.
- Một tài liệu `rooms/{roomId}/members/{uid}` chứa vé và trạng thái riêng của người chơi; chỉ người chơi được cập nhật vé của mình. Người bình thường chỉ lắng nghe tài liệu thành viên của mình. HOST chỉ đăng ký listener danh sách đầy đủ khi mở bảng Người chơi; khi có KINH, HOST đọc *riêng* vé người báo KINH.
- Gia nhập và rời phòng thay đổi thông tin phòng + thành viên bằng transaction; chuyển HOST không xóa lịch sử số. Phòng đủ 100 người từ chối người thứ 101.
- Danh sách phòng chờ chỉ theo dõi **phòng Public, WAITING, liveVersion=2**, hạn chế việc cập nhật số đang chạy làm phát sinh đọc ở màn hình danh sách.
- Firestore indexes mới có composite index cho danh sách phòng; loại bỏ index không cần thiết ở các trường liên tục thay đổi như `calledHistory` và `roster`.
- Chat Thế giới và Chat Phòng tách riêng, mỗi kênh tối đa **40 tin nhắn mới**, listener chỉ hoạt động khi đang mở kênh. Khi quay lại chat trong cùng phiên, truy vấn theo mốc mới nhất để không tải lại toàn bộ lịch sử đã xem. Mốc phiên chat Thế giới chỉ được tạo khi mở chat, không phải lúc đăng nhập.
- Không lưu ảnh avatar dạng data URL vào từng tin nhắn (tránh lặp dữ liệu lớn).

## Vì sao không gom 40 tin chat vào cùng một tài liệu?

Nếu nhiều người gửi cùng lúc, tất cả cùng sửa một document sẽ phát sinh tranh chấp giao dịch; việc tải document cho một người mới cũng có thể tiết lộ nội dung tin từ trước khi vào phiên, bất chấp việc React chỉ ẩn chúng. Ngoài ra Firestore giới hạn dung lượng của một document. Vì thế chat giữ tài liệu **theo từng tin** để có quyền truy cập theo thời điểm trên máy chủ, nhưng chỉ một listener cho kênh đang xem.

## Lượt đọc/ghi và chi phí

- 90 lần cập nhật số nghĩa là **khoảng 91 lượt đọc** trên mỗi người luôn duy trì listener (1 lượt tải đầu + 90 lượt thay đổi), không phải 5–10.
- Nếu game đồng bộ thêm một sự kiện nhạc riêng trước mỗi số thì **có thể khoảng 181 lượt đọc/người** (1 + 90 số + 90 nhạc). Có thể nhiều hơn nếu đổi HOST, mở màn, kết thúc, tái kết nối, giao dịch thành viên, yêu cầu Rules.
- Với 100 người, khoảng **9.100–18.100 lượt đọc** cho một ván tùy số sự kiện riêng, *chỉ tính listener room document*.
- Mỗi lần chat người chơi nhìn thấy 1 message mới trong listener tương ứng là 1 lượt đọc tài liệu tin; không thể cam kết 5–10 lượt đọc cho một kênh có nhiều tin.
- Khi tab ẩn, listener gameplay vẫn mở (để giữ số), còn chat và danh sách phòng không cần thiết ngắt. Khi máy mất mạng/khôi phục, Firestore có thể tính lượt đọc lại.
- Một doc 100 thành viên giúp giảm số lượng listener nhưng vẫn bị tải lại toàn bộ document cho mỗi sự kiện cập nhật; dữ liệu truyền qua mạng có thể tăng khi roster lớn. Đây không phải lựa chọn tối ưu vô điều kiện cho mọi tải.
- **Không cam kết 5.000–10.000 lượt/ngày trên hạn mức miễn phí**. Thực tế cần đo Usage trên Firebase Console theo phòng và số sự kiện.

## Triển khai

1. Triển khai frontend mới cùng phiên bản này lên GitHub/Render/Vercel, rà soát `VITE_FIREBASE_*` trỏ về `loto-83a1a`, database `(default)`.
2. Chạy `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` hoặc lệnh `firebase deploy --only firestore --project loto-83a1a` **từ thư mục Full Source**, gồm cả Security Rules và Indexes.
3. Các phòng tạo bởi code đời cũ không tương thích cơ chế `liveVersion=2`; cần **đóng và tạo phòng mới** sau khi triển khai. Không trộn client cũ và mới trong một phòng.
4. Nếu cần xóa vật lý chat khi xóa phòng, triển khai Cloud Function riêng bằng `DEPLOY_CHAT_CLOUD_WINDOWS.cmd`; function có thể cần gói trả phí/quyền triển khai. Tắt trình duyệt đột ngột vẫn cần presence phía máy chủ để tự đóng phòng thực sự.
5. Test thực tế tối thiểu 2 trình duyệt riêng biệt: tạo/vào/rời phòng, 10 giây, mỗi số, nhạc, KINH, đổi HOST, chat, đủ 100 người và Rules mới. Theo dõi bảng Usage của Firebase sau thử nghiệm.

## Mức độ kiểm thử

Đã đạt mô phỏng Firestore giả lập: một listener gameplay, tạo phòng/đổi HOST, giới hạn 100, một write cho mỗi sự kiện, KINH một document định danh/phiên; kiểm tra logic quay 90 số, lọc chat, định dạng project. Không có Firebase Emulator hoặc môi trường live có tài khoản quản trị nên **chưa xác minh Rules trên Firebase thật, chưa đo billed reads/writes, chưa build production** trong phiên chỉnh sửa này.

## Bảo mật cần làm tiếp

- Firestore Rules xác thực người ghi vé, tạo phòng, vào phòng, gửi chat và KINH; tuy nhiên tiền xu/vật phẩm/phần thưởng ở client cần logic server-authoritative để chống giả mạo.
- Hiện chỉ xử lý chuyển HOST khi rời phòng có chủ ý. Trường hợp HOST đóng tab hoặc mất kết nối đột ngột cần presence/lease phía máy chủ và thu hồi thành viên lỗi thời.
- Tài liệu công khai `rooms/{roomId}` chứa tên/nhân vật người chơi, **không chứa vé của 100 người**. Người chơi thường không được đọc toàn bộ tài liệu thành viên.
