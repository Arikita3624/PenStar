# 🔄 Admin Role Management Feature

## Tổng quan

Admin có thể cập nhật role của tất cả tài khoản **NGOẠI TRỪ** tài khoản đang đăng nhập hiện tại.

## Tính năng đã triển khai

### Frontend (`Userslist.tsx`)

#### 1. Nút "Change" Role

- Hiển thị bên cạnh Tag role trong cột "Role"
- **Ẩn với:**
  - ✅ Tài khoản hiện tại (không thể tự đổi role)
  - ✅ Manager (chỉ admin mới thấy nút này)
- **Hiển thị với:**
  - ✅ Admin đăng nhập
  - ✅ Tất cả users khác (không phải chính mình)

#### 2. Modal Cập nhật Role

**Trigger:** Click nút "Change" bên cạnh role

**Nội dung:**

- Thông tin user: Name + Email
- Dropdown chọn role mới (Select component)
- Hiển thị tất cả roles từ database
- Mỗi option có:
  - Tag màu theo role
  - Description của role

**Validation:**

- ⚠️ Cảnh báo đỏ nếu đang cố thay đổi role của chính mình
- Nút "OK" vẫn disable logic check

**Actions:**

- ✅ OK → Gọi API update role
- ❌ Cancel → Đóng modal, reset state

#### 3. Disable Edit/Ban cho chính mình

- Nút "Edit" và "Ban/Unban" trong cột Action
- **Disabled** khi `record.id === currentUserId`
- Ngăn admin tự ban hoặc chỉnh sửa chính mình

### Backend

#### 1. Model Update (`usersmodel.js`)

```javascript
export const updateUser = async (id, data) => {
  // Dynamic update - chỉ update fields được gửi lên
  // Hỗ trợ: full_name, email, password, phone, role_id, status
};
```

**Trước:** Yêu cầu tất cả fields
**Sau:** Chỉ update fields có trong `data` object

#### 2. Controller Validation (`userscontroller.js`)

**Check 1: Không tự đổi role chính mình**

```javascript
if (userId === currentUserId && req.body.role_id !== undefined) {
  return res.status(403).json({
    message: "You cannot change your own role",
  });
}
```

**Check 2: Chỉ admin mới được đổi role**

```javascript
if (req.body.role_id !== undefined) {
  const userRole = req.user.role.toLowerCase();
  if (userRole !== "admin") {
    return res.status(403).json({
      message: "Only admins can change user roles",
    });
  }
}
```

**Kết quả:**

- ✅ Admin có thể đổi role của users khác
- ❌ Admin KHÔNG thể đổi role của chính mình
- ❌ Manager KHÔNG thể đổi role (chỉ sửa thông tin khác)

#### 3. Route Permission (`users.js`)

```javascript
router.put("/:id", requireAuth, requireRole("manager"), updateUserController);
```

- Manager+ có thể update users
- Nhưng controller có logic: **chỉ admin mới được update role_id**

---

## Flow hoạt động

### Scenario 1: Admin đổi role của Staff

```
1. Admin login → vào /admin/users
2. Thấy nút "Change" bên cạnh Staff role
3. Click "Change" → Modal mở
4. Chọn role mới: Manager
5. Click OK
6. Frontend: POST /api/users/:id với { role_id: 3 }
7. Backend:
   - Check: userId !== currentUserId ✅
   - Check: userRole === "admin" ✅
   - Update database ✅
8. Success message → Table refresh → Staff giờ là Manager
```

### Scenario 2: Admin cố đổi role chính mình

```
1. Admin login → vào /admin/users
2. KHÔNG thấy nút "Change" bên cạnh role của mình (ẩn)
3. Nếu bypass frontend và gọi API trực tiếp:
   - Backend: userId === currentUserId ❌
   - Response: 403 "You cannot change your own role"
```

### Scenario 3: Manager cố đổi role

```
1. Manager login → vào /admin/users
2. KHÔNG thấy nút "Change" (isAdmin = false)
3. Nếu bypass frontend và gọi API:
   - Backend: userRole !== "admin" ❌
   - Response: 403 "Only admins can change user roles"
4. Manager vẫn có thể update full_name, email, phone, status
```

---

## API Specification

### PUT `/api/users/:id`

**Headers:**

```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body (Partial Update):**

```json
{
  "role_id": 2 // Chỉ admin mới được gửi field này
}
```

**Success Response (200):**

```json
{
  "user": {
    "id": 5,
    "full_name": "John Doe",
    "email": "john@example.com",
    "role_id": 2,
    "role_name": "staff",
    "status": "active"
  }
}
```

**Error Responses:**

**403 - Self Role Change:**

```json
{
  "message": "You cannot change your own role"
}
```

**403 - Non-Admin:**

```json
{
  "message": "Only admins can change user roles"
}
```

**404 - User Not Found:**

```json
{
  "message": "User not found"
}
```

---

## Testing Guide

### Test Case 1: Admin Updates Another User's Role ✅

```bash
# Login as Admin
POST /api/users/login
{
  "email": "admin@test.com",
  "password": "admin123"
}
# Response: { "token": "..." }

