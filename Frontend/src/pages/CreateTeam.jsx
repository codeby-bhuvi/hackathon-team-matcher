import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

function CreateTeam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    skillsNeeded: "",
    spotsNeeded: 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const skillsNeeded = form.skillsNeeded
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api("/api/teams", {
        method: "POST",
        body: {
          hackathonId: Number(id),
          name: form.name,
          skillsNeeded,
          spotsNeeded: Number(form.spotsNeeded),
        },
      });

      navigate(`/hackathons/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Create a team</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Team name" value={form.name} onChange={handleChange} />
        <br />
        <input
          name="skillsNeeded"
          placeholder="Skills you need, separated by commas"
          value={form.skillsNeeded}
          onChange={handleChange}
        />
        <br />
        <label>
          How many more people do you need?{" "}
          <input name="spotsNeeded" type="number" min="1" value={form.spotsNeeded} onChange={handleChange} />
        </label>
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create team"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        <Link to={`/hackathons/${id}`}>Back to the hackathon</Link>
      </p>
    </div>
  );
}

export default CreateTeam;