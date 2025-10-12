// routes/branches.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// GET all branches
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM branches ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
