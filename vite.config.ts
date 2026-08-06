import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Binding to 0.0.0.0 (host: true) is what makes this reachable from other
// devices on your Tailscale network -- Tailscale just routes to whatever
// IP this machine is listening on, there's nothing tailscale-specific to
// configure here.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
