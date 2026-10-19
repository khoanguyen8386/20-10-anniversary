# Tài liệu Thiết Kế - Eternal Moments (DESIGN.md)

Tài liệu này lưu trữ các quyết định thiết kế cốt lõi và các giải pháp kỹ thuật cho giao diện kỷ niệm **Eternal Moments**.

## 1. Phong Cách Thẩm Mỹ (Visual Identity)

Giao diện được thiết kế theo chế độ **Experience (Trải nghiệm)** với định hướng lãng mạn, ấm áp, thanh lịch và mang đậm tính cảm xúc.

*   **Tone màu chính (Color Palette):**
    *   Nền tối sâu thẳm: Sự kết hợp của đen huyền bí (`#0a0305`) và đỏ mận (`#18070d`) để làm nổi bật độ rực rỡ và chiều sâu của hình ảnh.
    *   Hào quang vàng (Gold Radial Glow): Vùng trung tâm tỏa ra một ánh sáng vàng nhạt mờ (`rgba(229, 193, 88, 0.45)`) giả lập hiệu ứng nến ấm áp.
    *   Màu nhấn (Accents): Vàng Champagne/Rose Gold (`#e5c158` và `#df8875`) đem lại cảm giác sang trọng và cao cấp.
*   **Typography:**
    *   Tiêu đề chính: `Playfair Display` (Font chữ có chân serif cổ điển, quý phái).
    *   Tiêu đề phụ/Trích dẫn: `Cormorant Garamond` (Font serif thanh thoát, bay bổng).
    *   Hệ thống điều khiển/Chú thích: `Plus Jakarta Sans` (Font sans-serif hiện đại, rõ ràng, dễ đọc trên di động).

## 2. Giải Pháp Kỹ Thuật (Technical Implementation)

### A. Vòng Xoay Ảnh 3D (3D Photo Carousel)
Vòng xoay được dựng hoàn toàn bằng không gian 3D của CSS (`transform-style: preserve-3d`) và điều khiển thông qua JavaScript thuần:
*   **Tính toán bán kính (Radius Calculation):**
    Sử dụng công thức lượng giác để tìm khoảng cách từ tâm vòng xoay đến mỗi thẻ ảnh dựa trên chiều rộng thẻ thực tế:
    $$Radius = \frac{CardWidth}{2 \cdot \tan(\frac{\pi}{N})} + 35\text{px}$$
    Trong đó $N$ là tổng số lượng thẻ ảnh (mặc định là 8). Việc cộng thêm `35px` giúp nới rộng không gian và tạo khe hở sang trọng giữa các thẻ.
*   **Động lực học & Quán tính (Inertia & Momentum):**
    *   Tự động xoay mượt mà nhờ việc tăng `targetRotation` liên tục qua từng khung hình (`requestAnimationFrame`).
    *   Áp dụng kỹ thuật nội suy tuyến tính (Linear Interpolation - LERP) để làm mượt chuyển động: `currentRotation += (targetRotation - currentRotation) * 0.08`.
    *   Khi người dùng vuốt/kéo (drag/swipe), khoảng cách kéo được ánh xạ thành độ xoay. Khi nhả chuột, vận tốc kéo được bảo toàn làm hiệu ứng quay tiếp tục lướt đi rồi chậm dần (`friction = 0.95`).
*   **Độ phản hồi (Responsiveness):**
    Sử dụng CSS Custom Properties kết hợp Media Queries để thu nhỏ kích thước thẻ ảnh khi mở trên điện thoại di động (`--card-width` giảm từ `220px` xuống `150px`). Hệ thống JS tự động đọc chiều rộng này sau mỗi lần đổi kích thước cửa sổ (`resize`) để tính toán lại bán kính 3D hoàn toàn khớp.

### B. Hiệu Ứng Nền Đom Đóm (Ambient Fireflies)
Sử dụng một thẻ `<canvas>` hiệu năng cao che phủ toàn màn hình. Các hạt đom đóm được dựng ngẫu nhiên, tự động chuyển động đi lên kết hợp với hàm Sin sườn ngang để giả lập quỹ đạo gió thổi tự nhiên rất sống động và bay bổng.

### C. Trình Phát Nhạc Kính Mờ (Glassmorphic Audio Player)
*   Áp dụng thuộc tính `backdrop-filter: blur(16px)` kết hợp với viền vàng bán trong suốt tạo cảm giác hiện đại và chìm sâu vào nền.
*   Hiệu ứng cột sóng âm (Music Visualizer Bars) động chạy bằng CSS Keyframe Animations nhảy múa theo điệu nhạc, tự động thu nhỏ lại khi nhấn tạm dừng.

---
*Tài liệu này được tạo bởi Gemini CLI kết hợp cùng kỹ năng thiết kế chuyên sâu Impeccable.*

## 3. Bản Nâng Cấp: Trò Chơi Tương Tác & Thư Phản Hồi

