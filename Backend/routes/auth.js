const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../db");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password, city, college, skills } = req.body;

  if (!name || !email || !password || !city || !college) {
    return res
      .status(400)
      .json({ error: "Name, email, password, city and college are required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const cleanEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existing) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: cleanEmail,
      passwordHash,
      city,
      college,
      skills: Array.isArray(skills) ? skills : [],
    },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      college: true,
      skills: true,
      role: true,
    },
  });

  res.status(201).json(user);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  const passwordOk = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordOk) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      city: user.city,
      college: user.college,
      skills: user.skills,
      role: user.role,
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      college: true,
      bio: true,
      skills: true,
      role: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

module.exports = router;