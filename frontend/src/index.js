import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <GoogleOAuthProvider clientId="520343785570-594m372po5ktoq2t521lsen797c0b73c.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
