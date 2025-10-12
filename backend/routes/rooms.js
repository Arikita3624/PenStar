import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create room
router.post("/", async (req, res) => {
  const { name, type_id, price, capacity, description, status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO rooms (name, type_id, price, capacity, description, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type_id, price, capacity, description, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update room
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type_id, price, capacity, description, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rooms
       SET name=$1, type_id=$2, price=$3, capacity=$4, description=$5, status=$6
       WHERE id=$7 RETURNING *`,
      [name, type_id, price, capacity, description, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE room
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM rooms WHERE id=$1", [id]);
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
