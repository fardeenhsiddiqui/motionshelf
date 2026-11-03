import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/inter";
import "lenis/dist/lenis.css";
import "./styles/tokens.css";
import "./styles.css";
import "./styles/home.css";
import "./styles/gallery.css";
import "./styles/showroom.css";
import { App } from "./App";
import { primeCatalog } from "./lib/useCatalog";

function mount() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Load the catalog first (at most 50 ms) so the first render already has its data.
primeCatalog().then(mount, mount);
