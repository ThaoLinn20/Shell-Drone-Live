# Tài Liệu Thiết Kế Kiến Trúc: Phiên Bản TikTok Live Interactive Fireworks

## 1. Mục Tiêu và Tầm Nhìn Sản Phẩm
- Tên dự án: Shell Drone Live - Phiên bản TikTok Live Interactive.
- Mục tiêu: Xây dựng nền tảng trình diễn pháo hoa 3D tương tác thời gian thực dành riêng cho livestream trên TikTok Live hoặc các nền tảng video ngắn dọc.
- Trải nghiệm cốt lõi:
  - Người xem ngắm các màn trình diễn pháo hoa 3D chất lượng cao với góc nhìn tối ưu cho màn hình di động 9:16.
  - Người xem tương tác tặng quà hoặc bình luận trên livestream, hệ thống tự động nhận diện và kích hoạt các hiệu ứng pháo hoa tương ứng theo thời gian thực với độ trễ tối thiểu.
  - Vòng lặp kích thích tâm lý: Vinh danh người tặng quà trên màn hình qua bảng thông báo kết hợp hiệu ứng pháo hoa nở rộ trên bầu trời, tạo cảm giác được công nhận và tác động trực tiếp vào luồng phát trực tiếp.

## 2. Kiến Trúc Tổng Thể Hai Lớp Độc Lập
Hệ thống được chia tách triệt để thành hai phân hệ độc lập:
1. Phân hệ Thu Thập Sự Kiện - TikTok Live Bridge Service chạy nền trên Node.js:
   - Chạy nền độc lập trên máy chủ hoặc máy streamer.
   - Sử dụng thư viện kết nối TikTok Live qua giao thức Webcast và WebSocket để lắng nghe sự kiện tặng quà, bình luận, thả tim, theo dõi, chia sẻ.
   - Chuẩn hóa dữ liệu thô thành định dạng sự kiện chuẩn.
   - Phát sóng các sự kiện đã chuẩn hóa tới Player thông qua mạng nội bộ bằng WebSocket Server cục bộ.
   - Tự động quản lý kết nối lại và xử lý lỗi mạng mà không làm ảnh hưởng đến hiệu năng đồ họa.

2. Phân hệ Trình Diễn Đồ Họa - Interactive 3D Player chạy trên Three.js WebGL:
   - Ứng dụng web tối ưu cho OBS Browser Source hoặc Window Capture ở tỉ lệ dọc 9:16 với độ phân giải khuyến nghị 1080x1920.
   - Đóng vai trò WebSocket Client nhận sự kiện từ Bridge Service.
   - Tập trung toàn bộ tài nguyên GPU và CPU cho việc dựng hình pháo hoa, mô phỏng khói, âm thanh không gian và giao diện HUD hiển thị vinh danh.
   - Đảm bảo hiệu năng ổn định 60 FPS cố định.

## 3. Kế Hoạch Bóc Tách Codebase
- Các thành phần loại bỏ hoàn toàn:
  - Loại bỏ toàn bộ giao diện chỉnh sửa timeline, waveform âm thanh, track rows, keyframe controls, undo/redo history trong thư mục `src/ui/`.
  - Loại bỏ các DOM node và event listener thừa thãi để giải phóng bộ nhớ và giảm tải CPU.
- Các thành phần cốt lõi giữ nguyên:
  - `src/systems/FireworkSystem.js` và `src/systems/TrailSystem.js`: Hệ thống hạt hybrid gồm GPU analytical physics và CPU zero-allocation pool, giữ nguyên Additive Blending.
  - `src/factories/BurstShapeGenerator.js` và `src/factories/BurstEffectProcessor.js`: Toàn bộ thuật toán hình học và động học hạt.
  - `src/factories/ShellPresetFactory.js` và `src/factories/FireworkCompositionHelper.js`: Danh mục preset và khuôn mẫu composition.
  - `src/audio/SoundSystem.js` và `src/audio/AudioEngine.js`: Hệ thống âm thanh spatial và trigger tiếng nổ.
  - `src/camera/CameraController.js`: Camera cinematic và góc quay tối ưu cho màn hình dọc.
  - `src/core/PlaybackEngine.js`: Trình phát chuỗi sự kiện kịch bản.

## 4. Module Quản Lý Tương Tác Độc Lập
- Vị trí mã nguồn: `src/live/InteractionManager.js`.
- Nguyên tắc thiết kế:
  - Hoạt động độc lập theo mô hình cấu hình động.
  - Không nhúng logic nghiệp vụ hay điều kiện quà tặng vào trong lõi rendering.
  - Đóng vai trò bộ chuyển tiếp Adapter và Event Bus tiếp nhận sự kiện từ WebSocket và ánh xạ thành lệnh kích hoạt hệ thống.
