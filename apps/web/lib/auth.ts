'use client';

import { publicBackendUrl } from './api/backend-url';
import { ApiError, type ApiErrorBody } from './api/types';

const TOKEN_KEY = 'maarood.auth-token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  invalidateFollowing();
  window.dispatchEvent(new Event('maarood:auth-change'));
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  invalidateFollowing();
  window.dispatchEvent(new Event('maarood:auth-change'));
}

export type AuthUser = { id: string; email: string };

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${publicBackendUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let body: ApiErrorBody;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      body = { error: { code: 'error', message: res.statusText } };
    }
    throw new ApiError(res.status, body);
  }
  return (await res.json()) as T;
}

export async function signup(email: string, password: string): Promise<AuthUser> {
  const data = await authFetch<{ token: string; user: AuthUser }>('/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await authFetch<{ token: string; user: AuthUser }>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data.user;
}

export async function fetchMe(): Promise<AuthUser | null> {
  if (!getAuthToken()) return null;
  try {
    const data = await authFetch<{ user: AuthUser }>('/v1/auth/me');
    return data.user;
  } catch {
    clearAuthToken();
    return null;
  }
}

export function logout(): void {
  clearAuthToken();
  invalidateFollowing();
}

export type FollowedBrand = {
  merchantId: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  followedAt: string;
};

let followingInflight: Promise<FollowedBrand[]> | null = null;
let followingToken: string | null = null;

export function invalidateFollowing(): void {
  followingInflight = null;
}

export async function listFollowing(): Promise<FollowedBrand[]> {
  const token = getAuthToken();
  if (token !== followingToken) {
    invalidateFollowing();
    followingToken = token;
  }
  if (!followingInflight) {
    const pending = authFetch<{ items: FollowedBrand[] }>('/v1/me/following').then(
      (data) => data.items,
    );
    followingInflight = pending;
    void pending.catch(() => {
      if (followingInflight === pending) followingInflight = null;
    });
  }
  return followingInflight;
}

export async function followBrand(merchantId: string): Promise<void> {
  await authFetch(`/v1/me/following/${encodeURIComponent(merchantId)}`, { method: 'POST' });
  invalidateFollowing();
  window.dispatchEvent(new Event('maarood:following-change'));
}

export async function unfollowBrand(merchantId: string): Promise<void> {
  await authFetch(`/v1/me/following/${encodeURIComponent(merchantId)}`, { method: 'DELETE' });
  invalidateFollowing();
  window.dispatchEvent(new Event('maarood:following-change'));
}
