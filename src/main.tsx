import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Iframe / preview guard for PWA service worker
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
}

createRoot(document.getElementById("root")!).render(<App />);
