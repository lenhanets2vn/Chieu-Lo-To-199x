CÁCH THÊM SOUNDPACK MỚI - KHÔNG CẦN SỬA TYPESCRIPT

1. Tạo public/soundpacks/<ten-bo>/ và chép đủ:
   01.mp3 ... 90.mp3, intro.mp3, near_end.mp3, outro.mp3
   (có thể sử dụng .webm thay .mp3 nếu khai báo preferredFormats tương ứng).
2. Thêm một object vào public/soundpacks/catalog.json:
   {"id":"ten-bo","title":"Tên hiển thị","basePath":"soundpacks/ten-bo","maxNumber":90,"preferredFormats":["mp3","webm"]}
3. Mở game: ở menu/chờ ván, chọn soundpack trên thanh âm thanh.
4. Không thay soundpack giữa lúc một ván đang chơi. Game sẽ khóa lựa chọn.
5. Đảm bảo các file tồn tại thật: nếu thiếu hoặc lỗi decode, game hiển thị lỗi và dừng, không chuyển sang đọc số bằng AI.
