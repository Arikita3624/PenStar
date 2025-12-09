# Room Policies & Extra Fees Implementation

## Overview

Implemented comprehensive room type policies display and transparent extra fee calculation for guests exceeding base occupancy. This allows each room type to have different cancellation policies, payment terms, check-in/out times, and per-person extra fees.

## Database Changes

### New Columns Added to `room_types` Table

```sql
ALTER TABLE room_types
  ADD COLUMN base_adults INTEGER DEFAULT 2,
  ADD COLUMN base_children INTEGER DEFAULT 0,
  ADD COLUMN extra_adult_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN extra_child_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN child_age_limit INTEGER DEFAULT 12,
  ADD COLUMN policies JSONB;
```

### Fields Explanation

- **base_adults**: Number of adults included in base price (no extra fees)
- **base_children**: Number of children included in base price (no extra fees)
- **extra_adult_fee**: Fee per additional adult per night (VND)
- **extra_child_fee**: Fee per additional child per night (VND)
- **child_age_limit**: Age threshold for child pricing (default: 12)
- **policies**: JSON object containing all policies (see structure below)

### Policy JSON Structure

```json
{
  "cancellation": "Hủy miễn phí trước 48h. Hủy trong vòng 24h trước checkin sẽ tính phí 100%.",
  "payment": "Thanh toán 100% khi nhận phòng. Chấp nhận tiền mặt, thẻ tín dụng, chuyển khoản.",
  "checkin": "14:00 - 22:00",
  "checkout": "12:00",
  "extra_fees": "Phụ phí tính theo số đêm nghỉ. Không hoàn lại khi checkout sớm.",
  "other_policies": [
    "Không hút thuốc trong phòng",
    "Không được nuôi thú cưng",
    "Trẻ em dưới 6 tuổi ở chung giường với bố mẹ được miễn phí"
  ]
}
```

### Sample Data Updated

Room types with IDs 10, 11, 12 have been populated with complete policy data:

- **Deluxe (ID 10)**: 2 adults + 1 child base, 200,000 VND extra adult, 100,000 VND extra child
- **Suite (ID 11)**: 2 adults + 2 children base, 300,000 VND extra adult, 150,000 VND extra child
- **Superior (ID 12)**: 2 adults + 0 children base, 150,000 VND extra adult, 75,000 VND extra child

## Backend Updates

### File: `backend/models/roomtypemodel.js`

#### Updated Functions

1. **getRoomTypes()** - Added new fields to SELECT query and object mapping
2. **getRoomTypeById()** - Added new fields to SELECT query

#### New Fields Returned

```javascript
{
  id: 10,
  name: "Deluxe",
  base_adults: 2,
  base_children: 1,
  extra_adult_fee: 200000,
  extra_child_fee: 100000,
  child_age_limit: 12,
  policies: {
    cancellation: "...",
    payment: "...",
    checkin: "14:00 - 22:00",
    checkout: "12:00",
    extra_fees: "...",
    other_policies: [...]
  },
  // ... other existing fields
}
```

## Frontend Updates

### File: `penstar/src/types/roomtypes.ts`

#### New Interface: `RoomTypePolicy`

```typescript
export interface RoomTypePolicy {
  cancellation?: string;
  payment?: string;
  checkin?: string;
  checkout?: string;
  extra_fees?: string;
  other_policies?: string[];
}
```

#### Updated Interface: `RoomType`

Added new optional fields:

```typescript
export interface RoomType {
  // ... existing fields
  base_adults?: number;
  base_children?: number;
  extra_adult_fee?: number;
  extra_child_fee?: number;
  child_age_limit?: number;
  policies?: RoomTypePolicy;
}
```

### File: `penstar/src/components/pages/clients/rooms/RoomTypeCard.tsx`

#### New Features

##### 1. Policy Modal

- New state: `policyModalOpen`
- Displays comprehensive room policies in organized sections:
  - 📋 Room capacity information
  - 💰 Extra guest fees
  - 🚫 Cancellation policy
  - 💳 Payment policy
  - 🕐 Check-in/out times
  - 📝 Other policies

##### 2. "Xem chi tiết chính sách" Button

- Added next to room quantity selector
- Opens policy modal on click
- Provides easy access to detailed policies before booking

##### 3. Extra Fee Calculator

- New function: `calculateRoomExtraFees(roomIndex)`
- Calculates extra fees based on:
  - Number of adults vs base_adults
  - Number of children vs base_children
  - Respective fee rates
- Returns breakdown:
  ```typescript
  {
    extraAdults: number,
    extraChildren: number,
    adultFees: number,
    childFees: number,
    totalExtraFees: number
  }
  ```

##### 4. Real-time Fee Display

- Shows extra fees calculation for each room
- Appears below guest selection when fees apply
- Displays:
  - Extra adults count × fee = subtotal
  - Extra children count × fee = subtotal
  - Total extra fees per night