Bản nâng cấp mang lại chiều sâu tương tác bằng cách chuyển đổi không gian sang sắc thái **Hồng Cánh Sen (Lotus Pink)** kết hợp hệ thống game và gửi thư.

### A. Quy Luật Màu Sắc Hồng Cánh Sen (Lotus Pink Palette)
Để giữ sự sang trọng cốt lõi, không bị chói lọi bởi tông hồng neon:
*   Màu nền tối được đẩy sâu về tông mận tím ánh hồng (`#120409` và `#2f0817`).
*   Hào quang phát sáng đổi sang sắc hồng dịu (`rgba(82, 19, 42, 0.55)`).
*   Các điểm nhấn như nút bấm và đường trang trí dùng tông hồng cánh sen chín ngọt mờ ảo (`#f083a2`), kết hợp tương phản cùng vàng rực sáng của nến (`#fcc96b`).

### B. Cơ Chế Né Tránh Của Nút "Không" (Evasion Physics)
Nút "Không" được áp dụng cơ chế tự vệ toán học để trở thành bất khả thi lựa chọn:
1.  **Chặn đứng sự kiện**: Lắng nghe đồng thời sự kiện `mouseover` (trên máy tính) và `touchstart` (trên điện thoại). Thuộc tính `e.preventDefault()` giúp tắt hoàn toàn độ trễ nhấp màn hình di động, biến việc cố tình ấn nhanh thành vô hiệu.
2.  **Thu nhỏ tỷ lệ**: Mỗi khi người dùng chạm hoặc hover hụt, nút co lại $10\%$ (`noScale *= 0.9`), tạo cảm giác như nút đang hoảng sợ lùi xa dần. Giới hạn tỷ lệ co ở mức tối thiểu $0.3$ để nút không biến mất hoàn toàn.
3.  **Dịch chuyển ngẫu nhiên**: Nút tự chuyển sang chế độ `position: fixed` với chỉ số `z-index` tuyệt đối. Tọa độ $X, Y$ mới được tính toán tự động nằm trọn trong vùng an toàn của trình duyệt (viewport minus padding) giúp nút không bị bay mất ra ngoài màn hình.

### C. Khối Tâm Tư & Biểu Mẫu Phản Hồi AJAX (Heartfelt Letter & Formspree)
*   **Chuyển cảnh mượt mà**: Click nút "Có" kích hoạt hiệu ứng mờ dần (fade out) câu hỏi cũ, sau đó hiển thị phong thư kính mờ ấm áp bằng thuộc tính `scrollIntoView` cuộn màn hình mượt đến trung tâm bức thư.
*   **Gửi thư Backendless**: Tích hợp Formspree nhận dữ liệu trực tiếp về Gmail cá nhân của Khoa mà không lộ API Key hay tốn chi phí xây dựng server.
*   **Tối ưu trải nghiệm gửi thư**: Thay vì điều hướng người dùng sang trang Formspree đơn điệu sau khi gửi, mã nguồn xử lý bằng AJAX (`fetch API`) để gửi biểu mẫu ngầm, giữ nguyên bầu không khí lãng mạn rồi chuyển tiếp hiệu ứng mở phong thư xác nhận thành công rực rỡ trực quan.

## 4. Bản Nâng Cấp: Widget Tương Tác Hai Bên (Gift Draw, Bubbles & Sliding Puzzle)

Bản nâng cấp này lấp đầy khoảng trống hai bên vòng xoay ảnh bằng 3 mini-game nhỏ, dùng chung ngôn ngữ glassmorphism (`.side-widget` kế thừa style của `.glass-card`) để không phá vỡ tổng thể sang trọng của trang.

### A. Bên Trái — Hộp Quà Bốc Thăm May Mắn
*   **Cơ chế**: Click vào hộp quà (`#gift-box`) kích hoạt animation rung lắc `giftShake` 0.5s, sau đó hộp "mở" (`.opened`) và hiện phần thưởng ngẫu nhiên được chọn từ mảng `giftPrizes` bằng `Math.random()`.
*   **Giới hạn lượt chơi**: Tối đa `GIFT_MAX_DRAWS = 3` lượt, mỗi lượt cách nhau `GIFT_COOLDOWN_MS = 60000` (1 phút). Trạng thái được lưu trong biến JS `giftDrawsRemaining` / `giftCooldownUntil`, cập nhật nhãn đếm ngược mỗi giây qua `setInterval(updateGiftUI, 1000)`. Đây là trạng thái theo phiên (session), sẽ reset khi tải lại trang — nếu muốn giữ giới hạn qua nhiều lần ghé thăm, có thể thay bằng `localStorage`.
*   **Liên kết với trò xếp hình**: Hàm `grantBonusGiftDraw()` được gọi khi mảnh ghép bên phải được giải xong, cộng thêm 1 lượt bốc và bỏ luôn thời gian chờ, kèm hiệu ứng phát sáng `gift-bonus-pulse` để thu hút sự chú ý quay lại hộp quà.

