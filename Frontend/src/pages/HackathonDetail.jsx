import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function isAuthError(err) {
  return (
    err.message === "Please log in first" ||
    err.message === "Invalid or expired token"
  );
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
const MODE_LABELS = {
  ONLINE: "Online",
  IN_PERSON: "In person",
  HYBRID: "Hybrid",
};
function NameLink({ user }) {
  return <Link to={`/profile/${user.id}`}>{user.name}</Link>;
}
function HackathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [soloEntries, setSoloEntries] = useState([]);
  const [matchedTeams, setMatchedTeams] = useState([]);
  const [matchedPeople, setMatchedPeople] = useState([]);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [teamError, setTeamError] = useState("");
  const [teamMessage, setTeamMessage] = useState("");
  const [soloError, setSoloError] = useState("");
  const [soloMessage, setSoloMessage] = useState("");
    const [reportError, setReportError] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  const goToLogin = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const loadAll = useCallback(async () => {
    try {
      const h = await api(`/api/hackathons/${id}`);
      setHackathon(h);

      const t = await api(`/api/teams?hackathonId=${id}`);
      setTeams(t);
      setSoloEntries(await api(`/api/solo?hackathonId=${id}`));

      const me = getCurrentUser();
      const led = me ? t.find((team) => team.leader.id === me.id) : null;

      if (led) {
        setMatchedTeams([]);
        setMatchedPeople(await api(`/api/matches/solo?teamId=${led.id}`));
      } else {
        setMatchedPeople([]);
        try {
          setMatchedTeams(await api(`/api/matches/teams?hackathonId=${id}`));
        } catch (err) {
          if (isAuthError(err)) throw err;
          setMatchedTeams([]);
        }
      }
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
    async function reportPost() {
    setReportError("");
    setReportMessage("");

    const reason = window.prompt("Why are you reporting this post? (optional)");
    if (reason === null) return;

    try {
      await api(`/api/hackathons/${id}/report`, {
        method: "POST",
        body: { reason },
      });
      setReportMessage("Thanks, your report was received.");
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setReportError(err.message);
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

  const cardStyle = { border: "1px solid #ccc", padding: 8, margin: "8px 0" };

  return (
    <div>
      <p>
        <Link to="/hackathons">Back to hackathons</Link>
      </p>

            <div className="hack-card">
        <div className="hack-top">
          <h2 style={{ margin: 0 }}>{hackathon.name}</h2>
          <span className={`badge badge-${hackathon.mode.toLowerCase()}`}>
            {MODE_LABELS[hackathon.mode]}
            {hackathon.city ? ` · ${hackathon.city}` : ""}
          </span>
        </div>

        <p className="muted">By {hackathon.organizer}</p>
        <p>
          {new Date(hackathon.startDate).toLocaleDateString()} to{" "}
          {new Date(hackathon.endDate).toLocaleDateString()}
        </p>
        <p>
          Register by{" "}
          <strong>{new Date(hackathon.deadline).toLocaleDateString()}</strong> ·
          Teams of {hackathon.minTeamSize} to {hackathon.maxTeamSize}
        </p>
        {hackathon.description && <p>{hackathon.description}</p>}
        <p>
          <a href={hackathon.link} target="_blank" rel="noreferrer">
            Official page ↗
          </a>
        </p>
        <p className="muted">
          Posted by <NameLink user={hackathon.postedBy} />
        </p>
      </div>
            {currentUser && currentUser.id !== hackathon.postedBy.id && (
        <p>
          <button onClick={reportPost}>Report this post</button>
        </p>
      )}
      {reportError && <p style={{ color: "red" }}>{reportError}</p>}
      {reportMessage && <p style={{ color: "green" }}>{reportMessage}</p>}

      <hr />

      <p>
        <Link to={`/hackathons/${id}/team/new`}>Create a team</Link>
      </p>

      {matchedTeams.length > 0 && (
        <div>
          <h3>Best matches for you</h3>
          {matchedTeams.map((team) => (
            <div key={team.id} style={cardStyle}>
              <h4>
                {team.name} · match score {team.score}
              </h4>
              <p>
  Led by <NameLink user={team.leader} />
</p>
              <p>
                Skills you have that they need:{" "}
                {team.matchedSkills.join(", ") || "none"}
              </p>
              <button onClick={() => askToJoin(team.id)}>Ask to join</button>
            </div>
          ))}
        </div>
      )}

      {myTeam && matchedPeople.length > 0 && (
        <div>
          <h3>Best people for {myTeam.name}</h3>
          {matchedPeople.map((entry) => (
            <div key={entry.id} style={cardStyle}>
                            <h4>
                <NameLink user={entry.user} /> · match score {entry.score}
              </h4>
              <p>
                {entry.user.city} · {entry.user.college}
              </p>
              <p>
                Skills your team needs that they have:{" "}
                {entry.matchedSkills.join(", ") || "none"}
              </p>
              <button onClick={() => invite(myTeam.id, entry.user.id)}>
                Invite to {myTeam.name}
              </button>
            </div>
          ))}
        </div>
      )}

      <h3>Teams looking for members</h3>
      {teamError && <p style={{ color: "red" }}>{teamError}</p>}
      {teamMessage && <p style={{ color: "green" }}>{teamMessage}</p>}
      {teams.length === 0 && <p>No teams with open spots yet.</p>}

      {teams.map((team) => (
        <div key={team.id} style={cardStyle}>
          <h4>{team.name}</h4>
          <p>
  Led by <NameLink user={team.leader} />
</p>
                    <p>
            Members:{" "}
            {team.members.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                <NameLink user={m.user} />
              </span>
            ))}
          </p>
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
        <div key={entry.id} style={cardStyle}>
                    <h4>
            <NameLink user={entry.user} />
          </h4>
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