import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "",
    college: "",
    skills: "",
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
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await api("/api/auth/signup", {
        method: "POST",
        body: { ...form, skills },
      });

      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
        <div className="auth-card">
      <h2>Create your account</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
        <br />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <br />
        <input name="password" type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={handleChange} />
        <br />
        <input name="city" placeholder="City (like Mangalore)" value={form.city} onChange={handleChange} />
        <br />
        <input name="college" placeholder="College" value={form.college} onChange={handleChange} />
        <br />
        <input name="skills" placeholder="Skills, separated by commas" value={form.skills} onChange={handleChange} />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Signup;