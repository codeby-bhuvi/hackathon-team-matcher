const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

// Allowed origins:
//   - CLIENT_URL env var (your production Vercel URL, set in Render)
//   - Any Vercel preview deployment for this project
//   - localhost for local dev
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
];
if (process.env.CLIENT_URL) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);

      // Allow any exact match in the allow-list
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

      // Allow all Vercel preview URLs for this project
      // e.g. hackathon-team-matcher-*.vercel.app
      if (/^https:\/\/hackathon-team-matcher[^.]*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      callback(new Error("CORS: origin not allowed: " + origin));
    },
    credentials: true,
  })
);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/hackathons", require("./routes/hackathons"));
app.use("/api/teams", require("./routes/teams"));
app.use("/api/solo", require("./routes/solo"));
app.use("/api/matches", require("./routes/matches"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/admin", require("./routes/admin"));

app.get("/", (req, res) => {
  res.send("Hackathon Team Matcher API is running");
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

