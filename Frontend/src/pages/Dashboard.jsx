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

  const firstName = user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div>
      <section className="hero">
        <div className="hero-copy">
          <h2>Find your team, {firstName}.</h2>
          <p className="hero-sub">
            Browse open hackathons, see which teams need a teammate, and ask to join.
          </p>

          <p className="muted">
            {user.city}, {user.college}
          </p>
          <p>
            {user.skills.length === 0 ? (
              <span className="muted">
                Add your skills in My profile so teams can find you.
              </span>
            ) : (
              user.skills.map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))
            )}
          </p>

          <div className="hero-actions">
            <Link to="/hackathons" className="btn-link">
              Browse hackathons
            </Link>
            <Link to="/hackathons/new" className="btn-link btn-glass">
              Post a hackathon
            </Link>
          </div>
        </div>

        <div className="orbs" aria-hidden="true">
          <span className="orb orb-you">{initials}</span>
          <span className="orb orb-open">+</span>
          <span className="orb orb-open">+</span>
        </div>
      </section>

      <div className="grid">
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