- Styled with warning color (#fffbf0 background, #ffe58f border)

#### Updated Booking Flow

When user confirms booking, includes proper type data:

```javascript
{
  room_id: number,
  room_type_id: number,  // Added
  num_adults: number,
  num_children: number,
  price: number,          // Added (base price)
}
```

## Business Logic

### Capacity Validation

- **capacity**: Hard limit (e.g., 4 people maximum)
- **base_adults + base_children**: Included in base price
- **Extra guests**: Can be added up to capacity limit with extra fees
- **Validation**: `total_guests ≤ capacity`

### Fee Calculation Formula

```
Extra Adults = max(0, selected_adults - base_adults)
Extra Children = max(0, selected_children - base_children)

Adult Fees = Extra Adults × extra_adult_fee × nights
Child Fees = Extra Children × extra_child_fee × nights

Total Extra Fees = Adult Fees + Child Fees
Total Room Cost = (base_price + extra_fees_per_night) × nights
```

### Example Calculation

**Room Type**: Deluxe (ID 10)

- Base price: 1,500,000 VND/night
- Base occupancy: 2 adults + 1 child
- Extra adult fee: 200,000 VND/night
- Extra child fee: 100,000 VND/night

**Booking**: 3 adults + 2 children for 2 nights

- Extra adults: 3 - 2 = 1
- Extra children: 2 - 1 = 1
- Extra fees/night: (1 × 200,000) + (1 × 100,000) = 300,000 VND
- **Total cost**: (1,500,000 + 300,000) × 2 = **3,600,000 VND**

## User Experience Improvements

### Transparency

✅ Clear display of what's included in base price  
✅ Itemized extra fee breakdown  
✅ Real-time calculation as guests change selection  
✅ Comprehensive policy information accessible before booking

### Flexibility

✅ Each room type has independent policies and fees  
✅ Different cancellation terms per room type  
✅ Flexible occupancy with transparent pricing

### Usability

✅ "Xem chi tiết chính sách" button next to room selector  
✅ Modal-based policy display (non-intrusive)  
✅ Emoji icons for easy section identification  
✅ Formatted pricing with Vietnamese locale

## Testing Recommendations

### Backend API Testing

```bash
# Test getRoomTypes with new fields
curl http://localhost:5000/api/roomtypes

# Test getRoomTypeById
curl http://localhost:5000/api/roomtypes/10
```

### Frontend Testing

1. Navigate to room search results page
2. Select a room type (expand details)
3. Click "Xem chi tiết chính sách" button
4. Verify policy modal displays correctly
5. Select number of rooms
6. Adjust guest counts to exceed base occupancy
7. Verify extra fee calculation displays correctly
8. Verify fee updates in real-time when changing guest counts

### Edge Cases to Test

- Room with no policies defined
- Room with zero extra fees
- Guest count exactly matching base occupancy (no fees)
- Guest count exceeding capacity (should show warning)
- Multiple rooms with different guest counts

## Future Enhancements

### Potential Additions

1. **Total Booking Summary**: Display aggregate extra fees for all selected rooms
2. **Policy Comparison**: Side-by-side comparison of policies across room types
3. **Seasonal Pricing**: Different base prices and fees for peak/off-peak seasons
4. **Age-based Validation**: Validate child ages against child_age_limit
5. **Dynamic Pricing**: Adjust fees based on occupancy rate or demand
6. **Policy Templates**: Admin UI to create reusable policy templates
7. **Multi-language Policies**: Support for policies in multiple languages

## Migration & Deployment

### Database Migration

```sql
-- Add new columns (already executed)
ALTER TABLE room_types
  ADD COLUMN base_adults INTEGER DEFAULT 2,
  ADD COLUMN base_children INTEGER DEFAULT 0,
  ADD COLUMN extra_adult_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN extra_child_fee NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN child_age_limit INTEGER DEFAULT 12,
  ADD COLUMN policies JSONB;

-- Populate sample data for existing room types
UPDATE room_types SET
  base_adults = 2,
  base_children = 1,
  extra_adult_fee = 200000,
  extra_child_fee = 100000,
  policies = '{"cancellation": "...", "payment": "...", ...}'::jsonb
WHERE id = 10;
```

### Deployment Steps

1. ✅ Update database schema (completed)
2. ✅ Update backend models (completed)
3. ✅ Update frontend types (completed)
4. ✅ Update UI components (completed)
5. ⏳ Test all room types
6. ⏳ Populate policies for remaining room types
7. ⏳ Update admin panel to allow policy editing

## Related Files Modified

### Backend

- `backend/models/roomtypemodel.js` - Added new fields to queries and responses

### Frontend

- `penstar/src/types/roomtypes.ts` - Added RoomTypePolicy interface and fields
- `penstar/src/components/pages/clients/rooms/RoomTypeCard.tsx` - Added policy modal and fee calculator

### Documentation

- This file: `ROOM_POLICIES_AND_FEES_IMPLEMENTATION.md`

## Notes

- The implementation is backward compatible - rooms without policies defined will display "Không có thông tin chính sách"
- Extra fees are optional - rooms can have zero fees for additional guests
- The policy modal uses emoji icons for better visual organization
- All monetary values are formatted using Vietnamese locale (vi-VN)
- The calculation is done client-side for immediate feedback; should be validated server-side during booking creation
