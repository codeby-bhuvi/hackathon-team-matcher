import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

function isAuthError(err) {
  return (
    err.message === "Please log in first" ||
    err.message === "Invalid or expired token"
  );
}

function ProfileExtras() {
  const navigate = useNavigate();
  const [pastHackathons, setPastHackathons] = useState([]);
  const [projects, setProjects] = useState([]);
  const [past, setPast] = useState({ name: "", year: "", result: "" });
  const [project, setProject] = useState({ title: "", description: "", link: "" });
  const [error, setError] = useState("");

  const handleError = useCallback(
    (err) => {
      if (isAuthError(err)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError(err.message);
    },
    [navigate]
  );

  const load = useCallback(async () => {
    try {
      const me = await api("/api/auth/me");
      setPastHackathons(me.pastHackathons);
      setProjects(me.projects);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  async function addPast(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/users/me/past-hackathons", {
        method: "POST",
        body: { name: past.name, year: Number(past.year), result: past.result },
      });
      setPast({ name: "", year: "", result: "" });
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function removePast(id) {
    setError("");
    try {
      await api(`/api/users/me/past-hackathons/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function addProject(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/users/me/projects", {
        method: "POST",
        body: {
          title: project.title,
          description: project.description,
          link: project.link,
        },
      });
      setProject({ title: "", description: "", link: "" });
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function removeProject(id) {
    setError("");
    try {
      await api(`/api/users/me/projects/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <div>
      <hr />
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Past hackathons</h3>
      {pastHackathons.length === 0 && <p>None added yet.</p>}
      {pastHackathons.map((h) => (
        <p key={h.id}>
          {h.name} ({h.year}){h.result ? ` · ${h.result}` : ""}{" "}
          <button onClick={() => removePast(h.id)}>Remove</button>
        </p>
      ))}

      <form onSubmit={addPast}>
        <input
          placeholder="Hackathon name"
          value={past.name}
          onChange={(e) => setPast({ ...past, name: e.target.value })}
        />
        <input
          placeholder="Year"
          type="number"
          value={past.year}
          onChange={(e) => setPast({ ...past, year: e.target.value })}
        />
        <input
          placeholder="Result (optional)"
          value={past.result}
          onChange={(e) => setPast({ ...past, result: e.target.value })}
        />
        <button type="submit">Add</button>
      </form>

      <h3>Projects</h3>
      {projects.length === 0 && <p>None added yet.</p>}
      {projects.map((p) => (
        <div key={p.id}>
          <p>
            <strong>{p.title}</strong>{" "}
            <button onClick={() => removeProject(p.id)}>Remove</button>
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

      <form onSubmit={addProject}>
        <input
          placeholder="Project title"
          value={project.title}
          onChange={(e) => setProject({ ...project, title: e.target.value })}
        />
        <input
          placeholder="Short description (optional)"
          value={project.description}
          onChange={(e) => setProject({ ...project, description: e.target.value })}
        />
        <input
          placeholder="Link (https://...)"
          value={project.link}
          onChange={(e) => setProject({ ...project, link: e.target.value })}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

export default ProfileExtras;