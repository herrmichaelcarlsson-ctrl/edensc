const KEY = "daoc-template-builder:voter:v1";

export function getVoterKey(): string {
  if (typeof window === "undefined") return "ssr";
  let k = localStorage.getItem(KEY);
  if (!k) {
    k = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "") + Date.now().toString(36);
    localStorage.setItem(KEY, k);
  }
  return k;
}