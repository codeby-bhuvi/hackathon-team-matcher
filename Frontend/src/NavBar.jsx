import { Link, NavLink, useNavigate } from "react-router-dom";

function NavBar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const initials =
    user && user.name
      ? user.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join("")
      : "?";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <>
      <header className="topbar">
        <Link to={token ? "/dashboard" : "/login"} className="brand">
          <span className="slots" aria-hidden="true">
            <i className="on" />
            <i className="hot" />
            <i />
          </span>
          Hackathon Team Matcher
        </Link>

        <div className="top-actions">
          {token ? (
            <>
              <NavLink
                to="/my-profile"
                className="avatar"
                title="My profile"
                aria-label="My profile"
              >
                {initials}
              </NavLink>
              <button type="button" className="quiet" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="quiet-link">
                Log in
              </NavLink>
              <NavLink to="/signup" className="btn-link">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </header>

      {token && (
        <nav className="dock" aria-label="Main">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/hackathons">Hackathons</NavLink>
          <NavLink to="/requests">Requests</NavLink>
          {user && user.role === "ADMIN" && <NavLink to="/admin">Admin</NavLink>}
        </nav>
      )}
    </>
  );
}

export default NavBar;