# Update user ID 5 to Staff (role_id: 2)
PUT /api/users/5
Authorization: Bearer <admin_token>
{
  "role_id": 2
}
# Expected: 200 OK, user role updated
```

### Test Case 2: Admin Tries to Change Own Role ❌

```bash
# Admin is user ID 1
PUT /api/users/1
Authorization: Bearer <admin_token>
{
  "role_id": 2
}
# Expected: 403 "You cannot change your own role"
```

### Test Case 3: Manager Tries to Change Role ❌

```bash
# Login as Manager
POST /api/users/login
{
  "email": "manager@test.com",
  "password": "manager123"
}

# Try to update user role
PUT /api/users/5
Authorization: Bearer <manager_token>
{
  "role_id": 3
}
# Expected: 403 "Only admins can change user roles"
```

### Test Case 4: Manager Updates User Info (Not Role) ✅

```bash
PUT /api/users/5
Authorization: Bearer <manager_token>
{
  "full_name": "Updated Name",
  "phone": "0987654321"
}
# Expected: 200 OK, user info updated (role unchanged)
```

---

## UI/UX Details

### Role Tag Colors

```typescript
const roleColorMap = {
  admin: "red", // 🔴 Admin
  manager: "blue", // 🔵 Manager
  staff: "green", // 🟢 Staff
  customer: "gold", // 🟡 Customer
};
```

### Modal Layout

```
┌─────────────────────────────────────┐
│ Update User Role              [X]   │
├─────────────────────────────────────┤
│                                     │
│ User:                               │
│ John Doe (john@example.com)         │
│                                     │
│ Select New Role:                    │
│ ┌─────────────────────────────────┐ │
│ │ [🔵 staff] - Nhân viên lễ tân  │ │
│ └─────────────────────────────────┘ │
│                                     │
│          [Cancel]  [OK]             │
└─────────────────────────────────────┘
```

### Disabled States

- Edit button: Grayed out for current user
- Ban button: Grayed out for current user
- Change link: Hidden for current user or if not admin

---

## Files Modified

### Frontend

1. ✅ `penstar/src/components/pages/admin/users/Userslist.tsx`
   - Added: Modal state management
   - Added: `isAdmin` check
   - Added: `handleOpenRoleModal()`, `handleUpdateRole()`
   - Added: "Change" button in Role column
   - Added: Role update Modal with Select
   - Added: Disabled Edit/Ban for current user
   - Added: `updateRoleMut` mutation

### Backend

2. ✅ `backend/models/usersmodel.js`

   - Modified: `updateUser()` - Dynamic field update
   - Supports partial updates (only provided fields)

3. ✅ `backend/controllers/userscontroller.js`
   - Added: Self-role-change prevention
   - Added: Admin-only role update check
   - Validates `req.body.role_id` separately

---

## Security Considerations

### Frontend Protection

1. ✅ Hide "Change" button from non-admins
2. ✅ Hide "Change" button for current user
3. ✅ Disable Edit/Ban for current user
4. ⚠️ **Not sufficient alone** - can be bypassed

### Backend Protection (Critical)

1. ✅ JWT authentication required
2. ✅ Manager+ role required to access endpoint
3. ✅ Admin role required to update `role_id`
4. ✅ Cannot update own role (userId check)
5. ✅ Validates JWT payload `req.user`

### Double Protection Strategy

```
Frontend Check → Backend Check
     ↓                ↓
  Hide UI     +   API Validation
  (UX only)      (Real security)
```

---

## Known Limitations

1. **Manager can see users page** but cannot change roles

   - Solution: This is by design (view permission)

2. **No audit log** for role changes

   - Future: Add `role_changes` table

3. **No confirmation dialog** before role change
   - Current: Direct update on OK
   - Future: Add "Are you sure?" step

---

## Future Enhancements

1. 📝 **Role Change History**

   - Track who changed what role when
   - Show in user detail page

2. 🔔 **Email Notification**

   - Notify user when their role is changed
   - Admin receives confirmation

3. ⚠️ **Confirmation Dialog**

   - "Are you sure you want to change X to Y?"
   - Prevent accidental changes

4. 🔒 **Super Admin Role**

   - Level 5: Can change admin roles
   - Current admins cannot change each other

5. 📊 **Bulk Role Update**
   - Select multiple users
   - Change all to same role at once

---

**Date Created:** November 3, 2025  
**Feature:** Admin Role Management  
**Status:** ✅ Production Ready
