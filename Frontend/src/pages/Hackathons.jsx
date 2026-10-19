import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

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
      <h2>Hackathons</h2>
            <p><Link to="/hackathons/new">Post a hackathon</Link></p>

      <form onSubmit={handleSearch}>
        <input placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <button type="submit">Search</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && hackathons.length === 0 && <p>No hackathons found.</p>}

      {hackathons.map((h) => (
        <div key={h.id} style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
          <h3>{h.name}</h3>
          <p>
            By {h.organizer} · {h.mode.replace("_", " ")}
            {h.city ? ` · ${h.city}` : ""}
          </p>
          <p>
            {new Date(h.startDate).toLocaleDateString()} to{" "}
            {new Date(h.endDate).toLocaleDateString()} · Register by{" "}
            {new Date(h.deadline).toLocaleDateString()}
          </p>
          <p>
            Team size: {h.minTeamSize} to {h.maxTeamSize} · Posted by {h.postedBy.name}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Hackathons;