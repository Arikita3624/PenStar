import {
  getRooms as modelGetRooms,
  getRoomID as modelGetRoomById,
  createRoom as modelCreateRoom,
  updateRoom as modelUpdateRoom,
  deleteRoom as modelDeleteRoom,
  existsRoomWithName,
  searchAvailableRooms as modelSearchAvailableRooms,
  hasActiveBookings,
} from "../models/roomsmodel.js";

// 🏨 GET all rooms
export const getRooms = async (req, res) => {
  try {
    const data = await modelGetRooms();
    res.json({
      success: true,
      message: "✅ Get all rooms successfully",
      data,
    });
  } catch (error) {
    console.error("roomscontroller.createRoom error:", error);
    // handle PostgreSQL foreign key violation (error.code === '23503')
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: related record not found",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🏨 GET room by ID
export const getRoomID = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    const room = await modelGetRoomById(numericId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "❌ Room not found",
      });
    }

    res.json({
      success: true,
      message: "✅ Get room by ID successfully",
      data: room,
    });
  } catch (error) {
    console.error("roomscontroller.updateRoom error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: related record not found",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🏨 CREATE room
export const createRoom = async (req, res) => {
  try {
    const { name, type_id } = req.body;
    const numericTypeId = type_id !== undefined ? Number(type_id) : undefined;

    // Check trùng tên phòng tuyệt đối
    if (name) {
      const exists = await existsRoomWithName(name);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Tên phòng đã tồn tại. Vui lòng chọn tên khác.",
        });
      }
    }

    // ensure numeric fields are numbers for the model
    const payload = { ...req.body, type_id: numericTypeId };
    const newRoom = await modelCreateRoom(payload);
    res.status(201).json({
      success: true,
      message: "✅ Room created successfully",
      data: newRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🏨 UPDATE room
export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    // ⚠️ Check if room has active bookings
    const isBooked = await hasActiveBookings(numericId);

    // Nếu phòng có booking active, chỉ cho phép sửa một số trường an toàn
    if (isBooked) {
      const allowedFields = [
        "status",
        "description",
        "long_description",
        "thumbnail",
      ];
      const requestedFields = Object.keys(req.body);
      const hasRestrictedField = requestedFields.some(
        (field) => !allowedFields.includes(field)
      );

      if (hasRestrictedField) {
        return res.status(400).json({
          success: false,
          message:
            "❌ Phòng đang có booking active. Chỉ có thể sửa: trạng thái, mô tả, hình ảnh",
        });
      }
    }

    const { name, type_id } = req.body;
    const numericTypeId = type_id !== undefined ? Number(type_id) : undefined;

    // Check trùng tên phòng tuyệt đối (exclude ID hiện tại)
    if (name) {
      const exists = await existsRoomWithName(name, numericId);
      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Tên phòng đã tồn tại. Vui lòng chọn tên khác.",
        });
      }
    }

    const payload = { ...req.body };
    if (numericTypeId !== undefined) payload.type_id = numericTypeId;
    const updated = await modelUpdateRoom(numericId, payload);
    res.json({
      success: true,
      message: "✅ Room updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🗑️ DELETE room
export const deleteRoom = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);
  try {
    // ⚠️ Check if room has active bookings
    const isBooked = await hasActiveBookings(numericId);
    if (isBooked) {
      return res.status(400).json({
        success: false,
        message: "❌ Không thể xóa phòng đang có booking active",
      });
    }

    const deleted = await modelDeleteRoom(numericId);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }
    res.json({
      success: true,
      message: "✅ Room deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("roomscontroller.deleteRoom error:", error);
    if (error && error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Foreign key constraint failed: cannot delete",
        error: error.message,
      });
    }
    res.status(500).json({
      success: false,
      message: "🚨 Internal server error",
      error: error.message,
    });
  }
};

// 🔍 SEARCH available rooms
export const searchRooms = async (req, res) => {
  try {
    const {
      check_in,
      check_out,
      room_type_id,
      floor_id,
      num_adults,
      num_children,
    } = req.query;

    // Validate required fields
    if (!check_in || !check_out) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập ngày check-in và check-out",
      });
    }

    // Convert to numbers
    const numAdults = num_adults ? Number(num_adults) : 1;
    const numChildren = num_children ? Number(num_children) : 0;
    const roomTypeId = room_type_id ? Number(room_type_id) : null;
    const floorId = floor_id ? Number(floor_id) : null;

    const rooms = await modelSearchAvailableRooms({
      check_in,
      check_out,
      room_type_id: roomTypeId,
      floor_id: floorId,
      num_adults: numAdults,
      num_children: numChildren,
    });

    res.json({
      success: true,
      message: `✅ Tìm thấy ${rooms.length} phòng trống`,
      data: rooms,
      search_params: {
        check_in,
        check_out,
        room_type_id: roomTypeId,
        floor_id: floorId,
        num_adults: numAdults,
        num_children: numChildren,
        total_guests: numAdults + numChildren,
      },
    });
  } catch (error) {
    console.error("roomscontroller.searchRooms error:", error);
    res.status(500).json({
      success: false,
      message: "🚨 Lỗi tìm kiếm phòng",
      error: error.message,
    });
  }
};
