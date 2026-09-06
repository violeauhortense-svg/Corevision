// API Client for CoreVision
// Uses PocketBase backend via Tailscale

import { apiBaseUrl } from './info';

const BASE_AUTH = `${apiBaseUrl}/auth`;

export async function signIn(email: string, password: string) {
  const response = await fetch(`${BASE_AUTH}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  return response.json();
}

export async function signOut() {
  return fetch(`${BASE_AUTH}/signout`, {
    method: 'POST',
  }).then(() => null);
}

export async function getSession() {
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');

  if (!token || !user) {
    return { session: null };
  }

  return {
    session: {
      access_token: token,
      user: JSON.parse(user),
    },
  };
}
