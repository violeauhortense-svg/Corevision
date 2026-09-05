// Backend API Configuration
// Determines whether to use local PocketBase or production backend

const isDevelopment = import.meta.env.DEV;

export const apiBaseUrl = isDevelopment
  ? 'http://pc1.tailscale:3000'  // Local backend via Tailscale
  : 'https://corevision-api.onrender.com/make-server-cac859af'; // Production Render

export const projectId = "self-hosted"
export const publicAnonKey = "local-auth"

