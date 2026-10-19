import { Link, useLocation, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <nav
      key={location.pathname}
      style={{ padding: "8px 0", borderBottom: "1px solid #ccc", marginBottom: 16 }}
    >
      <strong>Hackathon Team Matcher</strong>
      {" | "}
      {token ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          {" | "}
          <Link to="/hackathons">Hackathons</Link>
          {" | "}
          <Link to="/requests">Requests</Link>
          {" | "}
          <Link to="/my-profile">My profile</Link>
          {user && user.role === "ADMIN" && (
            <>
              {" | "}
              <Link to="/admin">Admin</Link>
            </>
          )}
          {" | "}
          <button onClick={logout}>Log out</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          {" | "}
          <Link to="/signup">Sign up</Link>
        </>
      )}
    </nav>
  );
}

export default NavBar;