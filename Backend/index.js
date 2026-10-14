const express = require("express");

const app = express();
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/hackathons", require("./routes/hackathons"));
app.use("/api/teams", require("./routes/teams"));

app.get("/", (req, res) => {
  res.send("Hackathon Team Matcher API is running");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});