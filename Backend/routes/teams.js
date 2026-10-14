const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { hackathonId, name, skillsNeeded, spotsNeeded } = req.body;

  const hId = Number(hackathonId);
  if (!Number.isInteger(hId)) {
    return res.status(400).json({ error: "A valid hackathonId is required" });
  }
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Team name is required" });
  }
  if (!Array.isArray(skillsNeeded)) {
    return res.status(400).json({ error: "skillsNeeded must be a list" });
  }

  const spots = Number(spotsNeeded);
  if (!Number.isInteger(spots) || spots < 1) {
    return res
      .status(400)
      .json({ error: "spotsNeeded must be a whole number of at least 1" });
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
  if (spots > hackathon.maxTeamSize - 1) {
    return res.status(400).json({
      error: `This hackathon allows at most ${hackathon.maxTeamSize} people per team, so you can ask for at most ${hackathon.maxTeamSize - 1} more`,
    });
  }

  const alreadyOnTeam = await prisma.teamMember.findUnique({
    where: {
      userId_hackathonId: { userId: req.user.id, hackathonId: hId },
    },
  });
  if (alreadyOnTeam) {
    return res
      .status(409)
      .json({ error: "You are already on a team for this hackathon" });
  }

  const team = await prisma.team.create({
    data: {
      name: String(name).trim(),
      skillsNeeded: skillsNeeded.map((s) => String(s).trim()).filter(Boolean),
      spotsNeeded: spots,
      hackathonId: hId,
      leaderId: req.user.id,
      members: {
        create: { userId: req.user.id, hackathonId: hId },
      },
    },
    include: {
      leader: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  res.status(201).json(team);
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

  const where = { hackathonId: hId };
  if (req.query.includeFull !== "true") {
    where.spotsNeeded = { gt: 0 };
  }

  const teams = await prisma.team.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      leader: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  res.json(teams);
});

module.exports = router;