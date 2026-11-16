"use client";

import { useSyncExternalStore } from "react";
import {
  createDefaultState,
  decodeState,
  loadState,
  readPrefillGross,
  readSharedParam,
  saveState,
  shareHash,
  updateJobSection,
  withoutSharedParam,
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
  return new URL(path + shareHash(state), window.location.origin).toString();
}

/**
 * If the page was opened from an amount page (#bruto=3500), put that gross
 * salary in the current job and clear the fragment. Other inputs stay as they are.
 */
export function applyGrossPrefillFromLocation() {
  const url = new URL(window.location.href);
  const gross = readPrefillGross(url);
  if (gross === null) return false;
  url.hash = "";
  window.history.replaceState(window.history.state, "", url.toString());
  setJobModel((state) => updateJobSection(state, "current", "salary", { grossMonthly: gross }));
  return true;
}

/**
 * If the page was opened from a shared link, load those inputs and remove the
 * parameter from the address bar. Returns true when a shared state was applied.
 */
export function applySharedStateFromLocation() {
  const url = new URL(window.location.href);
  const encoded = readSharedParam(url);
  if (!encoded) return false;
  const shared = decodeState(encoded);
  window.history.replaceState(window.history.state, "", withoutSharedParam(url).toString());
  if (!shared) return false;
  setJobModel(shared);
  return true;
}
