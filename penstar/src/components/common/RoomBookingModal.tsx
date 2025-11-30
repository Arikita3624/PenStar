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

  // Lấy capacity tối đa (tổng số người)
  const maxCapacity = roomType?.capacity || (roomType?.max_adults || 4) + (roomType?.max_children || 0);
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

    // Validate tổng số người không vượt quá capacity
    const totalGuests = numAdults + numChildren;
    if (totalGuests > maxCapacity) {
      message.error(`Tổng số người (${totalGuests}) không được vượt quá ${maxCapacity} người`);
      return;
    }

    // Validate số người lớn không vượt quá max_adults
    if (numAdults > maxAdults) {
      message.error(`Số người lớn (${numAdults}) không được vượt quá ${maxAdults} người`);
      return;
    }

    // Validate số trẻ em không vượt quá max_children
    if (numChildren > maxChildren) {
      message.error(`Số trẻ em (${numChildren}) không được vượt quá ${maxChildren} người`);
      return;
    }

    // Tính số đêm
    const nights = Math.max(
      1,
      bookingDates[1].diff(bookingDates[0], "day")
    );

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
        price: (roomType.price || 0) * nights,
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
            room_type_price: (roomType.price || 0) * nights,
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
              } else {
                setBookingDates(null);
              }
            }}
          />
        </div>

        {/* Number of guests */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số người lớn *
              </label>
              <InputNumber
                size="large"
                min={1}
                max={Math.min(maxAdults, maxCapacity - numChildren)}
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
                Số trẻ em
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
              Tối đa: {maxCapacity} người (đã chọn: {numAdults + numChildren}/{maxCapacity})
            </div>
            {numAdults >= maxCapacity && (
              <div className="text-xs text-orange-600 mt-1">
                Đã đạt tối đa {maxCapacity} người, không thể thêm trẻ em
              </div>
            )}
          </div>
        </div>

        {/* Price preview */}
        {bookingDates && roomType && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Số đêm:</span>
              <span className="font-semibold">
                {Math.max(
                  1,
                  bookingDates[1].diff(bookingDates[0], "day")
                )}{" "}
                đêm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tổng tiền:</span>
              <span className="text-lg font-bold text-blue-600">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  (roomType.price || 0) *
                    Math.max(1, bookingDates[1].diff(bookingDates[0], "day"))
                )}
              </span>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="pt-4 flex gap-3">
          <Button className="flex-1" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            type="primary"
            className="flex-1"
            size="large"
            disabled={!bookingDates || !bookingDates[0] || !bookingDates[1]}
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

