import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { DatePicker, Select, Input, Button, message } from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  HomeOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import type { RoomSearchParams } from "@/types/room";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface RoomSearchBarProps {
  onSearch: (params: RoomSearchParams) => void;
  loading?: boolean;
  variant?: "floating" | "inline"; // floating cho HomePage, inline cho Results
  requireAuthForSearch?: boolean; // if true, redirect to signin when not authenticated
}

const RoomSearchBar: React.FC<RoomSearchBarProps> = ({
  onSearch,
  loading,
  variant = "inline",
  requireAuthForSearch = true,
}) => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [dates, setDates] = useState<[Dayjs, Dayjs] | null>(null);
  const [promoCode, setPromoCode] = useState("");

  const handleSearch = () => {
    // If required, check authentication and redirect to signin
    if (requireAuthForSearch && auth?.initialized && !auth?.token) {
      message.error("Vui lòng đăng nhập để tìm kiếm và đặt phòng");
      navigate("/signin");
      return;
    }
    if (!dates || dates.length !== 2) {
      message.warning("Vui lòng chọn ngày check-in và check-out");
      return;
    }

    const searchParams: RoomSearchParams = {
      check_in: dates[0].format("YYYY-MM-DD"),
      check_out: dates[1].format("YYYY-MM-DD"),
      promo_code: promoCode || undefined,
    };
    onSearch(searchParams);
  };

  const containerClass =
    variant === "floating"
      ? "absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 w-full max-w-6xl px-4 z-20"
      : "w-full max-w-6xl mx-auto";

  return (
    <div className={containerClass}>
      <div
        className="bg-white p-6"
        style={{
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex flex-wrap gap-3 items-center">
          {/* Dates */}
          <div className="flex-1 min-w-[250px]">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Ngày nhận - trả phòng
            </div>
            <RangePicker
              size="large"
              format="DD/MM/YYYY"
              placeholder={["Check-in", "Check-out"]}
              suffixIcon={<CalendarOutlined />}
              className="w-full border-0 bg-gray-50"
              style={{ borderRadius: 0 }}
              disabledDate={(current) => {
                return current && current < dayjs().startOf("day");
              }}
              onChange={(values) => {
                if (values && values[0] && values[1]) {
                  setDates([values[0], values[1]]);
                } else {
                  setDates(null);
                }
              }}
            />
          </div>

          {/* Đã xóa phần chọn số lượng phòng. Số lượng phòng sẽ chọn ở từng loại phòng trong RoomSearchResults. */}

          {/* Mã khuyến mãi */}
          <div className="flex-1 min-w-[180px]">
            <div className="text-xs font-semibold text-gray-700 mb-1">
              Mã khuyến mãi
            </div>
            <Input
              size="large"
              placeholder="Nhập mã khuyến mãi"
              prefix={<GiftOutlined className="text-orange-500" />}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="border-0 bg-gray-50"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Button */}
          <div className="self-end">
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
              className="h-[40px] px-8 font-bold"
              style={{
                background: "#fbbf24",
                borderColor: "#fbbf24",
                borderRadius: 0,
              }}
            >
              TÌM KIẾM
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSearchBar;
