import { useEffect, useRef, useState } from "react";
import { syncDown, startSync } from "../lib/sync.js";
import { Outlet, NavLink, Link, useLocation, Navigate } from "react-router-dom";
import { Wordmark } from "@asi/design-system";
import { useAuth } from "../lib/auth.jsx";
import CommandPalette from "./CommandPalette.jsx";
import { RoomIcon, roomsFor } from "./RoomIcons.jsx";

/* The members' shell: one bar for every room. Wordmark, the six rooms, the
   command palette (⌘K anywhere), and the member's own menu. On a phone the
   rooms move to a bottom bar, the way native apps do it. */
export default function MemberLayout() {
  const { user, signOut } = useAuth();
  useEffect(() => { let stop = () => {}; if (user) syncDown(user).then(() => { stop = startSync(user); }); return () => stop(); }, [user?.id]);

  const loc = useLocation();
  const p = loc.pathname;
  const fullBleed = p.includes("/orbit") || p.includes("/atlas") || p.includes("/lens") || p.includes("/constellation") || p.includes("/prizm") || p.includes("/horizon");
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);

  /* ⌘K / Ctrl+K anywhere; Lens forwards its own ⌘K up from inside its frame */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setPalette((v) => !v); }
    };
    const onMsg = (e) => { if (e.origin === window.location.origin && e.data && e.data.type === "asi-palette") setPalette(true); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("message", onMsg);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("message", onMsg); };
  }, []);
  useEffect(() => { setMenu(false); }, [p]);
  useEffect(() => {
    if (!menu) return;
    const off = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    const esc = (e) => { if (e.key === "Escape") setMenu(false); };
    document.addEventListener("mousedown", off); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [menu]);

  const name = user?.fullName || user?.school || user?.email || "";
  const initials = (name.match(/\b[A-Za-z]/g) || ["?"]).slice(0, 2).join("").toUpperCase();
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  /* a palette jump remounts the room so its link is read afresh; ordinary
     navigation inside a room keeps it exactly as it was */
  const outletKey = (loc.state && loc.state.palette) || "room";
  /* a room switched off in Accounts is not reachable by its address either */
  const roomKey = (p.match(/\/members\/([a-z]+)/) || [])[1];
  const offLimits = roomKey && ["atlas", "prizm", "lens", "orbit", "constellation", "horizon"].includes(roomKey) && !roomsFor(user).some((r) => r.key === roomKey);
  if (offLimits) return <Navigate to="/members" replace />;

  return (
    <div className="shell">
      <header className="shell-top">
        <div className="shell-in">
          <Link to="/" className="shell-brand" aria-label="The All Saints Institute, home"><Wordmark size={22} /></Link>
          <nav className="shell-rooms" aria-label="Rooms">
            {roomsFor(user).map((r) => (
              <NavLink key={r.key} to={r.key === "home" ? "." : r.key} end={r.key === "home"} className={({ isActive }) => (isActive ? "on" : "")}>
                {r.label}
              </NavLink>
            ))}
          </nav>
          <span className="shell-gap" />
          <button className="shell-search" onClick={() => setPalette(true)} aria-label="Search and jump">
            <RoomIcon room="search" size={16} />
            <span className="shell-search-t">Search schools, trusts, places&hellip;</span>
            <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>
          </button>
          <div className="shell-me" ref={menuRef}>
            <button className="shell-avatar" onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} title={name}>{initials}</button>
            {menu && (
              <div className="shell-menu" role="menu">
                <div className="shell-menu-who">
                  <b>{user?.fullName || "Member"}</b>
                  <small>{[user?.roleTitle, user?.school || user?.scopeName].filter(Boolean).join(" · ")}</small>
                </div>
                <Link role="menuitem" to="/members/profile"><RoomIcon room="profile" size={16} />Your profile</Link>
                {(user?.isAdmin || user?.horizonAccess) && <Link role="menuitem" to="/members/horizon"><RoomIcon room="horizon" size={16} />Horizon</Link>}
                {user?.isAdmin && <Link role="menuitem" to="/members/admin"><RoomIcon room="accounts" size={16} />Accounts</Link>}
                <button role="menuitem" onClick={() => { setMenu(false); setPalette(true); }}><RoomIcon room="search" size={16} />Search and jump<kbd>{isMac ? "⌘" : "Ctrl"} K</kbd></button>
                <hr />
                <button role="menuitem" onClick={signOut}><RoomIcon room="signout" size={16} />Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={fullBleed ? "shell-bleed" : "shell-body member-body"} tabIndex={-1} data-scroller="1">
        {fullBleed ? <Outlet key={outletKey} /> : <div className="container"><Outlet key={outletKey} /></div>}
      </main>

      <nav className="shell-tabbar" aria-label="Rooms">
        {roomsFor(user).filter((r) => r.key !== "horizon").map((r) => (
          <NavLink key={r.key} to={r.key === "home" ? "." : r.key} end={r.key === "home"} className={({ isActive }) => (isActive ? "on" : "")}>
            <RoomIcon room={r.key} size={21} />
            <span>{r.label}</span>
          </NavLink>
        ))}
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} user={user} />
    </div>
  );
}
