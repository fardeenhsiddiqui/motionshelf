import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/inter";
import "lenis/dist/lenis.css";
import "./styles/tokens.css";
import "./styles.css";
import "./styles/home.css";
import "./styles/gallery.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
