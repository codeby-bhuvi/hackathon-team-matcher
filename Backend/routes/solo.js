const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { hackathonId, note } = req.body;

  const hId = Number(hackathonId);
  if (!Number.isInteger(hId)) {
    return res.status(400).json({ error: "A valid hackathonId is required" });
  }

  const hackathon = await prisma.hackathon.findUnique({ where: { id: hId } });
  if (!hackathon || hackathon.hidden) {
    return res.status(404).json({ error: "Hackathon not found" });
  }
  if (hackathon.deadline < new Date()) {
    return res
      .status(400)
      .json({ error: "The registration deadline for this hackathon has passed" });
  }

  const onTeam = await prisma.teamMember.findUnique({
    where: {
      userId_hackathonId: { userId: req.user.id, hackathonId: hId },
    },
  });
  if (onTeam) {
    return res
      .status(409)
      .json({ error: "You are already on a team for this hackathon" });
  }

  const existing = await prisma.soloEntry.findUnique({
    where: {
      userId_hackathonId: { userId: req.user.id, hackathonId: hId },
    },
  });
  if (existing) {
    return res
      .status(409)
      .json({ error: "You are already listed as looking for a team" });
  }

  const entry = await prisma.soloEntry.create({
    data: {
      userId: req.user.id,
      hackathonId: hId,
      note: note ? String(note).trim() : null,
    },
    include: {
      user: { select: { id: true, name: true, city: true, college: true, skills: true } },
    },
  });

  res.status(201).json(entry);
});

router.get("/", requireAuth, async (req, res) => {
  const hId = Number(req.query.hackathonId);
  if (!Number.isInteger(hId)) {
    return res.status(400).json({ error: "A valid hackathonId is required" });
  }

  const hackathon = await prisma.hackathon.findUnique({ where: { id: hId } });
  if (!hackathon || (hackathon.hidden && req.user.role !== "ADMIN")) {
    return res.status(404).json({ error: "Hackathon not found" });
  }

  const entries = await prisma.soloEntry.findMany({
    where: { hackathonId: hId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, city: true, college: true, skills: true },
      },
    },
  });

  res.json(entries);
});

module.exports = router;