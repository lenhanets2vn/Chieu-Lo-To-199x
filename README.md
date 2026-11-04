> **Triển khai Vercel / Render:** xem `DEPLOY_RENDER_VERCEL.md` và `DEPLOY_ENV_VALUES.txt`.

# LÔ TÔ HỘI CHỢ 199x — AI STUDIO TYPESCRIPT V8.1

**Dự án React + TypeScript + Vite, từ V7.1 đã sửa xung đột Vite/esbuild.**

## Năm thay đổi cốt lõi

1. **Liền nhạc**: bộ phát Web Audio giải mã **bài đang phát + bài kế tiếp** trước khi khởi phát; trong lúc hát, nạp trước thêm bài thứ ba. Bài sau được hẹn giờ theo AudioContext, crossfade 100 ms. Nếu bài tiếp theo đến quá muộn hoặc lỗi, **dừng + hiển thị lỗi**, không chuyển số âm thầm, không gọi TTS.
2. **Nhạc dạo và nhạc kết**: `intro.mp3` mở đầu, `near_end.mp3` sau 85 số, `outro.mp3` sau đủ 90 số khi chưa KINH. File intro dài khoảng 23,72 s, near_end khoảng 13,61 s, outro khoảng 22,94 s. Bản game chờ giải mã intro và bài đầu mới bắt đầu phát, thay vì bỏ qua intro.
3. **Nhiều soundpack**: thêm `public/soundpacks/catalog.json` có ID, tiêu đề và đường dẫn từng bộ. Có dropdown chọn bộ trên thanh điều khiển trước/trong khi chờ ván; khóa chọn khi đang chơi. Thêm bộ mới bằng cách đặt file âm thanh + khai báo catalog, không cần thay TSX.
4. **Âm lượng thật sự toàn cục**: âm nhạc và mọi hiệu ứng `audioSynthesizer` đi qua **cùng một AudioContext + GainNode master**; tắt rồi bật không dừng/khởi động lại bài.
5. **1 hoặc 5 bộ số**: mỗi bộ đúng 5 số, tự chọn hoặc bốc ngẫu nhiên. Lựa chọn 5 bộ được giữ sang ván mới bằng state + localStorage, không bị `ticketCount: 1` ghi đè. KINH chỉ được bấm khi tối thiểu một bộ đủ 5/5 số đã gọi.

## Chạy và kiểm tra trên Windows

- Yêu cầu Node.js 22.12+ hoặc Node.js 24+, npm và Internet ở lần cài đầu.
- Giải nén toàn bộ ZIP vào thư mục không bị lồng dự án nhiều cấp.
- Chạy `KIEM_TRA_BUILD_WINDOWS.cmd`: kiểm tra tài nguyên, cài npm, kiểm tra TypeScript, kiểm thử lõi, build. **Phải thấy SUCCESS** mới coi là chạy build thành công.
- Chạy `npm run dev` trong thư mục dự án, mở `http://localhost:3000` và thử thật: chọn bộ, nhấn Bắt đầu → intro → hò → hiện số 1 giây trước hết nhạc, thử tắt/bật/âm lượng/5 bộ.

## Google AI Studio

ZIP chỉ là mã nguồn. Nó **không tự cập nhật workspace AI Studio hiện tại**. Đồng bộ toàn bộ file vào chính repo/Code đang được AI Studio Preview sử dụng. Giao diện mới có `V8.1.0-DEEP-AUDIO-5-PACKS`. Nếu vẫn thấy V7 thì chưa chạy mã V8.1.

## Kiểm thử đã thực hiện ở đây

- Node kiểm tra cấu trúc và đủ 90 bài hò + intro/near_end/outro.
- `ffprobe` đọc được 94 file MP3 (bao gồm file bonus_92) không phát hiện lỗi container.
- `tsc` kiểm tra kiểu mô-đun lõi: audio, game engine, kiểu vé.
- Mô phỏng AudioContext: lịch intro → số 01 → số 02 → outro, âm lượng chung, tải chậm, lỗi thiếu file, lỗi hàng đợi trễ.
- Test 100 ván × 90 số; 1/5 bộ, đủ/thiếu điều kiện KINH.

**Chưa hoàn thành ở đây:** npm install / Vite production build vì môi trường thử nghiệm không tới được npm registry; Chromium trong môi trường này bị chặn truy cập cả local server và file thử nghiệm, nên chưa xác minh autoplay thực trong Preview Google AI Studio. Xem `BAO_CAO_V8_1.md`.
