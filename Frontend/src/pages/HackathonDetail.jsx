import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function isAuthError(err) {
  return (
    err.message === "Please log in first" ||
    err.message === "Invalid or expired token"
  );
}

function HackathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [soloEntries, setSoloEntries] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const goToLogin = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const loadAll = useCallback(async () => {
    try {
      const h = await api(`/api/hackathons/${id}`);
      setHackathon(h);
      setTeams(await api(`/api/teams?hackathonId=${id}`));
      setSoloEntries(await api(`/api/solo?hackathonId=${id}`));
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setError(err.message);
    }
  }, [id, goToLogin]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function joinSolo() {
    setActionError("");
    setActionMessage("");
    try {
      await api("/api/solo", {
        method: "POST",
        body: { hackathonId: Number(id), note },
      });
      setActionMessage("You are now listed as looking for a team.");
      setNote("");
      await loadAll();
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setActionError(err.message);
    }
  }

  if (error) {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
        <Link to="/hackathons">Back to hackathons</Link>
      </div>
    );
  }

  if (!hackathon) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to="/hackathons">Back to hackathons</Link>
      </p>

      <h2>{hackathon.name}</h2>
      <p>
        By {hackathon.organizer} · {hackathon.mode.replace("_", " ")}
        {hackathon.city ? ` · ${hackathon.city}` : ""}
      </p>
      <p>
        {new Date(hackathon.startDate).toLocaleDateString()} to{" "}
        {new Date(hackathon.endDate).toLocaleDateString()}
      </p>
      <p>Register by {new Date(hackathon.deadline).toLocaleDateString()}</p>
      <p>
        Team size: {hackathon.minTeamSize} to {hackathon.maxTeamSize}
      </p>
      {hackathon.description && <p>{hackathon.description}</p>}
      <p>
        <a href={hackathon.link} target="_blank" rel="noreferrer">
          Official page
        </a>
      </p>
      <p>Posted by {hackathon.postedBy.name}</p>

      <hr />

      <p>
        <Link to={`/hackathons/${id}/team/new`}>Create a team</Link>
      </p>

      <h3>Teams looking for members</h3>
      {teams.length === 0 && <p>No teams with open spots yet.</p>}

      {teams.map((team) => (
        <div key={team.id} style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
          <h4>{team.name}</h4>
          <p>Led by {team.leader.name}</p>
          <p>Members: {team.members.map((m) => m.user.name).join(", ")}</p>
          <p>
            Needs {team.spotsNeeded} more · Skills wanted:{" "}
            {team.skillsNeeded.join(", ") || "any"}
          </p>
        </div>
      ))}

      <hr />

      <h3>People looking for a team</h3>

      <div>
        <input
          placeholder="Short note about yourself (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button onClick={joinSolo}>I need a team</button>
      </div>
      {actionError && <p style={{ color: "red" }}>{actionError}</p>}
      {actionMessage && <p style={{ color: "green" }}>{actionMessage}</p>}

      {soloEntries.length === 0 && <p>Nobody is looking for a team yet.</p>}

      {soloEntries.map((entry) => (
        <div key={entry.id} style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
          <h4>{entry.user.name}</h4>
          <p>
            {entry.user.city} · {entry.user.college}
          </p>
          <p>Skills: {entry.user.skills.join(", ") || "none listed"}</p>
          {entry.note && <p>"{entry.note}"</p>}
        </div>
      ))}
    </div>
  );
}

export default HackathonDetail;