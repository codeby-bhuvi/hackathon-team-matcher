const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { scoreMatch } = require("../matching");

const router = express.Router();

router.get("/teams", requireAuth, async (req, res) => {
  const hId = Number(req.query.hackathonId);
  if (!Number.isInteger(hId)) {
    return res.status(400).json({ error: "A valid hackathonId is required" });
  }

  const hackathon = await prisma.hackathon.findUnique({ where: { id: hId } });
  if (!hackathon || (hackathon.hidden && req.user.role !== "ADMIN")) {
    return res.status(404).json({ error: "Hackathon not found" });
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

  const me = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { skills: true, city: true, college: true },
  });

  const teams = await prisma.team.findMany({
    where: { hackathonId: hId, spotsNeeded: { gt: 0 } },
    include: {
      leader: { select: { id: true, name: true, city: true, college: true } },
      members: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  const ranked = teams
    .map((team) => {
      const { score, matchedSkills } = scoreMatch({
        skills: me.skills,
        needed: team.skillsNeeded,
        city: me.city,
        otherCity: team.leader.city,
        college: me.college,
        otherCollege: team.leader.college,
      });
      return { ...team, score, matchedSkills };
    })
    .sort((a, b) => b.score - a.score);

  res.json(ranked);
});

router.get("/solo", requireAuth, async (req, res) => {
  const teamId = Number(req.query.teamId);
  if (!Number.isInteger(teamId)) {
    return res.status(400).json({ error: "A valid teamId is required" });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { leader: { select: { city: true, college: true } } },
  });
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }
  if (team.leaderId !== req.user.id) {
    return res
      .status(403)
      .json({ error: "Only the team leader can see matches for this team" });
  }

  const taken = await prisma.teamMember.findMany({
    where: { hackathonId: team.hackathonId },
    select: { userId: true },
  });

  const entries = await prisma.soloEntry.findMany({
    where: {
      hackathonId: team.hackathonId,
      userId: { notIn: taken.map((t) => t.userId) },
    },
    include: {
      user: {
        select: { id: true, name: true, city: true, college: true, skills: true },
      },
    },
  });

  const ranked = entries
    .map((entry) => {
      const { score, matchedSkills } = scoreMatch({
        skills: entry.user.skills,
        needed: team.skillsNeeded,
        city: entry.user.city,
        otherCity: team.leader.city,
        college: entry.user.college,
        otherCollege: team.leader.college,
      });
      return { ...entry, score, matchedSkills };
    })
    .sort((a, b) => b.score - a.score);

  res.json(ranked);
});

module.exports = router;