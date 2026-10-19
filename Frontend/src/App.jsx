import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Hackathons from "./pages/Hackathons.jsx";
import PostHackathon from "./pages/PostHackathon.jsx";
import HackathonDetail from "./pages/HackathonDetail.jsx";
import CreateTeam from "./pages/CreateTeam.jsx";

function App() {
  return (
    <div>
      <h1>Hackathon Team Matcher</h1>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/signup">Sign up</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hackathons" element={<Hackathons />} />
         <Route path="/hackathons/new" element={<PostHackathon />} />
                 <Route path="/hackathons/:id" element={<HackathonDetail />} />
                         <Route path="/hackathons/:id/team/new" element={<CreateTeam />} />
      </Routes>
    </div>
  );
}

export default App;