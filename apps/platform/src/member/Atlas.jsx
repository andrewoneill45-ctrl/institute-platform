import { Suspense, lazy } from "react";

/* Atlas · See — the England Schools Explorer, ported.
   The wrapper's transform makes the app's fixed-position UI contain
   itself to this region instead of escaping over the member bar. */
const AtlasApp = lazy(() => import("../atlas/App.jsx"));

export default function Atlas() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%",
      overflow: "hidden", transform: "translate(0)" }}>
      <Suspense fallback={
        <div style={{ display: "grid", placeItems: "center", height: "100%",
          color: "var(--muted)", fontSize: 14 }}>Loading Atlas…</div>}>
        <AtlasApp />
      </Suspense>
    </div>
  );
}
