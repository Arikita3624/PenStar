import { createUser, getUsers, getUserByEmail, getUserById } from "../models/usersmodel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const existing = await getUserByEmail(email);
    if (existing)
      return res.status(409).json({ message: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);
    // Do not allow client to set role_id on registration. createUser will assign default.
    const user = await createUser({
      full_name,
      email,
      password: hashed,
      phone,
    });

    // Do not return password
    delete user.password;
    return res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await getUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // role_name column is returned by model (via LEFT JOIN) as user.role_name
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("[backend] login: generated token, length:", token.length);
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await getUsers();
    // strip passwords
    const safe = users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
    return res.json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    console.log("[backend] getCurrentUser headers:", req.headers.authorization);
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password;
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserController = async (req, res) => {
  const { id } = req.params;
  const userId = String(id);
  const currentUserId = String(req.user?.id);

  // Prevent users from changing their own role
  if (userId === currentUserId && req.body.role_id !== undefined) {
    return res.status(403).json({
      message: "You cannot change your own role",
    });
  }

  // Only admin can change roles (role_id in request body)
  if (req.body.role_id !== undefined) {
    const userRole = (req.user.role || req.user.role_name || "")
      .toString()
      .toLowerCase();
    if (userRole !== "admin") {
      return res.status(403).json({
        message: "Only admins can change user roles",
      });
    }
  }

  try {
    const { updateUser } = await import("../models/usersmodel.js");
    const updated = await updateUser(id, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });
    delete updated.password;
    return res.json({ user: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
