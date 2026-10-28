/* One glyph per room, drawn at one weight, so the shell, the bottom bar on a
   phone and the command palette all speak the same small visual language. */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

export function RoomIcon({ room, size = 18 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true };
  switch (room) {
    case "home": /* the quatrefoil, the house mark */
      return <svg {...p}><path {...S} d="M8.2 8.2a4.2 4.2 0 1 1 7.6 0a4.2 4.2 0 1 1 0 7.6a4.2 4.2 0 1 1-7.6 0a4.2 4.2 0 1 1 0-7.6Z" /></svg>;
    case "atlas": /* a folded map */
      return <svg {...p}><path {...S} d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20Z" /><path {...S} d="M9 4v13.5M15 6.5V20" /></svg>;
    case "prizm": /* a prism splitting a line */
      return <svg {...p}><path {...S} d="M12 4 20 18H4Z" /><path {...S} d="M2.5 12.5 9.5 12M14.5 11 21.5 8.5M14.8 12.4 21.5 12.6M14.4 13.9 21 16.2" /></svg>;
    case "lens": /* the examining eye */
      return <svg {...p}><circle {...S} cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.6" fill="currentColor" /></svg>;
    case "orbit": /* a body and its path */
      return <svg {...p}><ellipse {...S} cx="12" cy="12" rx="9" ry="4.6" transform="rotate(-20 12 12)" /><circle cx="12" cy="12" r="2.2" fill="currentColor" /><circle cx="19.2" cy="8.6" r="1.4" fill="currentColor" /></svg>;
    case "constellation": /* stars joined */
      return <svg {...p}><path {...S} d="M5 16.5 10 9l5 4.5 4.5-7" opacity=".55" /><circle cx="5" cy="16.5" r="1.7" fill="currentColor" /><circle cx="10" cy="9" r="1.7" fill="currentColor" /><circle cx="15" cy="13.5" r="1.7" fill="currentColor" /><circle cx="19.5" cy="6.5" r="1.7" fill="currentColor" /></svg>;
    case "horizon": /* the sun on the line of the horizon */
      return <svg {...p}><path {...S} d="M3 17.5h18" /><path {...S} d="M7 17.5a5 5 0 0 1 10 0" /><path {...S} d="M12 6.5v2.2M5.6 9.6l1.5 1.5M18.4 9.6l-1.5 1.5M3.5 13.2h1.8M18.7 13.2h1.8" /><path {...S} d="M8 20.5h8" opacity=".5" /></svg>;
    case "search":
      return <svg {...p}><circle {...S} cx="10.5" cy="10.5" r="6" /><path {...S} d="m15 15 5 5" /></svg>;
    case "ask": /* a spark: the question handed to Prizm */
      return <svg {...p}><path {...S} d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6.2 6.2l2.6 2.6M15.2 15.2l2.6 2.6M6.2 17.8l2.6-2.6M15.2 8.8l2.6-2.6" /></svg>;
    case "school":
      return <svg {...p}><path {...S} d="M3.5 10 12 5l8.5 5M5.5 11v7.5h13V11" /><path {...S} d="M10 18.5V14h4v4.5" /></svg>;
    case "trust":
      return <svg {...p}><circle {...S} cx="12" cy="6.5" r="2.5" /><circle {...S} cx="6" cy="17" r="2.5" /><circle {...S} cx="18" cy="17" r="2.5" /><path {...S} d="M11 8.8 7.2 14.8M13 8.8l3.8 6M8.5 17h7" /></svg>;
    case "place":
      return <svg {...p}><path {...S} d="M12 20.5s6.5-5.6 6.5-10.7a6.5 6.5 0 0 0-13 0c0 5.1 6.5 10.7 6.5 10.7Z" /><circle {...S} cx="12" cy="9.8" r="2.3" /></svg>;
    case "recent":
      return <svg {...p}><circle {...S} cx="12" cy="12" r="8" /><path {...S} d="M12 7.5V12l3 2" /></svg>;
    case "profile":
      return <svg {...p}><circle {...S} cx="12" cy="8.5" r="3.5" /><path {...S} d="M5 19.5c1.4-3.4 4-5 7-5s5.6 1.6 7 5" /></svg>;
    case "accounts":
      return <svg {...p}><circle {...S} cx="9" cy="9" r="3" /><circle {...S} cx="16.5" cy="10" r="2.3" /><path {...S} d="M3.5 18.5c1-2.9 3-4.3 5.5-4.3s4.5 1.4 5.5 4.3M14.8 14.6c2.2-.3 4 .9 5 3.4" /></svg>;
    case "signout":
      return <svg {...p}><path {...S} d="M14 5h4.5v14H14M10 8l-4 4 4 4M6 12h9" /></svg>;
    default:
      return <svg {...p}><circle {...S} cx="12" cy="12" r="7" /></svg>;
  }
}

/* Horizon is by invitation: added to the rooms only for those who hold it */
export const HORIZON_ROOM = { key: "horizon", to: "/members/horizon", label: "Horizon", verb: "The policy studio", kw: "forecast simulate policy funding accountability send rolls closures model horizon" };
export const roomsFor = (user) => (user && (user.isAdmin || user.horizonAccess) ? [...ROOMS, HORIZON_ROOM] : ROOMS);

export const ROOMS = [
  { key: "home", to: "/members", label: "Home", verb: "Your school at a glance", kw: "home dashboard start overview" },
  { key: "atlas", to: "/members/atlas", label: "Atlas", verb: "Every school in England on one map", kw: "map explore schools filter compare" },
  { key: "prizm", to: "/members/prizm", label: "Prizm", verb: "The report studio", kw: "report analysis question data charts" },
  { key: "lens", to: "/members/lens", label: "Lens", verb: "Your inspection room", kw: "ofsted sef evidence inspection section 48" },
  { key: "orbit", to: "/members/orbit", label: "Orbit", verb: "Strategy in motion", kw: "plan strategy objectives priorities improvement" },
  { key: "constellation", to: "/members/constellation", label: "Constellation", verb: "Every child in view", kw: "pupils children cohort uploads roll tracker" },
];
