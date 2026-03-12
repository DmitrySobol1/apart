import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
if (window.self !== window.top) {
    document.body.classList.add("in-iframe");
}
const rootEl = document.getElementById("root");
if (!rootEl)
    throw new Error("Root element not found");
createRoot(rootEl).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
