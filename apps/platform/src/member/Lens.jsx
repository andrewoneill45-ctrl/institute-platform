import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import ReadingDesk from "./ReadingDesk.jsx";
import { keepOriginal } from "../lib/sync.js";

/* Lens · Know — each school's private evidence portal, full-bleed.
   The All Saints account opens the fully modelled instrument; any other
   account opens its own empty Lens that fills as evidence arrives.
   Its Library and Section 48 vault hand files up to the reading desk, which
   reads them here and hands each back filed, with its reading. */
export default function Lens() {
  const { user } = useAuth();
  const mode = user?.lens === "ascc" ? "ascc" : "new";
  const src = `/lens/index.html?school=${mode}&name=${encodeURIComponent(user?.school || user?.scopeName || "Your school")}`;
  const frame = useRef(null);
  const [desk, setDesk] = useState(null);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || !frame.current || e.source !== frame.current.contentWindow) return;
      const d = e.data || {};
      if (d.type === "asi-desk") setDesk({ room: d.room, labels: Array.isArray(d.labels) ? d.labels.slice(0, 30) : [] });
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const onFiled = useCallback((room, item, url, file) => {
    keepOriginal(user, file);
    if (frame.current && frame.current.contentWindow) frame.current.contentWindow.postMessage({ type: "asi-desk-filed", room, item, url }, window.location.origin);
  }, [user]);

  return (
    <>
      <iframe ref={frame} src={src} title="Lens"
        style={{ width: "100%", height: "100%", border: "none", display: "block", background: "#FBFAF7" }} />
      {desk && <ReadingDesk config={desk} onClose={() => setDesk(null)} onFiled={onFiled} />}
    </>
  );
}
