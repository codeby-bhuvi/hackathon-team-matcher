import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

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
      <p>
        {user.city} · {user.college}
      </p>
      <p>Skills: {user.skills.join(", ") || "none added yet"}</p>
      <button onClick={logout}>Log out</button>
      <p><Link to="/hackathons">Browse hackathons</Link></p>
            <p><Link to="/requests">Requests</Link></p>
    </div>
  );
}

export default Dashboard;