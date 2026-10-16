const express = require("express");
const prisma = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/hackathons/hidden", async (req, res) => {
  const hackathons = await prisma.hackathon.findMany({
    where: { hidden: true },
    orderBy: { createdAt: "desc" },
    include: {
      postedBy: { select: { id: true, name: true } },
      reports: { select: { reason: true, createdAt: true } },
      _count: { select: { reports: true } },
    },
  });

  res.json(hackathons);
});

router.post("/hackathons/:id/hide", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid hackathon id" });
  }

  const hackathon = await prisma.hackathon.findUnique({ where: { id } });
  if (!hackathon) {
    return res.status(404).json({ error: "Hackathon not found" });
  }

  await prisma.hackathon.update({ where: { id }, data: { hidden: true } });
  res.json({ message: "Hackathon hidden" });
});

router.post("/hackathons/:id/restore", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid hackathon id" });
  }

  const hackathon = await prisma.hackathon.findUnique({ where: { id } });
  if (!hackathon) {
    return res.status(404).json({ error: "Hackathon not found" });
  }

  await prisma.$transaction([
    prisma.report.deleteMany({ where: { hackathonId: id } }),
    prisma.hackathon.update({ where: { id }, data: { hidden: false } }),
  ]);

  res.json({ message: "Hackathon restored and its reports cleared" });
});

router.delete("/hackathons/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid hackathon id" });
  }

  const hackathon = await prisma.hackathon.findUnique({ where: { id } });
  if (!hackathon) {
    return res.status(404).json({ error: "Hackathon not found" });
  }

  await prisma.$transaction([
    prisma.request.deleteMany({ where: { team: { hackathonId: id } } }),
    prisma.teamMember.deleteMany({ where: { hackathonId: id } }),
    prisma.soloEntry.deleteMany({ where: { hackathonId: id } }),
    prisma.team.deleteMany({ where: { hackathonId: id } }),
    prisma.report.deleteMany({ where: { hackathonId: id } }),
    prisma.hackathon.delete({ where: { id } }),
  ]);

  res.json({ message: "Hackathon deleted permanently" });
});

module.exports = router;