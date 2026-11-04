# Deploy Lô Tô Hội Chợ 199x lên Render hoặc Vercel

## Loại ứng dụng

- Frontend: React + TypeScript + Vite 8, tệp xuất bản: `dist/`.
- Firebase Authentication và Firestore được gọi trực tiếp từ trình duyệt; KHÔNG có Express backend cần giữ chạy 24/7.
- Chọn **Render Static Site** hoặc **Vercel Framework Preset: Vite**. Không chọn Render Web Service nếu không có backend riêng.
- Build cần Node 22.12+; nên dùng Node 22.x.
- Thư mục gốc repo chứa `package.json`, `vite.config.ts`, `index.html`, `vercel.json`, `render.yaml` (không chọn nhầm `src` làm Root Directory).
- Đẩy MỌI file source, `public/soundpack` và `public/soundpacks` lên GitHub. Không chỉ đẩy thư mục `dist`.

## Vercel — điền trong Project > Settings

- Framework Preset: **Vite**
- Root Directory: **./** (hoặc thư mục con chứa package.json nếu repo có thư mục bọc ngoài)
- Install Command: `npm install --no-audit --no-fund`
- Build Command: `npm run build`
- Output Directory: `dist`
- Node.js Version: **22.x**
- Environment Variables: dùng nội dung `DEPLOY_ENV_VALUES.txt` vào Production và Preview theo nhu cầu.
- `vercel.json` đã thêm SPA fallback rewrite về `/index.html`; không cần cấu hình port hay start command.
- Sau khi đổi env, phải **Redeploy** để Vite build lại bundle.

## Render — Create Static Site

- Environment: **Static Site**; KHÔNG phải Node Web Service.
- Root Directory: **trống** (hoặc đường dẫn repo con chứa package.json).
- Build Command: `npm install --no-audit --no-fund && npm run build`
- Publish Directory: `dist`
- Environment Variables: nhập nội dung `DEPLOY_ENV_VALUES.txt`; dùng `NODE_VERSION=22.16.0`.
- Redirects/Rewrites: Source `/*`, Destination `/index.html`, Action `Rewrite`.
- Hoặc chọn **New > Blueprint** sử dụng `render.yaml` tại gốc repo; được hỏi giá trị cho các env `sync: false` trong lần tạo đầu tiên.
- Không có Start Command/PORT cho Static Site.
- Sau khi sửa env, deploy lại.

## Giá trị Firebase hiện có

`DEPLOY_ENV_VALUES.txt` sao từ `firebase-applet-config.json` của source, trong đó:
- Firebase project ID: `leafy-concept-qt8c4`
- Firestore named database: `ai-studio-lthich199xlthoin-2cb02316-a219-47a4-9acb-21d18684e2a5`

**Lưu ý:** Firestore named database ở đây KHÔNG phải `(default)`. Nếu nhập biến môi trường chọn project này mà quên `VITE_FIRESTORE_DATABASE_ID`, app sẽ dùng sai database `(default)` và có thể bị lỗi permission hoặc không thấy dữ liệu.

Cách lựa chọn:
1. **Giữ Firebase hiện có:** Có thể không nhập biến Firebase nào, app dùng file cấu hình được đóng gói. Nếu muốn cấu hình riêng trong dashboard, nhập ĐỦ 7 biến từ `DEPLOY_ENV_VALUES.txt`.
2. **Đổi sang Firebase project khác:** Nhập đủ 6 biến Firebase từ Web App config mới; đặt `VITE_FIRESTORE_DATABASE_ID=(default)` nếu dùng default, hoặc tên database riêng thực sự đã tạo. Cập nhật Security Rules/indexes cho đúng project/database.
3. **Không** dùng `GEMINI_API_KEY`, `APP_URL` của AI Studio để deploy app này: mã nguồn hiện không sử dụng các env đó. Không nhập API key AI bí mật vào Vite.

## Firebase Console (bắt buộc để online hoạt động)

1. Chọn đúng Firebase project, kiểm tra **Authentication > Sign-in method**: bật Email/Password; không cần Anonymous vì ứng dụng bắt buộc đăng ký/đăng nhập.
2. **Authentication > Settings > Authorized domains**: thêm domain `*.vercel.app` thực tế / `*.onrender.com` thực tế và custom domain đang dùng, mỗi domain chính xác, không kèm `https://` hoặc đường dẫn. Lưu ý Firebase Auth không tự cấp phép domain mới chỉ vì deploy thành công.
3. **Firestore Database**: kiểm tra database có tên đúng, đã tạo và đang chạy; triển khai `firestore.rules` và `firestore.indexes.json` **vào database đó** bằng tài khoản được phép. Deploy trên Vercel/Render KHÔNG tự deploy Firestore Rules.
4. Cấu hình Firebase API key restriction phù hợp Firebase Authentication nếu hệ thống sử dụng key hạn chế; không đưa service account/Admin private key vào VITE_ vars.
5. Nếu `permission-denied`, kiểm tra cấu hình Firebase Rules, UID và database ID; KHÔNG mở Rules `allow read, write: if true`.

## Tối ưu Firestore, dữ liệu và realtime

Render/Vercel phục vụ file tĩnh qua CDN. Traffic game realtime **đi thẳng tới Firebase**, không đi qua máy chủ Render/Vercel. Chi phí đọc/ghi phụ thuộc listener, quy tắc, các thay đổi tài liệu và số người chơi, không phụ thuộc số lần build frontend.

Source trước đã giới hạn listener theo tab, nhưng **chưa triển khai** mic WebRTC, xác thực tiền xu/thưởng server-authoritative, phòng mật khẩu thực sự và chống spam server-side. Deploy không tự giải quyết các phần đó. Trước khi chơi công khai nhiều người phải bổ sung backend/Cloud Functions và cơ chế bảo vệ phù hợp. Không sử dụng Firestore để stream dữ liệu mic liên tục.

## Cấu trúc deploy thêm vào bản này

- `vercel.json`: SPA fallback cho Vercel.
- `render.yaml`: Render Static Site Blueprint và biến môi trường dạng `sync: false`.
- `.env.example`: tên biến môi trường dùng cho dự án khác.
- `DEPLOY_ENV_VALUES.txt`: các giá trị PUBLIC Firebase web config trích từ source hiện tại để copy vào dashboard.
- `src/services/firebase.ts`: đọc `VITE_FIREBASE_*` và `VITE_FIRESTORE_DATABASE_ID` khi đã cấu hình; dùng bản JSON cũ làm fallback nếu không có biến override.
- `package.json` + `.nvmrc`: Node 22.12+.
