import { createRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import "./styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<StartClient />);
