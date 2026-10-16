const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});