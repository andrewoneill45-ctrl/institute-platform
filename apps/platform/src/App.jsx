import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./site/Home.jsx";
import Insights from "./site/Insights.jsx";
import SignIn from "./site/SignIn.jsx";
import Fellowship from "./site/Fellowship.jsx";
import Positions from "./site/Positions.jsx";
import System from "./site/System.jsx";
import Summit from "./site/Summit.jsx";
import MemberLayout from "./member/MemberLayout.jsx";
import MemberHome from "./member/Home.jsx";
import Atlas from "./member/Atlas.jsx";
import Lens from "./member/Lens.jsx";
import Orbit from "./member/Orbit.jsx";
import Constellation from "./member/constellation/Constellation.jsx";
import Prizm from "./member/prizm/Prizm.jsx";
import Horizon from "./member/horizon/Horizon.jsx";
import Profile from "./member/Profile.jsx";
import Admin from "./member/Admin.jsx";
import { RequireMember } from "./lib/auth.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/fellowship" element={<Fellowship />} />
      <Route path="/positions" element={<Positions />} />
      <Route path="/system" element={<System />} />
      <Route path="/summit" element={<Summit />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/members" element={<RequireMember><MemberLayout /></RequireMember>}>
        <Route index element={<MemberHome />} />
        <Route path="atlas" element={<Atlas />} />
        <Route path="lens" element={<Lens />} />
        <Route path="orbit" element={<Orbit />} />
        <Route path="constellation" element={<Constellation />} />
        <Route path="prizm" element={<Prizm />} />
        <Route path="horizon" element={<Horizon />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
