import { Link, NavLink } from "react-router-dom";
import { Wordmark } from "@asi/design-system";

/* The public site's shared frame: one nav, one footer, one voice. */
export function SiteNav() {
  const l = ({ isActive }) => ({ color: isActive ? "var(--purple-700)" : undefined });
  return (
    <nav className="nav"><div className="container nav-in">
      <Link to="/" style={{ textDecoration: "none" }}><Wordmark size={24} /></Link>
      <span className="spacer" />
      <NavLink to="/insights" style={l}>Insights</NavLink>
      <NavLink to="/fellowship" style={l}>The Fellowship</NavLink>
      <NavLink to="/positions" style={l}>Positions</NavLink>
      <NavLink to="/system" style={l}>State of the System</NavLink>
      <NavLink to="/summit" style={l}>The Summit</NavLink>
      <Link to="/signin" className="btn line" style={{ padding: "9px 20px", fontSize: 12.5 }}>Member sign in</Link>
    </div></nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer"><div className="container" style={{ display: "flex", justifyContent: "space-between", padding: 0 }}>
      <span>The All Saints Institute · the school remains the proof; the Institute carries it to the nation</span>
      <span>© 2026</span>
    </div></footer>
  );
}

export default function SiteShell({ kick, title, children }) {
  return (
    <>
      <SiteNav />
      <header className="hero" style={{ paddingBottom: 28 }}><div className="container">
        {kick && <div className="kick">{kick}</div>}
        <h1 style={{ fontSize: "clamp(34px,4.6vw,52px)" }}>{title}</h1>
      </div></header>
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