- Tập tin cấu hình tương tác: `interaction_rules.json`:
  - Admin và Streamer có thể thay đổi luật chơi nhanh chóng mà không cần lập trình viên sửa mã nguồn hay build lại ứng dụng.
  - Mỗi quy tắc bao gồm:
    - Điều kiện kích hoạt: Loại sự kiện, ID quà tặng, số lượng tối thiểu, từ khóa bình luận.
    - Hành động thực thi: Kích hoạt shell preset cụ thể, gọi bộ sinh thủ tục procedural, hoặc kích hoạt đoạn kịch bản ngắn.
    - Tọa độ bệ phóng: Bệ phóng cố định, ngẫu nhiên hoặc theo khu vực.
    - Kiểm soát hàng đợi: Hàng đợi ưu tiên, thời gian hồi chiêu và giới hạn tốc độ.

## 5. Bộ Tự Động Ghép Pháo Hoa Thủ Tục
- Vị trí mã nguồn: `src/factories/ProceduralShellGenerator.js`.
- Mục đích: Tạo yếu tố bất ngờ cho người xem khi tặng quà lặp lại, gia tăng tính giải trí mà không tạo ra hiệu ứng trùng lặp.
- Cơ chế ghép nối dựa trên Composition Model:
  - Shape: Chọn ngẫu nhiên hoặc theo trọng số từ danh sách shape hợp lệ trong `BurstShapeGenerator.js`.
  - Dynamics: Áp dụng kiểu động học từ `BurstEffectProcessor.js` như willow, standard, droop, comet.
  - Bảng màu: Tự động phối cặp màu tương phản hoặc bổ trợ theo lý thuyết bánh xe màu sắc.
  - Active Effects: Ghép các hiệu ứng quang học phổ quát như strobe, crackle, ghost, crossette.
  - Giới hạn hạt an toàn: Kiểm tra ma trận tương thích và giới hạn số lượng hạt tối đa của mỗi quả pháo sinh ra, đảm bảo giữ vững hiệu năng 60 FPS.

## 6. Cơ Chế Nạp Kịch Bản Tự Động Từ Thư Mục
- Vị trí mã nguồn: `src/loaders/ShowScriptLoader.js`.
- Tổ chức thư mục:
  - Thư mục `public/shows/`: Chứa các tệp kịch bản định dạng `.json` dành cho các thời khắc đặc biệt.
  - Thư mục `public/presets/`: Chứa các tệp định nghĩa shell preset tùy biến do Admin bổ sung.
- Cơ chế nạp và đồng bộ hóa:
  - Quét danh mục thông qua tệp chỉ mục manifest hoặc dịch vụ theo dõi tệp phía Node.js.
  - Bộ kiểm tra Schema an toàn: Xác thực tính toàn vẹn của dữ liệu JSON, loại bỏ các giá trị sai lệch, đảm bảo tính tương thích ngược và không làm gián đoạn tiến trình đang chạy khi tệp lỗi.
  - Đăng ký động vào bộ nhớ runtime của Player ngay khi phát hiện kịch bản mới mà không cần tải lại trang.

## 7. Thiết Kế Trải Nghiệm Màn Hình Dọc 9:16 và Vùng An Toàn
- Tỉ lệ khung hình: Dọc 9:16 với độ phân giải chuẩn 1080x1920.
- Vùng an toàn giao diện:
  - Vùng đỉnh màn hình từ 0% đến 15% chiều cao: Dành cho thông tin phòng live, avatar streamer, số lượng người xem của TikTok.
  - Vùng đáy màn hình từ 0% đến 35% chiều cao tính từ đáy: Dành cho luồng chat TikTok, nút thả tim và bảng chọn quà.
  - Vùng biểu diễn pháo hoa chính từ 40% đến 85% chiều cao: Bầu trời mở, trung tâm điểm nổ của pháo hoa.
- Lớp hiển thị vinh danh:
  - Tách biệt thành lớp 2D DOM Overlay nằm trên Canvas 3D.
  - Hiển thị thông báo vinh danh người tặng gồm tên người tặng, avatar, tên món quà và số lượng.
  - Tự động làm mờ và ẩn đi sau vài giây để trả lại không gian thoáng đãng cho pháo hoa.

## 8. Lộ Trình Triển Khai Kỹ Thuật
- Bước 1: Xây dựng Node.js Bridge Service kết nối thử nghiệm TikTok Live và phát WebSocket nội bộ.
- Bước 2: Dọn dẹp mã nguồn client, bóc tách toàn bộ Editor UI, thiết lập Player màn hình dọc 9:16 và Camera Framing.
- Bước 3: Xây dựng `src/live/InteractionManager.js` kết hợp tập tin cấu hình `interaction_rules.json`.
- Bước 4: Xây dựng bộ tự sinh pháo hoa `src/factories/ProceduralShellGenerator.js` và trình nạp kịch bản `src/loaders/ShowScriptLoader.js`.
- Bước 5: Thiết kế HUD vinh danh người tặng quà, hoàn thiện kiểm thử unit test Vitest đảm bảo không hồi quy.
