import { Suspense, lazy, Component } from "react";

const AtlasApp = lazy(() => import("../atlas/App.jsx"));

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

export default function Atlas() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%",
      overflow: "hidden", transform: "translate(0)" }}>
      <Boundary>
        <Suspense fallback={
          <div style={{ display: "grid", placeItems: "center", height: "100%",
            color: "var(--muted)", fontSize: 14 }}>Loading Atlas\u2026</div>}>
          <AtlasApp />
        </Suspense>
      </Boundary>
    </div>
  );
}
