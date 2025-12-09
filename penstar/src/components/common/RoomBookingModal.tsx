import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, DatePicker, Button, message, InputNumber } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import type { Room } from "@/types/room";
import type { RoomType } from "@/types/roomtypes";
import type { RoomBookingConfig } from "@/types/roomBooking";

const { RangePicker } = DatePicker;

interface RoomBookingModalProps {
  open: boolean;
  onCancel: () => void;
  room: Room | null;
  roomType: RoomType | null;
}

const RoomBookingModal = ({
  open,
  onCancel,
  room,
  roomType,
}: RoomBookingModalProps) => {
  const navigate = useNavigate();
  const [bookingDates, setBookingDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [dateError, setDateError] = useState<string | null>(null); // Lỗi validation ngày

  // Giới hạn tối đa 4 người (không tính em bé) - mặc định
  const MAX_GUESTS_DEFAULT = 4;
  const maxCapacity = Math.min(
    roomType?.capacity || MAX_GUESTS_DEFAULT,
    MAX_GUESTS_DEFAULT
  );
  const maxAdults = roomType?.max_adults || 4;
  const maxChildren = roomType?.max_children || 0;

  const handleCancel = () => {
    setBookingDates(null);
    setNumAdults(1);
    setNumChildren(0);
    onCancel();
  };

  const handleSubmit = () => {
    if (!bookingDates || !bookingDates[0] || !bookingDates[1]) {
      message.warning("Vui lòng chọn ngày check-in và check-out");
      return;
    }

    if (!room || !roomType) {
      message.error("Thông tin phòng không hợp lệ");
      return;
    }

    const checkInDate = bookingDates[0];
    const checkOutDate = bookingDates[1];

    // Kiểm tra check-out phải sau check-in
    if (checkOutDate.isBefore(checkInDate) || checkOutDate.isSame(checkInDate)) {
      message.warning("Ngày check-out phải sau ngày check-in.");
      return;
    }

    // Validate tổng số người (không tính em bé) không vượt quá 4
    const totalGuests = numAdults + numChildren;
    if (totalGuests > MAX_GUESTS_DEFAULT) {
      message.error(`Tổng số người (${totalGuests}) không được vượt quá ${MAX_GUESTS_DEFAULT} người (không bao gồm em bé)`);
      return;
    }
    if (totalGuests > maxCapacity) {
      message.error(`Tổng số người (${totalGuests}) không được vượt quá ${maxCapacity} người`);
      return;
    }

    // Validate số người lớn có thể vượt quá tối đa 1 người (max_adults + 1)
    const maxAllowedAdults = maxAdults + 1;
    if (numAdults > maxAllowedAdults) {
      message.error(`Số người lớn (${numAdults}) vượt quá giới hạn cho phép (tối đa ${maxAllowedAdults} người, trong đó ${maxAdults} người tiêu chuẩn + 1 người vượt quá)`);
      return;
    }

    // Validate số trẻ em không vượt quá max_children (nếu max_children > 0)
    if (maxChildren > 0 && numChildren > maxChildren) {
      message.error(`Số trẻ em (${numChildren}) không được vượt quá ${maxChildren} người`);
      return;
    }

    // Tính số đêm
    const nights = Math.max(
      1,
      bookingDates[1].diff(bookingDates[0], "day")
    );

    // Tính phụ phí
    const excessAdults = Math.max(0, numAdults - (roomType.max_adults || 0));
    const excessChildren = Math.max(0, numChildren - (roomType.max_children || 0));
    const adultSurcharge = excessAdults * (roomType.adult_surcharge || 0);
    const childSurcharge = excessChildren * (roomType.child_surcharge || 0);
    const totalSurcharge = adultSurcharge + childSurcharge;
    const baseRoomPrice = (roomType.price || 0) * nights;
    const totalRoomPriceWithSurcharge = baseRoomPrice + totalSurcharge;

    // Chuẩn bị dữ liệu để chuyển đến trang đặt phòng
    const searchParams = {
      check_in: bookingDates[0].format("YYYY-MM-DD"),
      check_out: bookingDates[1].format("YYYY-MM-DD"),
    };

    const roomsConfig: RoomBookingConfig[] = [
      {
        room_id: room.id,
        room_type_id: room.type_id,
        num_adults: numAdults,
        num_children: numChildren,
        price: totalRoomPriceWithSurcharge,
      },
    ];

    // Điều hướng đến trang đặt phòng
    navigate("/booking/multi-create", {
      state: {
        selectedRoomIds: [room.id],
        autoAssign: false,
        roomTypeId: room.type_id,
        roomPrice: roomType.price || 0,
        searchParams,
        roomsConfig,
        items: [
          {
            room_id: room.id,
            room_type_id: room.type_id,
            room_type_name: roomType.name || "",
            num_adults: numAdults,
            num_children: numChildren,
            room_type_price: totalRoomPriceWithSurcharge,
            adult_surcharge_total: adultSurcharge,
            child_surcharge_total: childSurcharge,
            check_in: searchParams.check_in,
            check_out: searchParams.check_out,
          },
        ],
      },
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-blue-600" />
          <span>Chọn ngày đặt phòng</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={500}
      centered
    >
      <div className="py-4 space-y-4">
        {/* Date Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ngày nhận - trả phòng *
          </label>
          <RangePicker
            size="large"
            format="DD/MM/YYYY"
            placeholder={["Check-in", "Check-out"]}
            className="w-full"
            disabledDate={(current) => {
              return current && current < dayjs().startOf("day");
            }}
            onChange={(values) => {
              if (values && values[0] && values[1]) {
                setBookingDates([values[0], values[1]]);
                
                // Reset error
                setDateError(null);
                
                // Kiểm tra check-out phải sau check-in
                const checkInDate = values[0];
                const checkOutDate = values[1];
                if (checkOutDate.isBefore(checkInDate) || checkOutDate.isSame(checkInDate)) {
                  setDateError("Ngày check-out phải sau ngày check-in.");
                  return;
                }
              } else {
                setBookingDates(null);
                setDateError(null);
              }
            }}
          />
          {/* Hiển thị lỗi validation ngày */}
          {dateError && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              ⚠️ {dateError}
            </div>
          )}
        </div>

        {/* Number of guests */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số người lớn *
              </label>
              <InputNumber
                size="large"
                min={1}
                max={Math.min(maxAdults + 1, maxCapacity - numChildren)}
                value={numAdults}
                onChange={(value) => {
                  const newAdults = value || 1;
                  setNumAdults(newAdults);
                  // Tự động điều chỉnh số trẻ em nếu tổng vượt quá capacity
                  const remainingCapacity = maxCapacity - newAdults;
                  if (numChildren > remainingCapacity) {
                    setNumChildren(Math.max(0, remainingCapacity));
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trẻ em (6-11t)
              </label>
              <InputNumber
                size="large"
                min={0}
                max={Math.min(maxChildren, maxCapacity - numAdults)}
                value={numChildren}
                onChange={(value) => {
                  const newChildren = value || 0;
                  setNumChildren(newChildren);
                  // Tự động điều chỉnh số người lớn nếu tổng vượt quá capacity
                  const remainingCapacity = maxCapacity - newChildren;
                  if (numAdults > remainingCapacity) {
                    setNumAdults(Math.max(1, remainingCapacity));
                  }
                }}
                disabled={numAdults >= maxCapacity}
                className="w-full"
              />
            </div>
          </div>
          {/* Thông tin capacity */}
          <div className="mt-2">
            <div className="text-xs text-gray-500">
              Tối đa: {maxCapacity} người (không bao gồm em bé) - Đã chọn: {numAdults + numChildren}/{maxCapacity}
            </div>
            {numAdults > maxAdults && roomType && (
              <div className="text-xs text-orange-600 mt-1">
                ⚠️ Vượt quá {maxAdults} người lớn tiêu chuẩn. Sẽ tính thêm phụ phí: {((numAdults - maxAdults) * (roomType.adult_surcharge || 0)).toLocaleString('vi-VN')} ₫
              </div>
            )}
            {numAdults + numChildren >= maxCapacity && (
              <div className="text-xs text-orange-600 mt-1">
                Đã đạt tối đa {maxCapacity} người, không thể thêm khách
              </div>
            )}
          </div>
        </div>

        {/* Price preview */}
        {bookingDates && roomType && (() => {
          const nights = Math.max(1, bookingDates[1].diff(bookingDates[0], "day"));
          const basePrice = (roomType.price || 0) * nights;
          const excessAdults = Math.max(0, numAdults - (roomType.max_adults || 0));
          const adultSurcharge = excessAdults * (roomType.adult_surcharge || 0);
          // Phụ phí trẻ em chỉ tính khi vượt quá max_children
          const excessChildren = Math.max(0, numChildren - (roomType.max_children || 0));
          const childSurcharge = excessChildren * (roomType.child_surcharge || 0);
          const totalSurcharge = adultSurcharge + childSurcharge;
          const totalPrice = basePrice + totalSurcharge;
          
          return (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Số đêm:</span>
                <span className="font-semibold">{nights} đêm</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Giá phòng:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(basePrice)}
                </span>
              </div>
              {adultSurcharge > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-orange-600">Phụ phí người lớn ({excessAdults} người):</span>
                  <span className="font-semibold text-orange-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(adultSurcharge)}
                  </span>
                </div>
              )}
              {childSurcharge > 0 && (
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-orange-600">Phụ phí trẻ em ({excessChildren} trẻ vượt quá):</span>
                  <span className="font-semibold text-orange-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(childSurcharge)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-blue-300">
                <span className="text-sm font-semibold text-gray-700">Tổng tiền:</span>
                <span className="text-lg font-bold text-blue-600">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalPrice)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Submit button */}
        <div className="pt-4 flex gap-3">
          <Button className="flex-1" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            type="primary"
            className="flex-1"
            size="large"
            disabled={!bookingDates || !bookingDates[0] || !bookingDates[1] || !!dateError}
            onClick={handleSubmit}
          >
            Tiếp tục đặt phòng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RoomBookingModal;

