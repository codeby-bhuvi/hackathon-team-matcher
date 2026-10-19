import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/users/${id}`)
      .then(setUser)
      .catch((err) => {
        if (
          err.message === "Please log in first" ||
          err.message === "Invalid or expired token"
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        setError(err.message);
      });
  }, [id, navigate]);

  if (error) {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to="/dashboard">Back to dashboard</Link>
      </p>

      <h2>
        {user.name} {user.role === "ADMIN" && <span>(Admin)</span>}
      </h2>
      <p>
        {user.city} · {user.college}
      </p>
      {user.bio && <p>{user.bio}</p>}
      <p>Skills: {user.skills.join(", ") || "none listed"}</p>

      <h3>Past hackathons</h3>
      {user.pastHackathons.length === 0 && <p>None added yet.</p>}
      {user.pastHackathons.map((h) => (
        <p key={h.id}>
          {h.name} ({h.year}){h.result ? ` · ${h.result}` : ""}
        </p>
      ))}

      <h3>Projects</h3>
      {user.projects.length === 0 && <p>None added yet.</p>}
      {user.projects.map((p) => (
        <div key={p.id}>
          <p>
            <strong>{p.title}</strong>
          </p>
          {p.description && <p>{p.description}</p>}
          {p.link && (
            <p>
              <a href={p.link} target="_blank" rel="noreferrer">
                {p.link}
              </a>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default Profile;