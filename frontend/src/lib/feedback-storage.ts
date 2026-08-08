const STORAGE_KEY = "agmy_rated_messages";

function getRatedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isMessageRated(messageId: string): boolean {
  return getRatedIds().includes(messageId);
}

export function markMessageAsRated(messageId: string): void {
  if (typeof window === "undefined") return;
  const ids = getRatedIds();
  if (!ids.includes(messageId)) {
    ids.push(messageId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}
