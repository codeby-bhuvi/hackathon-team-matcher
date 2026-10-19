import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

function isAuthError(err) {
  return (
    err.message === "Please log in first" ||
    err.message === "Invalid or expired token"
  );
}

function RequestCard({ request, canAnswer, onAnswer }) {
  const isJoin = request.type === "JOIN";

  return (
    <div style={{ border: "1px solid #ccc", padding: 8, margin: "8px 0" }}>
      <p>
        {isJoin
          ? `${request.sender.name} wants to join ${request.team.name}`
          : `${request.sender.name} invited ${request.user.name} to ${request.team.name}`}
      </p>
      {request.message && <p>"{request.message}"</p>}
      <p>Status: {request.status}</p>
      <p>
        <Link to={`/hackathons/${request.team.hackathonId}`}>View hackathon</Link>
      </p>
      {canAnswer && request.status === "PENDING" && (
        <>
          <button onClick={() => onAnswer(request.id, "ACCEPT")}>Accept</button>{" "}
          <button onClick={() => onAnswer(request.id, "DECLINE")}>Decline</button>
        </>
      )}
    </div>
  );
}

function Requests() {
  const navigate = useNavigate();
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const goToLogin = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  const load = useCallback(async () => {
    try {
      const data = await api("/api/requests");
      setReceived(data.received);
      setSent(data.sent);
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [goToLogin]);

  useEffect(() => {
    load();
  }, [load]);

  async function answer(id, action) {
    setError("");
    try {
      await api(`/api/requests/${id}`, {
        method: "PATCH",
        body: { action },
      });
      await load();
    } catch (err) {
      if (isAuthError(err)) {
        goToLogin();
        return;
      }
      setError(err.message);
      await load();
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <p>
        <Link to="/dashboard">Back to dashboard</Link>
      </p>

      <h2>Requests</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <h3>Waiting for your answer</h3>
      {received.length === 0 && <p>Nothing here yet.</p>}
      {received.map((r) => (
        <RequestCard key={r.id} request={r} canAnswer onAnswer={answer} />
      ))}

      <h3>Requests you sent</h3>
      {sent.length === 0 && <p>Nothing here yet.</p>}
      {sent.map((r) => (
        <RequestCard key={r.id} request={r} canAnswer={false} />
      ))}
    </div>
  );
}

export default Requests;