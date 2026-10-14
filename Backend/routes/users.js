const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.put("/me", requireAuth, async (req, res) => {
  const data = {};

  for (const field of ["name", "city", "college"]) {
    if (req.body[field] !== undefined) {
      const value = String(req.body[field]).trim();
      if (!value) {
        return res.status(400).json({ error: `${field} cannot be empty` });
      }
      data[field] = value;
    }
  }

  for (const field of ["bio", "contact"]) {
    if (req.body[field] !== undefined) {
      data[field] = String(req.body[field]).trim() || null;
    }
  }

  if (req.body.skills !== undefined) {
    if (!Array.isArray(req.body.skills)) {
      return res.status(400).json({ error: "Skills must be a list" });
    }
    data.skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      college: true,
      bio: true,
      contact: true,
      skills: true,
      role: true,
    },
  });

  res.json(user);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      college: true,
      bio: true,
      skills: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

module.exports = router;