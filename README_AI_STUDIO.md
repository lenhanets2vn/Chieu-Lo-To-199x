# Cập nhật V8.1 vào đúng dự án Google AI Studio

1. Sao lưu workspace đang chạy hoặc commit phiên bản cũ trên GitHub.
2. Giải nén `LO_TO_AI_STUDIO_TYPESCRIPT_V8_1_FULL.zip`, đưa **nội dung bên trong ZIP** (`src/`, `public/`, `package.json`, `index.html`, `vite.config.ts`, v.v.) vào đúng root repository được AI Studio dùng.
3. Đồng bộ thay đổi trong AI Studio/Repo. Không gửi ZIP vào chat và mặc định cho rằng Preview đã cập nhật.
4. Tại tab Code, kiểm tra `src/App.tsx` có chuỗi `V8.1.0-DEEP-AUDIO-5-PACKS` và file `src/features/audio/soundpackRegistry.ts` tồn tại.
5. Ở Preview, kiểm tra thanh âm lượng 0–100%, dropdown Soundpack, bản V8.1 trên header.
6. Thử BẮT ĐẦU: phải chờ tải (nếu có) → `intro` → số ngẫu nhiên. Kiểm tra Console/Network khi lỗi; 404 với `/soundpack/intro.mp3` hay `.../01.mp3` nghĩa là thiếu asset hoặc sai `BASE_URL`.
7. Khi đang phát, thử tắt/bật tiếng, thanh âm lượng và tắt/bật hiệu ứng. Không có giọng tổng hợp hoặc nút bỏ qua câu hò.
8. Chọn 5 bộ × 5 số, chọn tay hoặc tự bốc, chơi thử một ván mới; lựa chọn vẫn phải giữ nguyên ở ván kế tiếp.

## Thêm soundpack thứ hai

Tạo `public/soundpacks/<slug>/` chứa ít nhất `01.mp3` đến `90.mp3`, `intro.mp3`, `near_end.mp3`, `outro.mp3`. Thêm phần tử vào `public/soundpacks/catalog.json` như ví dụ trong `public/soundpacks/README_THEM_SOUND_PACK.txt`. Đổi soundpack chỉ khi menu hoặc chưa bắt đầu ván.

## Xử lý lỗi âm thanh

- Không có nhạc dạo: kiểm tra `/soundpack/intro.mp3` trong Network; mở URL riêng và thử phát. Nếu bị HTTP 404, phải cập nhật `public/` đúng chỗ chứ không sửa lại luồng TS.
- Bản hò nhảy số hoặc bị ngắt: xem thông báo đỏ từ bộ phát. Nếu máy không nạp xong bài kế tiếp trong thời gian chờ, game **dừng và báo**; không gọi bài khác hay TTS.
- Tắt/bật mất tiếng: thử 0–100%, trạng thái `AudioContext`, thử ngay trong Preview thay vì tải trực tiếp `index.html` (Vite cần dev/build server).
- Có bộ nhạc khác chưa xuất hiện: kiểm tra `public/soundpacks/catalog.json` và các file của bộ đó.

**Giới hạn đã xác nhận:** chưa chạy được Preview tại tài khoản AI Studio của bạn từ đây. Nên xem V8.1 là bản có sửa code + kiểm thử mô phỏng, chưa phải bản nghiệm thu hoàn chỉnh trong AI Studio.
