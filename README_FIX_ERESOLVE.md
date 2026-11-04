# LÔ TÔ AI STUDIO V7.1 — SỬA LỖI NPM ERESOLVE

## Lỗi đã xác định

Vite 8.3.5 khai báo peerOptional `esbuild: ^0.27.0 || ^0.28.0`, nhưng bản V7 trước đặt `esbuild: ^0.25.0`. npm từ chối cài đặt. Đây là lỗi package của bản V7, không phải lỗi AI Studio.

## Những gì đã sửa

1. `package.json`: đổi `devDependencies.esbuild` thành `^0.28.0`.
2. Gỡ `bun.lock` cũ vì bản đó khóa esbuild 0.25.12. Khi cần Bun, tạo lại lock theo package.json đã sửa.
3. Bổ sung `tools/check-dependencies.mjs` để kiểm tra trước khi cài.
4. Sửa `KIEM_TRA_BUILD_WINDOWS.cmd` thành 6 bước; kiểm tra dependency trước `npm install`.
5. Thêm `SUA_LOI_ERESOLVE_WINDOWS.cmd` để xóa `node_modules`, khóa npm/Bun cũ **trong thư mục dự án này**, sau đó cài và build lại.

## Cách dùng Windows

- Giải nén toàn bộ ZIP, chạy `SUA_LOI_ERESOLVE_WINDOWS.cmd` nếu đã từng cài bản lỗi.
- Hoặc chạy `KIEM_TRA_BUILD_WINDOWS.cmd` nếu mới tải về và chưa cài.
- Cần Node.js >=22.12 (hoặc >=20.19) và kết nối Internet để tải dependencies.
- Chỉ coi là cài đặt hoàn chỉnh khi CMD báo `SUCCESS`, sau cả `npm run lint` và `npm run build`.

## Cập nhật dự án AI Studio hiện hữu

- Cập nhật `package.json` tại **gốc dự án đang chạy**. Xóa `bun.lock` cũ khỏi repo/workspace (không chỉ dán bản vá vào ZIP khác).
- Xóa `package-lock.json` cũ nếu nó khóa esbuild 0.25, rồi cài lại để sinh lock mới.
- Dự án sẽ không tự thay đổi trong AI Studio chỉ vì tải ZIP tại đây. Dùng tab Code hoặc đồng bộ GitHub đúng repository.

## Giới hạn xác minh

Đã chạy kiểm tra tĩnh package, lock, cấu trúc soundpack. Môi trường tạo file này không thể kết nối registry.npmjs.org, nên CHƯA xác nhận được `npm install` / `npm run build` thật. Không dùng `--force` hoặc `--legacy-peer-deps` để che conflict.

Lưu ý: log file `2026-10-25T15_22_58_933Z-debug-0.log` đính kèm thuộc dự án PeakFour `npm run check:adapter` và ghi `exit 0`, không phải log ERESOLVE của Lô Tô ngày 03/11/2026. Nguyên nhân ERESOLVE dựa vào đoạn log bạn dán trực tiếp trong chat.
