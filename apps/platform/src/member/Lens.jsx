import { useAuth } from "../lib/auth.jsx";

/* Lens · Know — each school's private evidence portal, full-bleed.
   The All Saints account opens the fully modelled instrument; any other
   account opens its own empty Lens that fills as evidence arrives. */
export default function Lens() {
  const { user } = useAuth();
  const mode = user?.lens === "ascc" ? "ascc" : "new";
  const src = `/lens/index.html?school=${mode}&name=${encodeURIComponent(user?.school || "Your school")}`;
  return (
    <iframe src={src} title="Lens"
      style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#FBFAF7" }} />
  );
}
