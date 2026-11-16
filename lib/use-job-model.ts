"use client";

import { useSyncExternalStore } from "react";
import {
  createDefaultState,
  decodeState,
  encodeState,
  loadState,
  saveState,
  SHARE_PARAM,
  STORAGE_KEY,
  type KeyValueStorage,
  type NettoplaatjeState,
} from "./job-model.ts";

/**
 * One in-memory store shared by every calculator on the page, persisted to
 * localStorage and kept in sync across browser tabs. The server always renders
 * the defaults; the browser switches to the saved state right after hydration.
 */
const serverSnapshot = createDefaultState();
let snapshot: NettoplaatjeState | null = null;
const listeners = new Set<() => void>();

function browserStorage(): KeyValueStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined; // Access can throw when storage is blocked.
  }
}

function getSnapshot() {
  snapshot ??= loadState(browserStorage());
  return snapshot;
}

function emit() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  snapshot = loadState(browserStorage());
  emit();
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

type Update = NettoplaatjeState | ((current: NettoplaatjeState) => NettoplaatjeState);

export function setJobModel(update: Update) {
  snapshot = typeof update === "function" ? update(getSnapshot()) : update;
  saveState(browserStorage(), snapshot);
  emit();
}

export function resetJobModel() {
  setJobModel(createDefaultState());
}

/** Read the shared state; re-renders when any page or tab changes it. */
export function useJobModel(): [NettoplaatjeState, typeof setJobModel] {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  return [state, setJobModel];
}

/** A link that restores the current inputs on any device. */
export function shareUrl(state: NettoplaatjeState, path = window.location.pathname) {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(SHARE_PARAM, encodeState(state));
  return url.toString();
}

/**
 * If the page was opened from a shared link, load those inputs and remove the
 * parameter from the address bar. Returns true when a shared state was applied.
 */
export function applySharedStateFromLocation() {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get(SHARE_PARAM);
  if (!encoded) return false;
  const shared = decodeState(encoded);
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState(window.history.state, "", url.toString());
  if (!shared) return false;
  setJobModel(shared);
  return true;
}
