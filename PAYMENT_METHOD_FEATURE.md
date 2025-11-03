# Tính năng Phương thức Thanh toán

## Tổng quan

Đã thêm tính năng cho phép admin chọn **phương thức thanh toán** khi khách thanh toán trực tiếp tại quầy lễ tân.

## Thay đổi Database

### Thêm cột `payment_method` vào bảng `bookings`

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL;
```

**Các giá trị phương thức thanh toán:**

- `cash` - Tiền mặt 💵
- `card` - Thẻ tín dụng/ghi nợ 💳
- `transfer` - Chuyển khoản ngân hàng 🏦
- `momo` - Ví MoMo 📱
- `vnpay` - VNPAY 💰
- `cod` - Thu tại quầy (Cash on Delivery) 🏨
- `NULL` - Chưa chọn phương thức

## Phân biệt với `payment_status`

### `payment_status` (Trạng thái thanh toán)

Cho biết **trạng thái** của việc thanh toán:

- `unpaid` - Chưa thanh toán
- `pending` - Chờ thanh toán (COD)
- `paid` - Đã thanh toán
- `failed` - Thất bại

### `payment_method` (Phương thức thanh toán)

Cho biết **phương thức** khách hàng thanh toán:

- Tiền mặt, thẻ, chuyển khoản, ví điện tử, v.v.

## Quy tắc sử dụng

### Booking Online (từ website)

- `booking_method = "online"`
- `payment_method` tự động được ghi nhận từ cổng thanh toán (VNPAY, MoMo, v.v.)
- Admin **KHÔNG** được chọn/sửa payment_method
- Chỉ xem (read-only)

### Booking Offline (trực tiếp tại quầy)

- `booking_method = "offline"`
- Admin **CÓ THỂ** chọn payment_method khi:
  - ✅ Booking đã được duyệt (`stay_status_id = 1`)
  - ✅ Chưa thanh toán (`payment_status != "paid"`)
  - ✅ Chưa bị hủy (`stay_status_id != 4`)

### Khi nào chọn phương thức thanh toán?

1. Khách đến quầy lễ tân đặt phòng
2. Admin tạo booking offline → trạng thái "Đã duyệt"
3. Khách nói: "Tôi thanh toán bằng tiền mặt/thẻ/chuyển khoản"
4. Admin chọn phương thức tương ứng trong dropdown
5. Sau khi nhận tiền, admin chuyển `payment_status` sang "Paid"

## UI Admin

### Card "Tổng kết thanh toán"

Thứ tự hiển thị:

1. **Phương thức thanh toán** (mới)
   - Dropdown (nếu offline + đã duyệt + chưa thanh toán)
   - Tag màu (nếu đã chọn hoặc chỉ xem)
2. **Trạng thái thanh toán** (đã có)
   - Dropdown hoặc Tag tùy điều kiện

### Màu sắc Tag

- 💵 `cash` - Green
- 💳 `card` - Blue
- 🏦 `transfer` - Cyan
- 📱 `momo` - Magenta
- 💰 `vnpay` - Purple
- 🏨 `cod` - Orange
- Chưa chọn - Default gray

## Ví dụ Luồng thanh toán tại quầy

### Trường hợp 1: Khách đặt và thanh toán ngay

```
1. Khách đến quầy: "Tôi muốn đặt phòng 101"
2. Admin tạo booking offline
   → booking_method = "offline"
   → stay_status_id = 1 (đã duyệt)
   → payment_status = "unpaid"
   → payment_method = NULL

3. Khách: "Tôi thanh toán bằng thẻ ngay bây giờ"
4. Admin chọn payment_method = "card" 💳
5. Admin nhận thẻ, quẹt thẻ, xác nhận thanh toán
6. Admin chuyển payment_status = "paid" ✅
```

### Trường hợp 2: Khách đặt trước, thanh toán sau

```
1. Khách đặt phòng qua điện thoại
2. Admin tạo booking offline
   → payment_status = "unpaid"
   → payment_method = NULL

3. Khách đến quầy khi check-in
4. Khách: "Tôi thanh toán tiền mặt"
5. Admin chọn payment_method = "cash" 💵
6. Admin nhận tiền, chuyển payment_status = "paid" ✅
7. Admin ấn nút "Check-in" (vì đã paid)
```

### Trường hợp 3: Khách đặt online

```
1. Khách đặt phòng trên website
2. Khách chọn thanh toán VNPAY
3. Hệ thống tự động:
   → booking_method = "online"
   → payment_method = "vnpay" 💰 (tự động)
   → payment_status = "paid" (nếu thanh toán thành công)

4. Admin CHỈ XEM, không sửa được payment_method
```

## File đã thay đổi

### Backend

1. ✅ `backend/migrations/add_payment_method.sql` - Migration script
2. ✅ `backend/models/bookingsmodel.js` - Đã hỗ trợ update payment_method qua `updateBookingStatus()`

### Frontend

1. ✅ `penstar/src/types/bookings.ts` - Thêm `payment_method?: string`
2. ✅ `penstar/src/components/pages/admin/bookings/BookingDetail.tsx`
   - Thêm hàm `handleUpdatePaymentMethod()`
   - Thêm UI dropdown chọn phương thức thanh toán
   - Thêm logic hiển thị có điều kiện (offline + đã duyệt + chưa thanh toán)
   - Thêm text hướng dẫn

## Testing

### Test Case 1: Booking Offline - Chọn phương thức thanh toán

1. Tạo booking mới từ admin (offline)
2. Duyệt booking
3. Mở BookingDetail
4. Trong card "Tổng kết thanh toán", kiểm tra:
   - ✅ Hiển thị dropdown "Phương thức thanh toán"
   - ✅ Có 6 options: cash, card, transfer, momo, vnpay, cod
   - ✅ Text hướng dẫn: "💡 Chọn phương thức thanh toán trực tiếp tại quầy..."
5. Chọn "💵 Tiền mặt"
6. Kiểm tra:
   - ✅ Message success hiển thị
   - ✅ Tag màu green hiển thị "CASH"
   - ✅ Database có `payment_method = 'cash'`

### Test Case 2: Booking Online - Không được chọn

1. Tạo booking online từ website
2. Mở BookingDetail trong admin
3. Kiểm tra:
   - ✅ KHÔNG hiển thị dropdown payment_method
   - ✅ Chỉ hiển thị Tag (read-only)
   - ✅ Text: "🌐 Booking online - Phương thức thanh toán được tự động ghi nhận..."

### Test Case 3: Đã thanh toán - Không được sửa

1. Tạo booking offline
2. Chọn payment_method = "card"
3. Chuyển payment_status = "paid"
4. Kiểm tra:
   - ✅ Dropdown biến thành Tag
   - ✅ Tag màu blue hiển thị "CARD"
   - ✅ Không thể sửa

### Test Case 4: Booking đã hủy

1. Hủy booking
2. Mở BookingDetail
3. Kiểm tra:
   - ✅ payment_method hiển thị dạng Tag (không có dropdown)
   - ✅ Màu default gray nếu chưa chọn

## Lưu ý

⚠️ **Phân biệt rõ ràng:**

- `booking_method` = Nguồn booking (online/offline)
- `payment_method` = Phương thức thanh toán (cash/card/transfer...)
- `payment_status` = Trạng thái thanh toán (unpaid/paid/failed...)

✅ **Best Practice:**

- Online booking → payment_method tự động (từ gateway)
- Offline booking → admin chọn payment_method thủ công
- Chỉ cho phép sửa payment_method khi chưa thanh toán
