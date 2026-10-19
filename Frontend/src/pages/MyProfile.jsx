import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import ProfileExtras from "./ProfileExtras.jsx";

function isAuthError(err) {
  return (
    err.message === "Please log in first" ||
    err.message === "Invalid or expired token"
  );
}

function MyProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api("/api/auth/me")
      .then((me) => {
        setUserId(me.id);
        setForm({
          name: me.name,
          city: me.city,
          college: me.college,
          bio: me.bio || "",
          contact: me.contact || "",
          skills: me.skills.join(", "),
        });
      })
      .catch((err) => {
        if (isAuthError(err)) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        setError(err.message);
      });
  }, [navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await api("/api/users/me", {
        method: "PUT",
        body: {
          name: form.name,
          city: form.city,
          college: form.college,
          bio: form.bio,
          contact: form.contact,
          skills,
        },
      });

      const saved = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...saved, ...updated }));
      setMessage("Profile saved.");
    } catch (err) {
      if (isAuthError(err)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return error ? <p style={{ color: "red" }}>{error}</p> : <p>Loading...</p>;
  }

  return (
    <div>
      <p>
        <Link to="/dashboard">Back to dashboard</Link> ·{" "}
        <Link to={`/profile/${userId}`}>See how others see my profile</Link>
      </p>

      <h2>Edit my profile</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Name:{" "}
          <input name="name" value={form.name} onChange={handleChange} />
        </label>
        <br />
        <label>
          City:{" "}
          <input name="city" value={form.city} onChange={handleChange} />
        </label>
        <br />
        <label>
          College:{" "}
          <input name="college" value={form.college} onChange={handleChange} />
        </label>
        <br />
        <label>
          Skills (separated by commas):{" "}
          <input name="skills" value={form.skills} onChange={handleChange} />
        </label>
        <br />
        <label>
          Bio:
          <br />
          <textarea name="bio" rows="3" value={form.bio} onChange={handleChange} />
        </label>
        <br />
        <label>
          Contact (like a WhatsApp number):{" "}
          <input name="contact" value={form.contact} onChange={handleChange} />
        </label>
        <p>Only people on your team can see your contact details.</p>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
            <ProfileExtras />
    </div>
  );
}

export default MyProfile;