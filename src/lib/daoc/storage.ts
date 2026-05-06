import type { Realm, TemplateSlots } from "./types";
import type { SpellcraftMap } from "./spellcraft";

const KEY = "daoc-template-builder:state:v1";

export interface PersistedState {
  realm: Realm | null;
  className: string | null;
  race?: string | null;
  slots: TemplateSlots;
  templateName: string;
  spellcraft?: SpellcraftMap;
  targets?: Partial<Record<string, number>>;
}

export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}