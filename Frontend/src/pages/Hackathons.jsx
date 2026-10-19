import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

const MODE_LABELS = {
  ONLINE: "Online",
  IN_PERSON: "In person",
  HYBRID: "Hybrid",
};

function Hackathons() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (q.trim()) params.set("q", q.trim());
      const data = await api(`/api/hackathons?${params.toString()}`);
      setHackathons(data);
    } catch (err) {
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  return (
    <div>
      <div className="page-head">
        <h2>Hackathons</h2>
        <Link to="/hackathons/new" className="btn-link">
          + Post a hackathon
        </Link>
      </div>

      <form onSubmit={handleSearch} className="search-bar">
        <input
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && !error && hackathons.length === 0 && (
        <p className="muted">No hackathons found.</p>
      )}

      {hackathons.map((h) => (
        <div key={h.id} className="hack-card">
          <div className="hack-top">
            <h3>
              <Link to={`/hackathons/${h.id}`}>{h.name}</Link>
            </h3>
            <span className={`badge badge-${h.mode.toLowerCase()}`}>
              {MODE_LABELS[h.mode]}
              {h.city ? ` · ${h.city}` : ""}
            </span>
          </div>

          <p className="muted">By {h.organizer}</p>
          <p>
            {new Date(h.startDate).toLocaleDateString()} to{" "}
            {new Date(h.endDate).toLocaleDateString()}
          </p>
          <p>
            Register by <strong>{new Date(h.deadline).toLocaleDateString()}</strong>{" "}
            · Teams of {h.minTeamSize} to {h.maxTeamSize}
          </p>
          <p className="muted">Posted by {h.postedBy.name}</p>

          <Link to={`/hackathons/${h.id}`} className="btn-link">
            View details
          </Link>
        </div>
      ))}
    </div>
  );
}

export default Hackathons;