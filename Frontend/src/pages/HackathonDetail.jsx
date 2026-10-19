import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function HackathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");

  function handleAuthError(err) {
    if (
      err.message === "Please log in first" ||
      err.message === "Invalid or expired token"
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
      return true;
    }
    return false;
  }

  useEffect(() => {
    async function load() {
      try {
        const h = await api(`/api/hackathons/${id}`);
        setHackathon(h);
        const t = await api(`/api/teams?hackathonId=${id}`);
        setTeams(t);
      } catch (err) {
        if (!handleAuthError(err)) setError(err.message);
      }
    }
    load();
  }, [id]);

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
          <p>
            Members: {team.members.map((m) => m.user.name).join(", ")}
          </p>
          <p>
            Needs {team.spotsNeeded} more · Skills wanted:{" "}
            {team.skillsNeeded.join(", ") || "any"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default HackathonDetail;