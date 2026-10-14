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

module.exports = router;