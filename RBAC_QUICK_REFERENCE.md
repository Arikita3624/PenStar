# 🎯 Quick Reference - Phân Quyền PenStar

## Bảng Tóm tắt Quyền truy cập

| Feature              | Customer | Staff       | Manager   | Admin     |
| -------------------- | -------- | ----------- | --------- | --------- |
| **Frontend Routes**  |
| Homepage, Rooms      | ✅       | ✅          | ✅        | ✅        |
| Đặt phòng online     | ✅       | ✅          | ✅        | ✅        |
| Xem booking của mình | ✅       | ✅          | ✅        | ✅        |
| **Walk-in Booking**  | ❌       | ✅          | ✅        | ✅        |
| Admin Dashboard      | ❌       | ✅ (simple) | ✅ (full) | ✅ (full) |
| Quản lý Bookings     | ❌       | ✅          | ✅        | ✅        |
| Quản lý Rooms        | ❌       | ✅          | ✅        | ✅        |
| Quản lý Services     | ❌       | ✅          | ✅        | ✅        |
| Quản lý Floors       | ❌       | ✅          | ✅        | ✅        |
| **Quản lý Users**    | ❌       | ❌          | ✅        | ✅        |
| **Quản lý Roles**    | ❌       | ❌          | ❌        | ✅        |

## Role Levels

```
4 - ADMIN (Full Access)
3 - MANAGER (Users + All Staff features)
2 - STAFF (Operations + Bookings)
1 - CUSTOMER (Booking only)
```

## Test Commands

### Create Test Users (SQL)

```sql
-- Customer
INSERT INTO users (email, password, role_id, full_name)
VALUES ('customer@test.com', 'hashed_password', 1, 'Test Customer');

-- Staff
INSERT INTO users (email, password, role_id, full_name)
VALUES ('staff@test.com', 'hashed_password', 2, 'Test Staff');

-- Manager
INSERT INTO users (email, password, role_id, full_name)
VALUES ('manager@test.com', 'hashed_password', 3, 'Test Manager');

-- Admin
INSERT INTO users (email, password, role_id, full_name)
VALUES ('admin@test.com', 'hashed_password', 4, 'Test Admin');
```

### Generate JWT Token (Node.js)

```javascript
import jwt from "jsonwebtoken";
const token = jwt.sign(
  {
    id: 1,
    email: "staff@test.com",
    role: "staff",
    role_id: 2,
  },
  process.env.JWT_SECRET || "dev-secret",
  { expiresIn: "7d" }
);
console.log(token);
```

## Common Issues

### 403 Forbidden

- Check token in localStorage: `penstar_token`
- Verify token contains `role` or `role_id`
- Check role level matches requirement

### Redirect to /signin

- Token expired or missing
- Re-login to get new token

### Menu not showing

- Check Sidebar filter logic
- Verify `isManagerOrAbove` for Users menu

## API Testing (Postman/cURL)

```bash
# Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@test.com","password":"password123"}'

# Get all bookings (Staff+)
curl -X GET http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get users (Manager+)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get roles (Admin only)
curl -X GET http://localhost:5000/api/roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend Route Protection Examples

```tsx
// Customer only
<RequireRole role="customer">
  <MyBookings />
</RequireRole>

// Staff and above
<RequireRole role="staff">
  <StaffBookingCreate />
</RequireRole>

// Manager and above
<RequireRole role="manager">
  <Userslist />
</RequireRole>

// Admin only
<RequireRole role="admin">
  <RolesManagement />
</RequireRole>
```

## Backend Route Protection Examples

```javascript
// Staff and above
router.get("/bookings", requireAuth, requireRole("staff"), getBookings);

// Manager and above
router.get("/users", requireAuth, requireRole("manager"), listUsers);

// Admin only
router.get("/roles", requireAuth, requireRole("admin"), getRoles);
```

---

**Xem full documentation:** `RBAC_SYSTEM_DOCUMENTATION.md`
