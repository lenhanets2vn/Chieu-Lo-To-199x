# BÁO CÁO SỬA LỖI CHUYÊN SÂU — LÔ TÔ V8.1

Cơ sở: phiên bản V7.1 nguồn thực trong `LO_TO_AI_STUDIO_V7_1_FULL_DA_SUA_ERESOLVE.zip`.

## 1. Khoảng lặng khi chuyển soundpack

**Đã xác nhận trước sửa:** `queueFollowing` có `return` khi `endAt - currentTime < 0.09` và `catch {}` bỏ qua lỗi tải. Song kế tiếp có thể phải đợi `load()` khi bài cũ đã kết thúc.

**Đã sửa:** mỗi lần phát mới có tham số following, Web Audio `start()` tải và giải mã cả hai file trước khi bắt đầu phát; tự nạp thêm một file ahead trong quá trình hát. Lên lịch bằng `AudioContext.currentTime`, crossfade 100 ms. Nếu `queued` sai, thiếu hoặc tải quá trễ, trả lỗi rõ ràng và dừng an toàn. Không nhảy số, không fallback TTS.

**Giới hạn:** không thể bảo đảm phát hoàn toàn không có khoảng trống nếu chính MP3 có đoạn im sẵn; không thể bảo đảm khi trình duyệt ngắt AudioContext hoặc tài nguyên không tải được. Khả năng giải mã MP3 trực tiếp trong Google AI Studio cần thử Preview.

## 2. Nhạc dạo

**Đã kiểm tra:** `intro.mp3` có thật, ffprobe xác nhận MP3 44,1kHz, dài ~23,72 giây. Game đã gắn `playIntro` vào nút bắt đầu trước số đầu tiên. Bản mới preflight intro + số đầu; khi chưa nạp xong giao diện hiển thị “Đang chuẩn bị”.

**Chưa xác minh được:** phát âm thanh thực tế bên trong Google AI Studio, vì không có quyền truy cập Preview và Chromium thử nghiệm tại đây chặn đường dẫn local.

## 3. Soundpack độc lập

**Đã sửa:** có `soundpackRegistry.ts` tải JSON `public/soundpacks/catalog.json`, xác thực ID, đường dẫn, định dạng, hỗ trợ chọn bộ khi menu/chờ. Cache theo ID; không dùng nhầm file hai bộ.

**Trạng thái:** kèm sẵn **một bộ** Hội Chợ 199x đầy đủ 01–90 + intro + near_end + outro; khả năng thêm nhiều bộ có trong mã nhưng chưa có soundpack thứ hai do người dùng cung cấp.

## 4. Âm lượng

**Đã xác nhận trước sửa:** `audioSynthesizer` tạo AudioContext riêng và nối oscillator thẳng tới destination.

**Đã sửa:** hiệu ứng `audioSynthesizer` dùng `speechCaller.getEffectsBus()` và nối về master gain. `setVolume` 0–1, tắt tiếng cùng master; vẫn có công tắc soundEffects riêng.

## 5. Năm bộ số

**Đã xác nhận trước sửa:** `GameSettings.ticketCount: 1`, `startNewGame` gọi `setPackCount(1)`.

**Đã sửa:** ticketCount là `1 | 5`; chọn số lượng bộ cập nhật settings và `localStorage`. Ván mới khôi phục lựa chọn từ settings; khi chọn 5 bộ có 120 giây, chọn 1 bộ có 30 giây. Từng bộ gồm đúng 5 số, tự đánh dấu, điều kiện KINH kiểm tra 5/5.

## Kiểm thử đã qua

- `node tools/verify-project.mjs`: đủ mã nguồn, catalog, 90 file số, 3 bài nhạc đặc biệt.
- `tsc` lõi TypeScript: không lỗi type ở 7 file audio/engine/typings được kiểm tra.
- `node tools/test-audio-node.mjs`: chạy tuần tự 4 track mô phỏng, không trùng AudioContext; tải chậm không bắt đầu khi next chưa sẵn; missing file và late queue báo lỗi.
- `node tools/test-game-core.mjs`: 100 ván × 90 số không trùng, 5 bộ × 5 số, KINH 4/5 bị khóa, 5/5 được phép.
- `ffprobe`: tất cả 94 file MP3 của soundpack đều được đọc, không có lỗi container.
- 38 file `.ts/.tsx` kiểm tra parse/transpile không lỗi cú pháp, import nội bộ được kiểm tra.

## Chưa nghiệm thu

- `npm install`, `npm run lint` toàn dự án, `npm run build`: mạng npm bị chặn ở môi trường xử lý hiện tại.
- Browser/AI Studio Preview thực tế: Chromium cục bộ bị chặn tải trang test. Các bài thử AudioContext là **mô phỏng** chứ không phải phép đo độ trễ âm thanh trên thiết bị người dùng.
- Độ chính xác lời hò trong từng file MP3: không thuộc phạm vi sửa code; phải nghiệm thu riêng nếu file soundpack đã cắt chứa tiếng số khác.
