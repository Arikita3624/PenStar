# ✅ FIX: Thêm chức năng ghi chú (notes) cho booking

## 🐛 Vấn đề:

- Khách hàng nhập ghi chú (notes) nhưng không được lưu vào database
- Backend INSERT query không bao gồm cột `notes`
- Database thiếu cột `notes` trong bảng `bookings`

## 🔧 Giải pháp đã thực hiện:

### 1. Database Migration

**File:** `backend/migrations/add_notes_to_bookings.sql`

```sql
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS notes TEXT;
```

- Thêm cột `notes` kiểu TEXT (không bắt buộc, có thể NULL)
- Cho phép lưu ghi chú chung cho toàn bộ booking

### 2. Backend Model Update

**File:** `backend/models/bookingsmodel.js`

**Thay đổi:**

- ✅ Thêm `notes` vào destructuring parameters (line ~47)
- ✅ Update INSERT query bao gồm cột `notes` (line ~118-119)
- ✅ Truyền giá trị `notes || null` vào query parameters

**Trước:**

```javascript
const insertBookingText = `INSERT INTO bookings (customer_name, total_price, payment_status, payment_method, booking_method, stay_status_id, user_id, created_at, is_refunded)
  VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), FALSE) RETURNING *`;
const bookingRes = await client.query(insertBookingText, [
  customer_name,
  total_price,
  payment_status,
  data.payment_method || null,
  booking_method,
  stay_status_id,
  user_id,
]);
```

**Sau:**

```javascript
const insertBookingText = `INSERT INTO bookings (customer_name, total_price, payment_status, payment_method, booking_method, stay_status_id, user_id, notes, created_at, is_refunded)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), FALSE) RETURNING *`;
const bookingRes = await client.query(insertBookingText, [
  customer_name,
  total_price,
  payment_status,
  data.payment_method || null,
  booking_method,
  stay_status_id,
  user_id,
  notes || null, // ← Thêm notes
]);
```

### 3. Frontend Update

**File:** `penstar/src/components/pages/clients/bookings/MultiRoomBookingCreate.tsx`

**Thay đổi:**

- ✅ Thêm state `generalNotes` để lưu ghi chú chung (line ~59)
- ✅ Thêm TextArea field trong Step 0 (Customer Info) để khách nhập ghi chú
- ✅ Update payload gửi lên backend sử dụng `generalNotes` thay vì hardcoded "Multi-room booking"

**Trước:**

```typescript
notes: "Multi-room booking", // ← Hardcoded
```

**Sau:**

```typescript
notes: generalNotes || undefined, // ← Từ input của khách hàng
```

**UI thêm vào:**

```tsx
<Form.Item label="Ghi chú (không bắt buộc)">
  <TextArea
    rows={3}
    placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt cho toàn bộ booking..."
    value={generalNotes}
    onChange={(e) => setGeneralNotes(e.target.value)}
    maxLength={500}
    showCount
  />
</Form.Item>
```

### 4. Files khác không cần sửa:

- ✅ `StaffBookingCreate.tsx` - Đã có sẵn trường notes (line 855)
- ✅ Backend controller - Không cần sửa (chỉ forward data)
- ✅ Frontend types - `notes?: string` đã có trong `Booking` type

## 📋 Cách test:

### 1. Chạy migration:

```bash
psql -U postgres -d penstar -f backend/migrations/add_notes_to_bookings.sql
```

Hoặc xem file `backend/migrations/README_add_notes.md` để biết thêm cách chạy khác.

### 2. Khởi động lại backend:

```bash
cd backend
npm run dev
```

### 3. Test trên frontend:

1. Đi đến trang tìm phòng
2. Chọn phòng và tiến hành đặt
3. Ở Step 0 (Thông tin liên hệ), nhập ghi chú vào ô "Ghi chú"
4. Hoàn tất booking

### 4. Kiểm tra database:

```sql
SELECT id, customer_name, notes, created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
```

Bạn sẽ thấy ghi chú đã được lưu trong cột `notes`.

## 🎯 Kết quả:

✅ **Database:** Có cột `notes` kiểu TEXT
✅ **Backend:** Lưu notes vào database khi tạo booking
✅ **Frontend:** Có UI cho khách nhập ghi chú chung
✅ **Data flow:** notes từ frontend → backend → database hoạt động đúng

## 📌 Lưu ý:

- Trường `notes` là **optional** (có thể để trống)
- `notes` khác với `special_requests`:
  - `notes`: Ghi chú chung cho toàn bộ booking (lưu ở bảng `bookings`)
  - `special_requests`: Yêu cầu đặc biệt cho từng phòng riêng lẻ (lưu ở bảng `booking_items`)
- StaffBookingCreate đã có sẵn trường notes, không cần update

## 🔜 Tiếp theo:

Sau khi test xong notes, có thể tiến hành implement tính năng "Đổi phòng" (room change) cho booking chưa check-in.
