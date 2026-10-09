import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@asi/design-system/tokens.css";
import "./app.css";
import App from "./App.jsx";
import { AuthProvider } from "./lib/auth.jsx";

/* Every deploy renames the hashed bundles and removes the old ones, so a tab
   opened before the deploy asks for chunks that no longer exist and strands
   on a dead route. Catch that one failure and step onto the new build. */
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  const k = "asi-reloaded-" + (window.location.pathname || "/");
  let seen = null;
  try { seen = sessionStorage.getItem(k); sessionStorage.setItem(k, "1"); } catch { /* private mode */ }
  if (!seen) window.location.reload();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
