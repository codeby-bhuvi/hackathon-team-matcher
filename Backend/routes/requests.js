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

router.get("/", requireAuth, async (req, res) => {
  const include = {
    team: { select: { id: true, name: true, hackathonId: true } },
    user: { select: { id: true, name: true } },
    sender: { select: { id: true, name: true } },
  };

  const received = await prisma.request.findMany({
    where: {
      OR: [
        { type: "JOIN", team: { leaderId: req.user.id } },
        { type: "INVITE", userId: req.user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    include,
  });

  const sent = await prisma.request.findMany({
    where: { senderId: req.user.id },
    orderBy: { createdAt: "desc" },
    include,
  });

  res.json({ received, sent });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { action } = req.body;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid request id" });
  }
  if (!["ACCEPT", "DECLINE"].includes(action)) {
    return res.status(400).json({ error: "Action must be ACCEPT or DECLINE" });
  }

  const request = await prisma.request.findUnique({
    where: { id },
    include: { team: true },
  });
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  const responderId =
    request.type === "JOIN" ? request.team.leaderId : request.userId;
  if (responderId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Only the person who received this request can answer it" });
  }
  if (request.status !== "PENDING") {
    return res.status(409).json({ error: "This request was already answered" });
  }

  if (action === "DECLINE") {
    const declined = await prisma.request.update({
      where: { id },
      data: { status: "DECLINED" },
    });
    return res.json(declined);
  }

  const alreadyOnTeam = await prisma.teamMember.findUnique({
    where: {
      userId_hackathonId: {
        userId: request.userId,
        hackathonId: request.team.hackathonId,
      },
    },
  });
  if (alreadyOnTeam) {
    return res.status(409).json({
      error: "That person has already joined a team for this hackathon",
    });
  }

  try {
    const accepted = await prisma.$transaction(async (tx) => {
      const spot = await tx.team.updateMany({
        where: { id: request.teamId, spotsNeeded: { gt: 0 } },
        data: { spotsNeeded: { decrement: 1 } },
      });
      if (spot.count === 0) {
        throw new Error("TEAM_FULL");
      }

      await tx.teamMember.create({
        data: {
          teamId: request.teamId,
          userId: request.userId,
          hackathonId: request.team.hackathonId,
        },
      });

      await tx.soloEntry.deleteMany({
        where: {
          userId: request.userId,
          hackathonId: request.team.hackathonId,
        },
      });

      return tx.request.update({
        where: { id },
        data: { status: "ACCEPTED" },
        include: {
          team: { select: { id: true, name: true, spotsNeeded: true } },
          user: { select: { id: true, name: true } },
        },
      });
    });

    res.json(accepted);
  } catch (err) {
    if (err.message === "TEAM_FULL") {
      return res.status(409).json({ error: "This team is already full" });
    }
    throw err;
  }
});

module.exports = router;