import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    api("/api/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      });
  }, [navigate]);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <p className="muted">
        {user.city} · {user.college}
      </p>
      <p>
        {user.skills.length === 0 ? (
          <span className="muted">No skills added yet</span>
        ) : (
          user.skills.map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))
        )}
      </p>

      <div className="grid">
        <Link to="/hackathons" className="tile">
          <strong>Browse hackathons</strong>
          <span>Find an event and see who is looking for teammates.</span>
        </Link>

        <Link to="/hackathons/new" className="tile">
          <strong>Post a hackathon</strong>
          <span>Share an event so others can form teams for it.</span>
        </Link>

        <Link to="/requests" className="tile">
          <strong>Requests</strong>
          <span>Answer join requests and invites, and see what you sent.</span>
        </Link>

        <Link to="/my-profile" className="tile">
          <strong>My profile</strong>
          <span>Update your skills, projects and past hackathons.</span>
        </Link>

        {user.role === "ADMIN" && (
          <Link to="/admin" className="tile">
            <strong>Admin</strong>
            <span>Review reported posts and restore or delete them.</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Dashboard;