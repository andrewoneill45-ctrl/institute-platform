/* Orbit · Act — the settled build, full-bleed under the member bar. */
import { useAuth } from "../lib/auth.jsx";

export default function Orbit() {
  const { user } = useAuth();
  return (
    <iframe src={`/orbit/index.html?school=${user?.lens === "ascc" ? "ascc" : "new"}&name=${encodeURIComponent(user?.school || "Your school")}`} title="Orbit"
      style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#FBFAF7" }} />
  );
}
