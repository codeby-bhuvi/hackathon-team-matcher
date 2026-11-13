import "dotenv/config";
import { defineConfig } from "prisma/config";

function cleanDbUrl(url?: string): string | undefined {
  if (!url) return url;
  let cleaned = url.trim();
  // Strip key prefix if user pasted "DATABASE_URL=..." into the value field
  cleaned = cleaned.replace(/^DATABASE_URL\s*=\s*/i, "").trim();
  // Strip psql prefix if copied from CLI command
  cleaned = cleaned.replace(/^psql\s+/i, "").trim();
  // Strip outer quotes
  cleaned = cleaned.replace(/^["']|["']$/g, "").trim();
  return cleaned;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: cleanDbUrl(process.env["DATABASE_URL"]),
  },
});
