import { Suspense, lazy, Component, useState } from "react";
import PrismCanvas from "./prism/PrismCanvas.jsx";

const AtlasApp = lazy(() => import("../atlas/App.jsx"));
const Q = "M31.5 31.5 A 18.5 18.5 0 1 1 68.5 31.5 A 18.5 18.5 0 1 1 68.5 68.5 A 18.5 18.5 0 1 1 31.5 68.5 A 18.5 18.5 0 1 1 31.5 31.5 Z";

class Boundary extends Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err)
      return (
        <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
          <div style={{ maxWidth: 420, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
            <p style={{ color: "var(--ink)", fontWeight: 600 }}>Atlas hit turbulence.</p>
            <p>{String(this.state.err?.message || this.state.err).slice(0, 160)}</p>
            <button className="btn line" onClick={() => location.reload()}>Reload Atlas</button>
          </div>
        </div>
      );
    return this.props.children;
  }
}

function Landing({ onMap, onPrism }) {
  const card = {
    background: "#fff", borderRadius: 20, padding: "26px 28px", textAlign: "left",
    boxShadow: "0 1px 2px rgba(34,18,51,.04), 0 18px 50px rgba(34,18,51,.09)",
    border: "none", cursor: "pointer", maxWidth: 340, flex: "1 1 280px", fontFamily: "inherit",
  };
  return (
    <div style={{ height: "100%", overflowY: "auto", background: "#FBFAF7",
      backgroundImage: "radial-gradient(700px 380px at 50% -60px, rgba(106,12,160,.07), transparent 70%)" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "9vh 28px 60px", textAlign: "center" }}>
        <svg viewBox="0 0 100 100" width="44" height="44" style={{ marginBottom: 18 }}>
          <path d={Q} fill="none" stroke="#6A0CA0" strokeWidth="8" />
        </svg>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "clamp(30px,4.5vw,42px)",
          letterSpacing: "-.015em", color: "#221233", margin: 0 }}>Atlas</h1>
        <p style={{ color: "#6F6580", fontSize: 15.5, maxWidth: 460, margin: "12px auto 40px", lineHeight: 1.55 }}>
          Every school in England: 26,553 of them, sixty measures deep. Two ways in.
        </p>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={card} onClick={onMap}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginBottom: 10 }}>Search</div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "#221233", marginBottom: 6 }}>Explore the map</div>
            <p style={{ fontSize: 13.5, color: "#6F6580", margin: 0, lineHeight: 1.5 }}>
              Find any school, filter the system in plain English, compare and profile. "Outstanding Catholic secondaries in London" is a search, not a form.
            </p>
          </button>
          <button style={card} onClick={onPrism}>
            <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "#C6A035", fontWeight: 700, marginBottom: 10 }}>Understand</div>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 19, color: "#221233", marginBottom: 6 }}>
              Ask Prism
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C6A035" strokeWidth="2" style={{ marginLeft: 8 }}>
                <path d="M12 3 3 19h18Z" /><path d="M12 3v16" opacity=".55" />
              </svg>
            </div>
            <p style={{ fontSize: 13.5, color: "#6F6580", margin: 0, lineHeight: 1.5 }}>
              Ask a question and get a canvas of living evidence: charts you can reshape, an argument beneath, a briefing PDF at the end.
            </p>
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: "#6F6580", marginTop: 34 }}>
          Both doors lead everywhere: questions typed into the map's search summon Prism too.
        </p>
      </div>
    </div>
  );
}

export default function Atlas() {
  const [door, setDoor] = useState(() => sessionStorage.getItem("asi-atlas-door") || "");
  const choose = (d) => { sessionStorage.setItem("asi-atlas-door", "map"); setDoor("map");
    if (d === "prism") setTimeout(() => window.dispatchEvent(new CustomEvent("asi-prism", { detail: "" })), 60); };
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", transform: "translate(0)" }}>
      <Boundary>
        {door === "map" ? (
          <Suspense fallback={
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--muted)", fontSize: 14 }}>Loading Atlas…</div>}>
            <AtlasApp />
          </Suspense>
        ) : (
          <Landing onMap={() => choose("map")} onPrism={() => choose("prism")} />
        )}
        <PrismCanvas />
      </Boundary>
    </div>
  );
}
