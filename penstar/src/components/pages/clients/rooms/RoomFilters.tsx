import { Select } from "antd";
import type { Floors } from "@/types/floors";

interface RoomFiltersProps {
  floors: Floors[];
  floorFilter: number | null;
  setFloorFilter: (id: number | null) => void;
}

const RoomFilters = ({
  floors,
  floorFilter,
  setFloorFilter,
}: RoomFiltersProps) => (
  <div className="flex items-center gap-3">
    <span className="text-gray-700 font-semibold">Lọc theo tầng:</span>
    <Select
      placeholder="Tất cả tầng"
      allowClear
      style={{ width: 200, borderRadius: 0 }}
      value={floorFilter}
      onChange={(value) => setFloorFilter(value || null)}
      size="large"
    >
      {Array.isArray(floors) &&
        floors.map((floor) => (
          <Select.Option key={floor.id} value={floor.id}>
            {floor.name}
          </Select.Option>
        ))}
    </Select>
  </div>
);

export default RoomFilters;
