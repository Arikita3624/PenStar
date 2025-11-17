# 🔐 HỆ THỐNG PHÂN QUYỀN PENSTAR - ROLE-BASED ACCESS CONTROL (RBAC)

## 📋 Tổng quan

Hệ thống phân quyền đã được triển khai hoàn chỉnh với 4 roles:

1. **Customer** (ID: 1) - Khách hàng thông thường
2. **Staff** (ID: 2) - Nhân viên lễ tân
3. **Manager** (ID: 3) - Quản lý khách sạn
4. **Admin** (ID: 4) - Quản trị hệ thống

---

## 🎯 Ma trận Phân quyền Chi tiết

### 1️⃣ CUSTOMER (Khách hàng)

#### Frontend Routes

✅ **Public Access:**

- `/` - Homepage
- `/home` - Homepage
- `/rooms` - Danh sách phòng
- `/rooms/:id` - Chi tiết phòng
- `/rooms/search-results` - Kết quả tìm kiếm
- `/signup` - Đăng ký
- `/signin` - Đăng nhập

✅ **Authenticated Access (require login):**

- `/booking/multi-create` - Đặt nhiều phòng online
- `/bookings` - Xem bookings của mình
- `/my-bookings` - Xem bookings của mình
- `/bookings/confirm` - Xác nhận booking
- `/bookings/success/:id` - Trang thành công
- `/bookings/payment-method` - Chọn phương thức thanh toán
- `/payment-result` - Kết quả thanh toán

❌ **Forbidden:**

- `/admin/*` - Tất cả routes admin
- `/booking/staff-create` - Tạo walk-in booking (chỉ staff+)

#### Backend Permissions

✅ **Allowed:**

- `POST /api/users/register` - Đăng ký tài khoản
- `POST /api/users/login` - Đăng nhập
- `GET /api/rooms` - Xem danh sách phòng
- `GET /api/rooms/:id` - Xem chi tiết phòng
- `GET /api/roomtypes` - Xem loại phòng
- `GET /api/services` - Xem dịch vụ
- `POST /api/bookings` - Tạo booking (online)
- `GET /api/bookings/mine` - Xem bookings của mình
- `POST /api/bookings/:id/cancel` - Hủy booking của mình
- `PATCH /api/bookings/:id/my-status` - Cập nhật trạng thái (check-in/out)

❌ **Forbidden:**

- `GET /api/bookings` - Xem tất cả bookings (staff+)
- `PATCH /api/bookings/:id/status` - Cập nhật trạng thái booking (staff+)
- `POST /api/bookings/:id/confirm-checkout` - Xác nhận checkout (staff+)
- Tất cả CUD operations trên rooms, services, floors, roomtypes
- `GET /api/users` - Xem danh sách users (manager+)
- `GET /api/roles` - Xem roles (admin)

---

### 2️⃣ STAFF (Nhân viên lễ tân)

#### Frontend Routes

✅ **Tất cả quyền của Customer +**

✅ **Staff-specific Access:**

- `/booking/staff-create` - Tạo walk-in booking cho khách đến tận nơi
- `/admin` - Dashboard (phiên bản đơn giản)
- `/admin/bookings` - Xem tất cả bookings
- `/admin/bookings/:id` - Chi tiết booking + update status
- `/admin/rooms` - Quản lý phòng (CRUD)
- `/admin/rooms/add` - Thêm phòng
- `/admin/rooms/:id/edit` - Sửa phòng
- `/admin/roomtypes` - Quản lý loại phòng (CRUD)
- `/admin/roomtypes/new` - Thêm loại phòng
- `/admin/roomtypes/:id/edit` - Sửa loại phòng
- `/admin/floors` - Quản lý tầng (CRUD)
- `/admin/floors/new` - Thêm tầng
- `/admin/floors/:id/edit` - Sửa tầng
- `/admin/services` - Quản lý dịch vụ (CRUD)
- `/admin/services/new` - Thêm dịch vụ
- `/admin/services/:id/edit` - Sửa dịch vụ

