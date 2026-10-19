import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

function isAuthError(err) {
  return (
    err.message === "Please log in first" ||
    err.message === "Invalid or expired token"
  );
}

function Admin() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
      setHidden(await api("/api/admin/hackathons/hidden"));
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  async function restore(id) {
    setError("");
    setMessage("");
    try {
      await api(`/api/admin/hackathons/${id}/restore`, { method: "POST" });
      setMessage("Post restored and its reports cleared.");
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function remove(id, name) {
    if (!window.confirm(`Delete "${name}" for good? This cannot be undone.`)) {
      return;
    }
    setError("");
    setMessage("");
    try {
      await api(`/api/admin/hackathons/${id}`, { method: "DELETE" });
      setMessage("Post deleted.");
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to="/dashboard">Back to dashboard</Link>
      </p>

      <h2>Admin: hidden posts</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      {!error && hidden.length === 0 && <p>No hidden posts.</p>}

      {hidden.map((h) => (
        <div key={h.id} style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
          <h3>{h.name}</h3>
          <p>
            By {h.organizer} · posted by {h.postedBy.name}
          </p>
          <p>Reports: {h._count.reports}</p>
          {h.reports.map((r, i) => (
            <p key={i}>
              · {r.reason || "No reason given"} ({new Date(r.createdAt).toLocaleDateString()})
            </p>
          ))}
          <button onClick={() => restore(h.id)}>Restore</button>{" "}
          <button onClick={() => remove(h.id, h.name)}>Delete permanently</button>
        </div>
      ))}
    </div>
  );
}

export default Admin;