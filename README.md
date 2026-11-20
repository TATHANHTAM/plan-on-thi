# Study Tracker

Ứng dụng theo dõi kế hoạch ôn thi cá nhân từ 23/11/2026 đến 07/01/2027. Toàn bộ giao diện và dữ liệu hoạt động phía client; không cần tài khoản hoặc máy chủ.

## Chức năng chính

- Dashboard việc hôm nay theo MUST / SHOULD / BONUS, tải học và đếm ngược kỳ thi.
- Lịch hôm nay / tuần này; thêm, sửa trạng thái, dời và xóa nhiệm vụ tùy chỉnh.
- Theo dõi tiến độ chương độc lập với mức độ thành thạo.
- Ôn ngắt quãng +1 / +3 / +7 / +14 và lưu lịch sử phản hồi.
- Chế độ năng lượng Green / Yellow / Red và gợi ý xử lý lịch trễ có bước xác nhận.
- Thống kê dựa trên dữ liệu thật, bộ đếm tập trung và ghi nhận phiên học.
- Lưu IndexedDB bằng Dexie, xuất/nhập JSON và đặt lại lịch riêng.

## Chạy trên máy

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Kiểm tra bản production:

```bash
npm run build
npm run preview
```

## Deploy GitHub Pages

Dự án đã cấu hình `base: '/plan-on-thi/'` trong `vite.config.ts` cho URL:

`https://TATHANHTAM.github.io/plan-on-thi/`

1. Push source lên nhánh `main`.
2. Mở **Settings → Pages** trong GitHub.
3. Ở **Build and deployment**, chọn **Source: GitHub Actions**.
4. Workflow `.github/workflows/deploy.yml` sẽ cài dependency, build `dist` và deploy.

Nếu đổi tên repository, hãy đổi giá trị `base` trong `vite.config.ts` thành `/<ten-repo-moi>/`.

## Dữ liệu và sao lưu

Dữ liệu nằm trong IndexedDB của đúng trình duyệt/thiết bị đang dùng, không tự đồng bộ. Redeploy không xóa dữ liệu nếu storage trình duyệt còn nguyên. Hãy dùng **Cài đặt → Xuất JSON** định kỳ và giữ tệp ở nơi an toàn.

Khi nhập dữ liệu, ứng dụng kiểm tra phiên bản/cấu trúc rồi yêu cầu chọn thay thế hoặc gộp theo ID. Nhiệm vụ đã hoàn thành không thể bị xóa trực tiếp để bảo vệ lịch sử.

## Quy tắc lượt ôn bị lỡ

Lượt ôn bị lỡ vẫn ở hàng đợi dưới dạng quá hạn; hệ thống không tự nhân bản hay cộng dồn khoảng cách. “Nhớ một phần” tạo một buổi ôn ngắn ngày hôm sau. “Quên gần hết” tạo nhiệm vụ học lại; hoàn thành nhiệm vụ này mới khởi động một chu kỳ +1/+3/+7/+14 mới.

## Thông tin chưa xác nhận từ nguồn

- Tên thật của 7 chương CTDL và 8 chương Python chưa có trong tài liệu.
- Lớp Python 24/11 và lớp NCKH 25/11 được ghi là giả định.
- Cần xác nhận NCKH ngoại khóa và tiểu luận PP luận NCKH có phải hai đầu việc riêng, cùng các hạn 20/12 và 27/12.

Các điểm này được giữ dưới dạng ghi chú trong ứng dụng, không được tự suy diễn.