❌ **Forbidden:**

- `/admin/users` - Quản lý users (manager+)
- Sidebar không hiển thị menu "Users"

#### Backend Permissions

✅ **Tất cả quyền của Customer +**

✅ **Staff-specific:**

- `GET /api/bookings` - Xem tất cả bookings
- `GET /api/bookings/:id` - Xem chi tiết booking
- `PATCH /api/bookings/:id/status` - Cập nhật trạng thái booking
- `POST /api/bookings/:id/confirm-checkout` - Xác nhận checkout
- `POST /api/rooms` - Tạo phòng
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng
- `POST /api/roomtypes` - Tạo loại phòng
- `PUT /api/roomtypes/:id` - Cập nhật loại phòng
- `DELETE /api/roomtypes/:id` - Xóa loại phòng
- `POST /api/floors` - Tạo tầng
- `PUT /api/floors/:id` - Cập nhật tầng
- `DELETE /api/floors/:id` - Xóa tầng
- `POST /api/services` - Tạo dịch vụ
- `PUT /api/services/:id` - Cập nhật dịch vụ
- `DELETE /api/services/:id` - Xóa dịch vụ
- `POST /api/roomimages` - Upload ảnh phòng
- `DELETE /api/roomimages/:id` - Xóa ảnh phòng

❌ **Forbidden:**

- `GET /api/users` - Xem danh sách users (manager+)
- `PUT /api/users/:id` - Cập nhật user (manager+)
- `GET /api/roles` - Xem roles (admin)

#### Dashboard Features

- **Stats Cards:** Bookings, Available Rooms (NO Users, NO Revenue)
- **Recent Activity:** Full access
- **Revenue Chart:** HIDDEN

---

### 3️⃣ MANAGER (Quản lý khách sạn)

#### Frontend Routes

✅ **Tất cả quyền của Staff +**

✅ **Manager-specific Access:**

- `/admin/users` - Quản lý users (xem, thêm, sửa staff/customer)
- Sidebar hiển thị menu "Users"

❌ **Forbidden:**

- `/admin/roles` - Quản lý roles (admin only)

#### Backend Permissions

✅ **Tất cả quyền của Staff +**

✅ **Manager-specific:**

- `GET /api/users` - Xem danh sách users
- `PUT /api/users/:id` - Cập nhật thông tin user (kể cả role_id)

❌ **Forbidden:**

- `GET /api/roles` - Xem roles (admin)
- `POST /api/roles` - Tạo role (admin)
- `PUT /api/roles/:id` - Cập nhật role (admin)
- `DELETE /api/roles/:id` - Xóa role (admin)

#### Dashboard Features

- **Stats Cards:** Total Users, Bookings, Available Rooms, Revenue (FULL)
- **Recent Activity:** Full access
- **Revenue Chart:** VISIBLE

---

### 4️⃣ ADMIN (Quản trị hệ thống)

#### Frontend Routes

✅ **FULL ACCESS** - Tất cả routes

#### Backend Permissions

✅ **FULL ACCESS** - Tất cả endpoints

- Bao gồm cả `/api/roles/*` để quản lý roles

#### Dashboard Features

- **Stats Cards:** FULL (Users, Bookings, Rooms, Revenue)
- **Recent Activity:** Full access
- **Revenue Chart:** VISIBLE

---

## 🔧 Chi tiết Technical Implementation

### Frontend Components

#### 1. `RequireRole.tsx`

```typescript
const ROLE_LEVEL: Record<string, number> = {
  customer: 1,
  staff: 2,
  manager: 3,
  admin: 4,
};
```

**Logic:**

- Decode JWT token từ `localStorage.getItem("penstar_token")`
- Lấy `role` hoặc `role_name` từ token payload
- Map role name → numeric level
- So sánh `userLevel >= minRequired`
- Redirect to `/403` nếu không đủ quyền
- Redirect to `/signin` nếu chưa login

