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
        pastHackathons: {
        select: { id: true, name: true, year: true, result: true },
        orderBy: { year: "desc" },
      },
      projects: {
        select: { id: true, title: true, description: true, link: true },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

router.post("/me/past-hackathons", requireAuth, async (req, res) => {
  const { name, year, result } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Hackathon name is required" });
  }
  const y = Number(year);
  const maxYear = new Date().getFullYear() + 1;
  if (!Number.isInteger(y) || y < 2000 || y > maxYear) {
    return res.status(400).json({ error: "Please enter a valid year" });
  }

  const count = await prisma.pastHackathon.count({
    where: { userId: req.user.id },
  });
  if (count >= 20) {
    return res.status(400).json({ error: "You can add at most 20 past hackathons" });
  }

  const entry = await prisma.pastHackathon.create({
    data: {
      name: String(name).trim(),
      year: y,
      result: result ? String(result).trim() : null,
      userId: req.user.id,
    },
  });

  res.status(201).json(entry);
});

router.delete("/me/past-hackathons/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const removed = await prisma.pastHackathon.deleteMany({
    where: { id, userId: req.user.id },
  });
  if (removed.count === 0) {
    return res.status(404).json({ error: "Entry not found" });
  }

  res.json({ message: "Removed" });
});

router.post("/me/projects", requireAuth, async (req, res) => {
  const { title, description, link } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Project title is required" });
  }
  if (link && !/^https?:\/\//i.test(String(link))) {
    return res
      .status(400)
      .json({ error: "Link must start with http:// or https://" });
  }

  const count = await prisma.project.count({ where: { userId: req.user.id } });
  if (count >= 20) {
    return res.status(400).json({ error: "You can add at most 20 projects" });
  }

  const project = await prisma.project.create({
    data: {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      link: link ? String(link).trim() : null,
      userId: req.user.id,
    },
  });

  res.status(201).json(project);
});

router.delete("/me/projects/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const removed = await prisma.project.deleteMany({
    where: { id, userId: req.user.id },
  });
  if (removed.count === 0) {
    return res.status(404).json({ error: "Entry not found" });
  }

  res.json({ message: "Removed" });
});

module.exports = router;