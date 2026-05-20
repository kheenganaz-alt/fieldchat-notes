import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import App from "./App";
import "./styles.css";

CapacitorApp.addListener("appStateChange", ({ isActive }) => {
  if (isActive) window.dispatchEvent(new Event("fieldchat:resume"));
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
