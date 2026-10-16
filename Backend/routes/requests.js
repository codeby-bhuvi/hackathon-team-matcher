const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { type, teamId, userId, message } = req.body;

  if (!["JOIN", "INVITE"].includes(type)) {
    return res.status(400).json({ error: "Type must be JOIN or INVITE" });
  }

  const tId = Number(teamId);
  if (!Number.isInteger(tId)) {
    return res.status(400).json({ error: "A valid teamId is required" });
  }

  const team = await prisma.team.findUnique({
    where: { id: tId },
    include: { hackathon: true },
  });
  if (!team || team.hackathon.hidden) {
    return res.status(404).json({ error: "Team not found" });
  }
  if (team.hackathon.deadline < new Date()) {
    return res
      .status(400)
      .json({ error: "The registration deadline for this hackathon has passed" });
  }
  if (team.spotsNeeded < 1) {
    return res.status(409).json({ error: "This team is already full" });
  }

  let soloUserId;
  if (type === "JOIN") {
    soloUserId = req.user.id;
  } else {
    if (team.leaderId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the team leader can send invites" });
    }
    soloUserId = Number(userId);
    if (!Number.isInteger(soloUserId)) {
      return res.status(400).json({ error: "A valid userId is required" });
    }
    if (soloUserId === req.user.id) {
      return res.status(400).json({ error: "You cannot invite yourself" });
    }
  }

  const onTeam = await prisma.teamMember.findUnique({
    where: {
      userId_hackathonId: { userId: soloUserId, hackathonId: team.hackathonId },
    },
  });
  if (onTeam) {
    return res.status(409).json({
      error:
        type === "JOIN"
          ? "You are already on a team for this hackathon"
          : "That person is already on a team for this hackathon",
    });
  }

  const solo = await prisma.soloEntry.findUnique({
    where: {
      userId_hackathonId: { userId: soloUserId, hackathonId: team.hackathonId },
    },
  });
  if (!solo) {
    return res.status(400).json({
      error:
        type === "JOIN"
          ? "List yourself as looking for a team before sending a request"
          : "That person is not listed as looking for a team",
    });
  }

  const pending = await prisma.request.findFirst({
    where: { teamId: tId, userId: soloUserId, status: "PENDING" },
  });
  if (pending) {
    return res
      .status(409)
      .json({ error: "There is already a pending request between them" });
  }

  const request = await prisma.request.create({
    data: {
      type,
      teamId: tId,
      userId: soloUserId,
      senderId: req.user.id,
      message: message ? String(message).trim() : null,
    },
    include: {
      team: { select: { id: true, name: true, hackathonId: true } },
      user: { select: { id: true, name: true } },
      sender: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(request);
});

module.exports = router;