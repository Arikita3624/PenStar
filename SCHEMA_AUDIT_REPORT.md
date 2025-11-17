# BÁO CÁO KIỂM TRA SCHEMA DATABASE VỚI BACKEND/FRONTEND

## 📊 SCHEMA THỰC TẾ (Từ CSV files)

### Bảng `bookings`:

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR,
    total_price NUMERIC(10,2),
    payment_status VARCHAR(30),
    booking_method VARCHAR(30),
    stay_status_id INTEGER REFERENCES stay_status(id),
    created_at TIMESTAMP,
    is_refunded BOOLEAN,
    user_id INTEGER REFERENCES users(id)
);
```

**Lưu ý:** Không có cột `email`, `phone`, `notes` - lấy từ `users` table qua JOIN

### Bảng `booking_items`:

```sql
CREATE TABLE booking_items (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    room_id INTEGER REFERENCES rooms(id),
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    room_price NUMERIC(10,2)
);
```

### Bảng `booking_services`:

```sql
CREATE TABLE booking_services (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    service_id INTEGER REFERENCES services(id),
    quantity INTEGER,
    total_service_price NUMERIC(10,2)
);
```

### Bảng `stay_status`:

```sql
1 | reserved    | Đã đặt phòng
2 | checked_in  | Khách đã nhận phòng
3 | checked_out | Khách đã trả phòng
4 | canceled    | Đã hủy
5 | no_show     | Khách không đến
6 | pending     | Đang đợi xác nhận
```

### Bảng `users`:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR,
    email VARCHAR UNIQUE,
    password VARCHAR,
    phone VARCHAR,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    status VARCHAR
);
```

---

## ❌ VẤN ĐỀ PHÁT HIỆN

### 1. **Backend INSERT thiếu cột `is_refunded`**

**File:** `backend/models/bookingsmodel.js:99-100`

❌ **HIỆN TẠI:**

```javascript
INSERT INTO bookings (customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, created_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
```

✅ **NÊN LÀ:**

```javascript
INSERT INTO bookings (customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, created_at, is_refunded)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), FALSE)
```

**Hậu quả:**

- Cột `is_refunded` sẽ là NULL thay vì FALSE
- Có thể gây lỗi khi query hoặc logic refund

---

### 2. **Frontend Type thiếu `is_refunded`**

**File:** `penstar/src/types/bookings.ts:14-30`

❌ **HIỆN TẠI:**

```typescript
export type Booking = {
  id?: number;
  customer_name: string;
  email?: string;
  phone?: string;
  notes?: string;
  total_price: number;
  payment_status: string;
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  items: BookingItem[];
  services?: BookingService[];
  created_at?: string;
  stay_status_name?: string;
};
```

✅ **NÊN THÊM:**

```typescript
export type Booking = {
  id?: number;
  customer_name: string;
  total_price: number;
  payment_status: string;
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean; // ← THÊM DÒNG NÀY
  items: BookingItem[];
  services?: BookingService[];
  created_at?: string;
  stay_status_name?: string;
  // email, phone lấy từ users qua JOIN - không lưu trong bookings
  email?: string;
  phone?: string;
};
```

---

### 3. **Logic kiểm tra phòng trống SAI**

**File:** `backend/models/bookingsmodel.js:85`

❌ **ĐÃ SỬA (trước đó):**

```javascript
AND b.stay_status_id NOT IN (4, 5, 6)  // SAI - loại trừ pending!
```

✅ **ĐÃ SỬA THÀNH:**

```javascript
AND b.stay_status_id IN (1, 2, 6)  // ĐÚNG - chỉ tính booking đang chiếm phòng
```

---

### 4. **Comment documentation sai**

**File:** `backend/models/bookingsmodel.js:133`

✅ **ĐÃ SỬA**

---

## ✅ CÁC PHẦN ĐÚNG

### Backend Models:

- ✅ `booking_items` INSERT: Đúng tất cả cột
- ✅ `booking_services` INSERT: Đúng tất cả cột
- ✅ JOIN queries: Đúng - lấy email, phone từ users
- ✅ Foreign keys: Đúng tất cả

### Frontend Types:

- ✅ `BookingItem`: Đúng
- ✅ `BookingService`: Đúng
- ✅ `BookingShort`: Đúng
- ✅ `BookingDetails`: Đúng
- ✅ `BookingUpdatePayload`: Đúng

### Controllers:

- ✅ Validation: Đúng
- ✅ Error handling: Tốt
- ✅ Transaction handling: Đúng

---

## 🔧 CÁCH SỬA

### Sửa Backend - thêm `is_refunded`:

**File:** `backend/models/bookingsmodel.js:99-107`

```javascript
const insertBookingText = `INSERT INTO bookings (customer_name, total_price, payment_status, booking_method, stay_status_id, user_id, created_at, is_refunded)
  VALUES ($1, $2, $3, $4, $5, $6, NOW(), FALSE) RETURNING *`;
const bookingRes = await client.query(insertBookingText, [
  customer_name,
  total_price,
  payment_status,
  booking_method,
  stay_status_id,
  user_id,
]);
```

### Sửa Frontend Type:

**File:** `penstar/src/types/bookings.ts`

```typescript
export type Booking = {
  id?: number;
  customer_name: string;
  total_price: number;
  payment_status: string;
  booking_method: string;
  stay_status_id: number;
  user_id?: number;
  is_refunded?: boolean; // ← THÊM
  items: BookingItem[];
  services?: BookingService[];
  created_at?: string;
  stay_status_name?: string;
  email?: string;
  phone?: string;
};
```

---

## 📋 TÓM TẮT

| Vấn đề                           | File                 | Mức độ          | Trạng thái |
| -------------------------------- | -------------------- | --------------- | ---------- |
| Thiếu `is_refunded` trong INSERT | bookingsmodel.js:99  | ⚠️ Trung bình   | Cần sửa    |
| Thiếu `is_refunded` trong Type   | bookings.ts:14       | ⚠️ Trung bình   | Cần sửa    |
| Logic kiểm tra phòng SAI         | bookingsmodel.js:85  | 🔴 Nghiêm trọng | ✅ Đã sửa  |
| Comment documentation sai        | bookingsmodel.js:133 | ℹ️ Nhỏ          | ✅ Đã sửa  |

**Kết luận:** Cần sửa 2 vấn đề về `is_refunded` để hoàn chỉnh!
