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
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const [soloError, setSoloError] = useState("");
  const [soloMessage, setSoloMessage] = useState("");
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [soloEntries, setSoloEntries] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
    const [teamError, setTeamError] = useState("");
  const [teamMessage, setTeamMessage] = useState("");

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
    async function askToJoin(teamId) {
    setTeamError("");
    setTeamMessage("");
    try {
      await api("/api/requests", {
        method: "POST",
        body: { type: "JOIN", teamId },
      });
      setTeamMessage("Request sent. The team leader will see it in their requests.");
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setTeamError(err.message);
    }
  }
    async function invite(teamId, userId) {
    setSoloError("");
    setSoloMessage("");
    try {
      await api("/api/requests", {
        method: "POST",
        body: { type: "INVITE", teamId, userId },
      });
      setSoloMessage("Invite sent.");
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setSoloError(err.message);
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

  const myTeam = currentUser
    ? teams.find((t) => t.leader.id === currentUser.id)
    : null;



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
            {teamError && <p style={{ color: "red" }}>{teamError}</p>}
      {teamMessage && <p style={{ color: "green" }}>{teamMessage}</p>}
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
                    <button onClick={() => askToJoin(team.id)}>Ask to join</button>
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
            {soloError && <p style={{ color: "red" }}>{soloError}</p>}
      {soloMessage && <p style={{ color: "green" }}>{soloMessage}</p>}

      {soloEntries.length === 0 && <p>Nobody is looking for a team yet.</p>}

      {soloEntries.map((entry) => (
        <div key={entry.id} style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
          <h4>{entry.user.name}</h4>
          <p>
            {entry.user.city} · {entry.user.college}
          </p>
          <p>Skills: {entry.user.skills.join(", ") || "none listed"}</p>
          {entry.note && <p>"{entry.note}"</p>}
                    {myTeam && entry.user.id !== currentUser.id && (
            <button onClick={() => invite(myTeam.id, entry.user.id)}>
              Invite to {myTeam.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default HackathonDetail;