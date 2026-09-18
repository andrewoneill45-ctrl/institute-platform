import { useEffect } from "react";
import { syncDown, startSync } from "../lib/sync.js";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { Wordmark } from "@asi/design-system";
import { useAuth } from "../lib/auth.jsx";

export default function MemberLayout() {
  const { user, signOut } = useAuth();  useEffect(() => { let stop = () => {}; if (user) syncDown(user).then(() => { stop = startSync(user); }); return () => stop(); }, [user?.id]);

  const p = useLocation().pathname;
  const fullBleed = p.includes("/orbit") || p.includes("/atlas") || p.includes("/lens");
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="member-top" style={{ flex: "none" }}><div className="container in">
        <Link to="/" style={{ textDecoration: "none" }}><Wordmark size={22} /></Link>
        <div className="tabs">
          <NavLink to="atlas" className={({ isActive }) => (isActive ? "on" : "")}>Atlas</NavLink>
          <NavLink to="lens" className={({ isActive }) => (isActive ? "on" : "")}>Lens</NavLink>
          <NavLink to="orbit" className={({ isActive }) => (isActive ? "on" : "")}>Orbit</NavLink>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{user?.school || user?.email}</span>
        <button className="btn line" style={{ padding: "8px 16px", fontSize: 12 }} onClick={signOut}>Sign out</button>
      </div></div>
      {fullBleed ? (
        <div style={{ flex: 1, minHeight: 0 }}><Outlet /></div>
      ) : (
        <div className="member-body" style={{ flex: 1, overflow: "auto" }}><div className="container"><Outlet /></div></div>
      )}
    </div>
  );
}