### B. Bên Phải — Bong Bóng Trái Tim & Mảnh Ghép Trượt
*   **Bong bóng vỡ toàn trang (Ambient Bubble Pop)**: Không còn gói gọn trong 1 khung widget — bong bóng được sinh ra trên lớp phủ toàn màn hình `#ambient-bubbles` (`position: fixed; inset: 0`), trôi bồng bềnh xuyên suốt mọi phần của trang giống như các đốm sáng đom đóm, chỉ khác là có thể tương tác được. Container dùng `pointer-events: none` còn từng bong bóng dùng `pointer-events: auto` nên không chặn thao tác click vào nội dung khác bên dưới.
    *   Đường bay dùng keyframe `bubbleRise` tính theo đơn vị `vh` (thay vì `px` cố định như bản cũ) để luôn khớp với chiều cao màn hình bất kỳ, đi kèm dao động ngang nhẹ và fade in/out.
    *   **Hiệu ứng khi click**: mỗi lần bấm vỡ, `createBubbleBurst()` sinh ra 6 hạt sáng nhỏ (`.bubble-burst-particle`) toả ra từ đúng vị trí click theo góc đều nhau (`Math.cos/sin`), bay ra xa dần rồi biến mất bằng keyframe `burstOut`, tạo cảm giác lấp lánh khi bong bóng nổ. Bong bóng sau đó biến mất rồi một bong bóng khác xuất hiện ở vị trí ngẫu nhiên sau 3–5 giây, y như bản cũ.
    *   **Cơ hội trúng thưởng ~30%**: mỗi lần nổ bong bóng, `Math.random() < 0.3` quyết định có gọi `grantBonusGiftDraw()` hay không; nếu trúng, một popup chúc mừng (`#bubble-bonus-popup`) hiện giữa màn hình trong ~2.6 giây, báo đã được cộng thêm 1 lượt bốc thăm bên hộp quà trái.
*   **Mảnh ghép tình yêu (Sliding Puzzle 4x4)**: Bài toán 15-puzzle cổ điển, cài đặt bằng mảng `puzzleState` gồm 16 giá trị (0–14 là mảnh ảnh, 14 — tức `TOTAL_TILES - 1` — là ô trống).
    *   **Cắt ảnh bằng CSS**: Mỗi mảnh dùng `background-size: 400% 400%` và `background-position` tính theo công thức `(col / (N-1)) * 100%`, `(row / (N-1)) * 100%` để hiển thị đúng phần ảnh tương ứng từ 1 ảnh nền duy nhất (`PUZZLE_IMAGE_URL`, khai báo ngay đầu block để dễ thay bằng ảnh kỷ niệm thật).
    *   **Xáo bài đảm bảo giải được**: Thay vì hoán vị ngẫu nhiên toàn bộ mảng (có thể tạo trạng thái không thể giải), hàm `shufflePuzzle()` thực hiện 120 bước trượt hợp lệ ngẫu nhiên xuất phát từ trạng thái đã giải, luôn né bước đảo ngược nước đi liền trước.
    *   **Thắng cuộc**: Sau mỗi nước đi, `checkPuzzleSolved()` so sánh mảng hiện tại với thứ tự gốc; khi khớp, board nhận class `.solved` (viền vàng phát sáng + animation `puzzleWin`) và gọi `grantBonusGiftDraw()` để thưởng thêm 1 lượt bốc thăm bên hộp quà trái.

### C. Responsive: Không Đè Lên Vòng Xoay Trung Tâm
*   **Thu nhỏ dần**: `.side-widget` (hộp quà, mảnh ghép) giảm kích thước theo 2 mốc `max-width: 1400px` và `max-width: 1150px`. Riêng bong bóng không còn bị giới hạn trong 1 khung nên không cần breakpoint riêng để thu nhỏ — số lượng bong bóng đồng thời trên màn hình được tính thẳng trong JS lúc tải trang (`window.innerWidth <= 640 ? 6 : ... <= 1100 ? 9 : 13`) để giảm bớt trên màn hình nhỏ mà không rối mắt.
*   **Chuyển sang drawer trên di động**: Dưới `max-width: 980px`, hai cột `.side-stack` (trái/phải) không còn đủ chỗ an toàn cạnh vòng xoay nên bị ẩn hoàn toàn khỏi vị trí `fixed`. Thay vào đó, JS (`placeSideWidgets()`) *di chuyển đúng các phần tử DOM đó* (không tạo bản sao) vào `#mobile-games-slot` bên trong một bottom-sheet (`.mobile-games-overlay`), mở ra từ nút nổi `🎁 Quà & Trò Chơi` (`.mobile-games-fab`). Nhờ dùng lại chính các node cũ, toàn bộ logic game (event listener, id) hoạt động y hệt trên di động mà không cần viết lại. `window.matchMedia('(max-width: 980px)')` cùng listener `change` đảm bảo việc chuyển đổi diễn ra mượt mà kể cả khi xoay ngang màn hình hoặc resize cửa sổ trình duyệt.