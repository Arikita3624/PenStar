import pool from "../db.js";
import {
  getRoomImages,
  getRoomImageById,
  getRoomImagesByRoomId,
  createRoomImage,
  updateRoomImage,
  deleteRoomImage,
} from "../models/room_images.js";
import fs from "fs";
import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads", "rooms");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".jpg";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

export const uploadMiddleware = multer({ storage });

// GET all room images
export const getAllRoomImages = async (req, res) => {
  try {
    const images = await getRoomImages();
    res.json({
      success: true,
      message: "✅ Fetched all room images",
      data: images,
    });
  } catch (error) {
    console.error("roomimagescontroller.getAllRoomImages error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET image by id
export const getRoomImage = async (req, res) => {
  const { id } = req.params;
  try {
    const image = await getRoomImageById(Number(id));
    if (!image) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }
    res.json({ success: true, message: "✅ Fetched room image", data: image });
  } catch (error) {
    console.error("roomimagescontroller.getRoomImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET images by room id
export const getImagesByRoom = async (req, res) => {
  const { roomId } = req.params;
  try {
    const images = await getRoomImagesByRoomId(Number(roomId));
    res.json({
      success: true,
      message: "✅ Fetched images for room",
      data: images,
    });
  } catch (error) {
    console.error("roomimagescontroller.getImagesByRoom error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST create image
export const createImage = async (req, res) => {
  try {
    const newImage = await createRoomImage(req.body);
    res.status(201).json({
      success: true,
      message: "✅ Created room image",
      data: newImage,
    });
  } catch (error) {
    console.error("roomimagescontroller.createImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// POST upload file for a room: multipart/form-data -> file field 'file'
export const uploadImageForRoom = async (req, res) => {
  try {
    // Debug: log incoming file info
    console.log(
      "[uploadImageForRoom] req.file:",
      req.file && {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      }
    );

    if (!req.file) {
      console.warn("[uploadImageForRoom] No req.file received");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const { roomId } = req.params;
    const { is_thumbnail } = req.body;
    const filename = req.file.filename;
    const filePath = path.join(process.cwd(), "uploads", "rooms", filename);
    try {
      const exists = fs.existsSync(filePath);
      console.log(`[uploadImageForRoom] filePath=${filePath} exists=${exists}`);
    } catch (statErr) {
      console.warn(
        "[uploadImageForRoom] fs.existsSync error:",
        statErr.message
      );
    }
    const imageUrl = `${req.protocol}://${req.get(
      "host"
    )}/uploads/rooms/${filename}`;

    // start a transaction for thumbnail changes + insert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (String(is_thumbnail) === "true" || is_thumbnail === true) {
        await client.query(
          "UPDATE room_images SET is_thumbnail = false WHERE room_id = $1 AND is_thumbnail = true",
          [Number(roomId)]
        );
      }
      const insertRes = await client.query(
        `INSERT INTO room_images (room_id, image_url, is_thumbnail) VALUES ($1,$2,$3) RETURNING id, room_id, image_url, is_thumbnail, created_at`,
        [
          Number(roomId),
          imageUrl,
          String(is_thumbnail) === "true" || is_thumbnail === true,
        ]
      );
      const newImage = insertRes.rows[0];
      if (newImage.is_thumbnail) {
        await client.query("UPDATE rooms SET thumbnail = $1 WHERE id = $2", [
          imageUrl,
          Number(roomId),
        ]);
      }
      await client.query("COMMIT");
      res
        .status(201)
        .json({ success: true, message: "Uploaded", data: newImage });
    } catch (e) {
      await client.query("ROLLBACK");
      // attempt to remove uploaded file if transaction fails
      try {
        const filePath = path.join(process.cwd(), "uploads", "rooms", filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.warn(
          "Failed to unlink uploaded file after transaction failure:",
          unlinkErr.message
        );
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("roomimagescontroller.uploadImageForRoom error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT update image
export const updateImage = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await updateRoomImage(Number(id), req.body);
    res.json({
      success: true,
      message: "✅ Updated room image",
      data: updated,
    });
  } catch (error) {
    console.error("roomimagescontroller.updateImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE image
export const deleteImage = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteRoomImage(Number(id));
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found" });
    }
    res.json({
      success: true,
      message: "✅ Deleted room image",
      data: deleted,
    });
  } catch (error) {
    console.error("roomimagescontroller.deleteImage error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
