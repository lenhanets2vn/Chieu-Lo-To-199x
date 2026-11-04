# Lô Tô Hội Chợ 199x — Full Source

Ứng dụng React / TypeScript / Vite, Firebase Authentication và Cloud Firestore.

## Tình trạng source hiện tại

- Dự án Firebase: **`loto-83a1a`**, Firestore database **`(default)`**.
- Phòng public/private: sức chứa tối đa 100, **không cần đủ 100 người** để bắt đầu.
- HOST bắt đầu một ván bằng trạng thái COUNTDOWN có deadline dùng chung 10 giây. Người chưa chốt tự chọn một vé 5 số khi hết hạn nếu trình duyệt còn hoạt động.
- HOST công bố trạng thái bài nhạc theo sự kiện, thời điểm bắt đầu và lịch sử số được mở qua Firestore. Người chơi khác theo dõi qua listener, không tự bốc số.
- Khi người chơi KINH, HOST kiểm tra dữ liệu vé và lịch sử số rồi công bố GAME_OVER. Không có nút Tạm dừng hoặc Kết thúc ván trước khi có KINH; 90 số hết thì ván tự kết thúc.
- HOST cố ý rời phòng sẽ **chuyển quyền cho một thành viên khác** trong transaction, giữ phòng và lịch sử gọi số. Đóng tab đột ngột không bảo đảm chuyển HOST.
- Chat Thế giới và chat Phòng tách biệt, giới hạn lịch sử theo thời điểm tham gia; biểu tượng chat được chuyển từ mã gõ sang emoji.
- Avatar thay trong hồ sơ; vật phẩm đã mua có thể trang bị ở Tạp hóa.
- Tối ưu Read/Write: listener trạng thái ván độc lập UI; khi tab nền ngắt listener chat/phản ứng không thiết yếu; khách chỉ nghe tài liệu thành viên của chính mình nếu không mở bảng người chơi. Âm nhạc, animation, giây đếm ngược **không ghi Firestore liên tục**.

Chi tiết kiểm toán và giới hạn: **`BAO_CAO_REALTIME_GAME_READ_WRITE.md`**.

## Khởi chạy

Cần Node.js 22.12+; trong thư mục source chạy:

```bash
npm install
npm run build
npm run dev
```

Kiểm tra nguồn offline không cần Firebase (sau khi cài dependencies):

```bash
node tools/test-game-core.mjs
node tools/test-online-realtime.cjs
```

Để triển khai xem **`DEPLOY_RENDER_VERCEL.md`**, **`CLOUD_SETUP.md`**, **`DEPLOY_ENV_VALUES.txt`**.

**Hai phần bắt buộc cập nhật cùng nhau:** frontend trên Render/Vercel và `firestore.rules` của Firebase project `loto-83a1a`, database `(default)`. Chạy `DEPLOY_FIREBASE_CLOUD_WINDOWS.cmd` bằng tài khoản có quyền Firebase phù hợp. Deploy frontend riêng **không** cập nhật Security Rules.

## Giới hạn cần biết

Các kiểm tra mô phỏng offline không chứng minh được tính đúng đắn của Firebase Rules trong môi trường triển khai hoặc việc phát âm thanh đồng thời trên trình duyệt. Người dùng có thể cần bấm **Bật nhạc phòng** do hạn chế autoplay. Đồng bộ âm thanh là gần realtime, không phải đồng bộ từng mẫu âm thanh. Chuyển HOST tự động khi tab đóng đột ngột, sự hiện diện tin cậy phía backend, tiền xu/phần thưởng chống gian lận và kiểm thử tải 100 người **chưa hoàn tất**.

Không đưa private key, service account JSON, token quản trị vào `VITE_*` hoặc source frontend.

## Vá lỗi RTDB Rules numChildren (05/11/2026)

Phiên bản này yêu cầu bộ Rules cập nhật **cùng phiên bản frontend**. Xem `HUONG_DAN_SUA_LOI_NUMCHILDREN.md`. Chạy `DEPLOY_CHI_REALTIME_DATABASE_RULES_WINDOWS.cmd` trước, sau đó redeploy frontend. Không dùng Rules cũ `numChildren()`.
