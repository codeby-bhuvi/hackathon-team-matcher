import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

function PostHackathon() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    organizer: "",
    description: "",
    link: "",
    mode: "IN_PERSON",
    city: "",
    startDate: "",
    endDate: "",
    deadline: "",
    minTeamSize: 2,
    maxTeamSize: 4,
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
      await api("/api/hackathons", {
        method: "POST",
        body: {
          ...form,
          city: form.mode === "ONLINE" ? "" : form.city,
          minTeamSize: Number(form.minTeamSize),
          maxTeamSize: Number(form.maxTeamSize),
        },
      });
      navigate("/hackathons");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>Post a hackathon</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Hackathon name" value={form.name} onChange={handleChange} />
        <br />
        <input name="organizer" placeholder="Organizer" value={form.organizer} onChange={handleChange} />
        <br />
        <input name="link" placeholder="Link (https://...)" value={form.link} onChange={handleChange} />
        <br />
        <textarea name="description" placeholder="Description (optional)" value={form.description} onChange={handleChange} />
        <br />

        <label>
          Mode:{" "}
          <select name="mode" value={form.mode} onChange={handleChange}>
            <option value="IN_PERSON">In person</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
        <br />

        {form.mode !== "ONLINE" && (
          <>
            <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
            <br />
          </>
        )}

        <label>
          Starts: <input name="startDate" type="date" value={form.startDate} onChange={handleChange} />
        </label>
        <br />
        <label>
          Ends: <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
        </label>
        <br />
        <label>
          Register by: <input name="deadline" type="date" value={form.deadline} onChange={handleChange} />
        </label>
        <br />
        <label>
          Min team size:{" "}
          <input name="minTeamSize" type="number" min="1" value={form.minTeamSize} onChange={handleChange} />
        </label>
        <br />
        <label>
          Max team size:{" "}
          <input name="maxTeamSize" type="number" min="1" value={form.maxTeamSize} onChange={handleChange} />
        </label>
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post hackathon"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        <Link to="/hackathons">Back to hackathons</Link>
      </p>
    </div>
  );
}

export default PostHackathon;