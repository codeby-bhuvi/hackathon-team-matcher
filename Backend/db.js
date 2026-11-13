require("dotenv").config();
const { PrismaClient } = require("./generated/prisma");
const { PrismaPg } = require("@prisma/adapter-pg");

function cleanDbUrl(url) {
  if (!url) return url;
  let cleaned = url.trim();
  cleaned = cleaned.replace(/^DATABASE_URL\s*=\s*/i, "").trim();
  cleaned = cleaned.replace(/^psql\s+/i, "").trim();
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
  return cleaned;
}

const connectionString = cleanDbUrl(process.env.DATABASE_URL);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
