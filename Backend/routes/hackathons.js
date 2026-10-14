const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const {
    name,
    organizer,
    description,
    link,
    mode,
    city,
    startDate,
    endDate,
    deadline,
    minTeamSize,
    maxTeamSize,
  } = req.body;

  if (!name || !organizer || !link || !mode || !startDate || !endDate || !deadline) {
    return res.status(400).json({
      error:
        "Name, organizer, link, mode, start date, end date and deadline are required",
    });
  }

  if (!["ONLINE", "IN_PERSON", "HYBRID"].includes(mode)) {
    return res
      .status(400)
      .json({ error: "Mode must be ONLINE, IN_PERSON or HYBRID" });
  }

  if (mode !== "ONLINE" && !city) {
    return res
      .status(400)
      .json({ error: "City is required for in-person or hybrid hackathons" });
  }

  if (!/^https?:\/\//i.test(link)) {
    return res
      .status(400)
      .json({ error: "Link must start with http:// or https://" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const deadlineDate = new Date(deadline);
  if ([start, end, deadlineDate].some((d) => isNaN(d.getTime()))) {
    return res.status(400).json({ error: "One of the dates is not valid" });
  }
  if (end < start) {
    return res
      .status(400)
      .json({ error: "End date cannot be before the start date" });
  }

  const min = Number(minTeamSize);
  const max = Number(maxTeamSize);
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min) {
    return res.status(400).json({
      error: "Team sizes must be whole numbers, with max at least equal to min",
    });
  }

  const hackathon = await prisma.hackathon.create({
    data: {
      name: name.trim(),
      organizer: organizer.trim(),
      description: description ? String(description).trim() : null,
      link: link.trim(),
      mode,
      city: city ? String(city).trim() : null,
      startDate: start,
      endDate: end,
      deadline: deadlineDate,
      minTeamSize: min,
      maxTeamSize: max,
      postedById: req.user.id,
    },
  });

  res.status(201).json(hackathon);
});

router.get("/", requireAuth, async (req, res) => {
  const { city, q, includePast } = req.query;

  const where = { hidden: false };

  if (city) {
    where.city = { equals: String(city).trim(), mode: "insensitive" };
  }
  if (q) {
    where.name = { contains: String(q).trim(), mode: "insensitive" };
  }
  if (includePast !== "true") {
    where.deadline = { gte: new Date() };
  }

  const hackathons = await prisma.hackathon.findMany({
    where,
    orderBy: { deadline: "asc" },
    include: { postedBy: { select: { id: true, name: true } } },
  });

  res.json(hackathons);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid hackathon id" });
  }

  const hackathon = await prisma.hackathon.findUnique({
    where: { id },
    include: { postedBy: { select: { id: true, name: true } } },
  });

  if (!hackathon || (hackathon.hidden && req.user.role !== "ADMIN")) {
    return res.status(404).json({ error: "Hackathon not found" });
  }

  res.json(hackathon);
});

module.exports = router;