**Usage:**

```tsx
// Require customer or higher
<RequireRole role="customer">
  <MyBookings />
</RequireRole>

// Require staff or higher
<RequireRole role="staff">
  <StaffBookingCreate />
</RequireRole>

// Require manager or higher
<RequireRole role="manager">
  <Userslist />
</RequireRole>

// Require admin only
<RequireRole role="admin">
  <RolesManagement />
</RequireRole>
```

#### 2. `AppRouter.tsx`

- **LayoutClient:** Public + Customer routes với RequireRole wrapper
- **LayoutAdmin:** Staff+ routes với outer `RequireRole role="staff"`
- Nested `RequireRole role="manager"` cho `/admin/users`

#### 3. `Sidebar.tsx` (Admin Layout)

```typescript
const isManagerOrAbove = roleName === "manager" || roleName === "admin";

navItems.filter((item) => {
  if ("requireRole" in item && item.requireRole === "manager") {
    return isManagerOrAbove;
  }
  return true;
});
```

**Logic:**

- Staff: Ẩn menu "Users"
- Manager/Admin: Hiển thị full menu

#### 4. `Dashboard.tsx`

```typescript
const isStaff = roleName === "staff";

// Conditional rendering
{
  !isStaff && <RevenueChart />;
}
{
  !isStaff && <TotalUsersCard />;
}
```

### Backend Middleware

#### 1. `auth.js` - `requireAuth`

```javascript
export const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  const token = auth.split(" ")[1];
  const payload = jwt.verify(token, JWT_SECRET);
  req.user = payload; // { id, email, role, role_id }
  next();
};
```

#### 2. `auth.js` - `requireRole`

```javascript
const ROLE_LEVEL = {
  customer: 0,
  staff: 1,
  manager: 2,
  admin: 3,
};

export const requireRole = (...allowedRoles) => {
  const minLevel = Math.min(...allowedRoles.map((r) => ROLE_LEVEL[r]));
  return (req, res, next) => {
    const userLevel = ROLE_LEVEL[req.user.role.toLowerCase()];
    if (userLevel >= minLevel) return next();
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  };
};
```

#### 3. Backend Routes Examples

**Bookings Router:**

```javascript
router.get("/", requireAuth, requireRole("staff"), getBookings);
router.get("/mine", requireAuth, getMyBookings); // Customer
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("staff"),
  updateBookingStatus
);
```

**Users Router:**

```javascript
router.get("/", requireAuth, requireRole("manager"), listUsers);
router.put("/:id", requireAuth, requireRole("manager"), updateUserController);
```

**Roles Router:**

```javascript
router.get("/", requireAuth, requireRole("admin"), getRoles);
router.post("/", requireAuth, requireRole("admin"), createRole);
```

---

## 🚀 Testing Guide

### Test Case 1: Customer Login

1. Login as customer
2. ✅ Có thể truy cập `/booking/multi-create`
3. ✅ Có thể truy cập `/my-bookings`
4. ❌ Redirect `/403` khi vào `/admin`
5. ❌ Redirect `/403` khi vào `/booking/staff-create`

### Test Case 2: Staff Login

1. Login as staff
2. ✅ Có thể truy cập `/admin` (Dashboard đơn giản)
3. ✅ Có thể truy cập `/admin/bookings`
4. ✅ Có thể truy cập `/booking/staff-create`
5. ✅ Có thể CRUD rooms, services, floors, roomtypes
6. ❌ Sidebar KHÔNG hiển thị menu "Users"
7. ❌ Redirect `/403` khi vào `/admin/users`
8. ✅ Dashboard KHÔNG hiển thị Revenue chart và Total Users card

### Test Case 3: Manager Login

1. Login as manager
2. ✅ Tất cả quyền của Staff
3. ✅ Sidebar hiển thị menu "Users"
4. ✅ Có thể truy cập `/admin/users`
5. ✅ Dashboard hiển thị FULL (Revenue chart + Total Users)

