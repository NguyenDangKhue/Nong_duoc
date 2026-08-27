# Sổ pha thuốc BVTV

Trang web tĩnh, tối ưu điện thoại: tra **dạng chế phẩm** (WP, WG, EC, SC, OD…), **thứ tự pha**, **cặp không phối**, và **19 loại thuốc hay dùng**.

Mở `index.html` trên máy để xem ngay, hoặc deploy GitHub Pages như dưới đây.

## Xem trên máy

Mở file `index.html` bằng trình duyệt (Chrome, Edge). Nếu font hoặc điều hướng lạ, chạy một máy chủ tĩnh:

```bash
# Python
python -m http.server 8080
```

Rồi vào `http://localhost:8080`.

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub (ví dụ `so-pha-thuoc`).
2. Đẩy toàn bộ thư mục này lên nhánh `main` (giữ `index.html` ở thư mục gốc).
3. Vào **Settings → Pages**.
4. **Source:** Deploy from a branch.
5. **Branch:** `main` / folder `/ (root)`.
6. Lưu. Sau 1–2 phút trang có địa chỉ:

   `https://<tên-tài-khoản>.github.io/<tên-repo>/`

Trên điện thoại: mở link đó, chọn **Thêm vào màn hình chính** để dùng như ứng dụng nhỏ ngoài đồng.

## Dùng ngoài thực tế

1. **Tra pha:** chọn 2–3 thuốc đang cầm → xem thứ tự cho vào bình 8/16/20/25 lít và cảnh báo kỵ nhau.
2. **Dạng:** bấm WP, EC, SC… để biết thuốc đó vào bình ở bước nào.
3. **Thuốc:** xem hoạt chất, nhóm IRAC/FRAC, liều tham chiếu bình 16 lít.
4. Luôn **đọc nhãn** bao bì. Khi chưa chắc, **thử cốc** 5–10 phút trước khi pha cả bình.

## Nguồn số liệu

Xem mục [Nguồn](./index.html#/nguon) trên web: CropLife (mã dạng chế phẩm), WALES / Syngenta / Virginia Tech (thứ tự tank-mix), danh mục thuốc BVTV Việt Nam, nhãn/tài liệu Map, Hợp Trí, Sumitomo (Dipel), IRAC và FRAC.

Liều “bình 16 lít” là **quy đổi tham chiếu** từ nhãn hoặc hướng dẫn phân phối — có thể khác theo cây trồng và lô hàng.

## Lưu ý pháp lý

Trang chỉ hỗ trợ tra cứu kỹ thuật. Không thay thế nhãn đăng ký, hướng dẫn sử dụng của nhà sản xuất, hay tư vấn bảo vệ thực vật tại địa phương.