### Test Case 4: Admin Login

1. Login as admin
2. ✅ FULL ACCESS tất cả routes
3. ✅ Dashboard FULL

---

## 📝 Lưu ý Quan trọng

### 1. JWT Token Structure

Token phải chứa:

```json
{
  "id": 123,
  "email": "user@example.com",
  "role": "staff",        // hoặc role_name
  "role_id": 2,
  "iat": 1699...,
  "exp": 1699...
}
```

### 2. Database Roles Table

```sql
SELECT * FROM roles ORDER BY id;
```

| id  | name     | description             |
| --- | -------- | ----------------------- |
| 1   | customer | Khách hàng thông thường |
| 2   | staff    | Nhân viên lễ tân        |
| 3   | manager  | Quản lý khách sạn       |
| 4   | admin    | Quản trị hệ thống       |

### 3. Role Hierarchy

```
admin (4) > manager (3) > staff (2) > customer (1)
```

- Cấp cao hơn có TẤT CẢ quyền của cấp thấp hơn
- Ví dụ: Manager có tất cả quyền của Staff + thêm quyền quản lý Users

### 4. Security Best Practices

- ✅ Frontend validation: RequireRole component
- ✅ Backend validation: requireAuth + requireRole middleware
- ✅ Double-check: Route protection + API protection
- ✅ Sensitive data: Revenue chỉ hiển thị cho Manager+
- ✅ User management: Chỉ Manager+ được xem/sửa users

---

## 🐛 Troubleshooting

### Issue 1: Redirect loop to `/signin`

**Cause:** Token expired hoặc invalid
**Solution:** Check `localStorage.getItem("penstar_token")`, login lại

### Issue 2: 403 Forbidden khi có quyền

**Cause:** Token không chứa `role` hoặc `role_id`
**Solution:** Check login controller, đảm bảo JWT payload có role info

### Issue 3: Sidebar "Users" vẫn hiển thị cho Staff

**Cause:** Filter logic trong Sidebar.tsx
**Solution:** Check `isManagerOrAbove` variable và filter function

### Issue 4: Backend 403 nhưng Frontend pass

**Cause:** Frontend và Backend role check không đồng bộ
**Solution:** Kiểm tra `ROLE_LEVEL` mapping ở cả 2 side

---

## 📦 Files Modified

### Frontend

1. ✅ `penstar/src/components/common/RequireRole.tsx` - Updated ROLE_LEVEL (1-4)
2. ✅ `penstar/src/components/common/Forbidden.tsx` - Created 403 page
3. ✅ `penstar/src/routes/AppRouter.tsx` - Added RequireRole wrappers
4. ✅ `penstar/src/components/layouts/admin/Sidebar.tsx` - Filter menu by role
5. ✅ `penstar/src/components/pages/admin/Dashboard.tsx` - Conditional rendering
6. ✅ `penstar/src/hooks/useAuth.ts` - Fixed type imports

### Backend

7. ✅ `backend/routers/users.js` - Changed admin → manager for users endpoints
8. ✅ `backend/routers/bookings.js` - Already correct (staff for admin ops)
9. ✅ `backend/routers/roles.js` - Already correct (admin only)
10. ✅ `backend/middlewares/auth.js` - Already correct (requireRole middleware)

---

## ✅ Completion Checklist

- [x] RequireRole component updated with correct hierarchy
- [x] Client routes protected with RequireRole
- [x] Admin routes protected with RequireRole
- [x] Sidebar menu filtered by role
- [x] Dashboard conditional rendering by role
- [x] Backend bookings permissions verified
- [x] Backend users permissions updated (manager+)
- [x] Backend roles permissions verified (admin)
- [x] 403 Forbidden page created
- [x] useAuth hook type-safe
- [x] Documentation completed

---

**Date Created:** November 3, 2025  
**Author:** GitHub Copilot  
**Status:** ✅ Production Ready
